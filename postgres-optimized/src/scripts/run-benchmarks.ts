import path from "node:path";
import { fileURLToPath } from "node:url";
import { prisma } from "../services/prisma.js";
import { cancelAppointmentPostgres, reserveAppointmentPostgres } from "../services/operations.js";
import { measureOperation, summarizeOperation, buildReport } from "../utils/benchmark.js";
import { writeJsonFile } from "../../../dataset-tools/src/utils/files.js";
import { datasetConfig } from "../../../dataset-tools/src/shared/dataset-config.js";

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const reportsDir = path.resolve(currentDir, "../../../dataset-tools/output/reports");

async function main(): Promise<void> {
  const iterations = datasetConfig.benchmarkIterations;
  const sampleCompany = await prisma.company.findFirst();
  const sampleService = await prisma.service.findFirst();
  const sampleSlots = await prisma.$queryRaw<Array<{ id: string; service_id: string; company_id: string }>>`
    SELECT id, service_id, company_id
    FROM service_slots
    WHERE reserved < capacity
    ORDER BY starts_at ASC
    LIMIT ${iterations}
  `;
  const sampleAppointment = await prisma.appointment.findFirst();

  if (!sampleCompany || !sampleService || sampleSlots.length === 0 || !sampleAppointment) {
    throw new Error("PostgreSQL benchmark requires loaded dataset");
  }

  const bulkInsert = await measureOperation(iterations, async (iteration) => {
    await prisma.company.create({
      data: {
        id: `bench-company-${iteration}`,
        companyCode: `BENCH-${iteration}`,
        name: `Bench Company ${iteration}`,
        email: `bench-company-${iteration}@example.com`,
        passwordHash: "hash",
        city: "Mendoza",
        street: "Bench Street",
        number: "1",
        phone: "2610000000",
        role: "user"
      }
    });
    await prisma.company.delete({
      where: { id: `bench-company-${iteration}` }
    });
  });

  const companyRange = await measureOperation(iterations, async () => {
    await prisma.appointment.findMany({
      where: {
        companyId: sampleCompany.id,
        date: {
          gte: new Date("2026-01-01T00:00:00.000Z"),
          lte: new Date("2026-03-01T00:00:00.000Z")
        }
      }
    });
  });

  const availability = await measureOperation(iterations, async () => {
    await prisma.serviceSlot.findMany({
      where: {
        serviceId: sampleService.id
      },
      orderBy: {
        startsAt: "asc"
      }
    });
  });

  const reservationIds: string[] = [];
  const reserve = await measureOperation(iterations, async (iteration) => {
    const target = sampleSlots[iteration % sampleSlots.length];
    const appointmentId = await reserveAppointmentPostgres(prisma, {
      companyId: target.company_id,
      serviceId: target.service_id,
      slotId: target.id,
      customerIndex: iteration
    });
    reservationIds.push(appointmentId);
  });

  const cancel = await measureOperation(reservationIds.length, async (iteration) => {
    const appointmentId = reservationIds[iteration];
    if (appointmentId) {
      await cancelAppointmentPostgres(prisma, appointmentId);
    }
  });

  const history = await measureOperation(iterations, async () => {
    await prisma.appointment.findMany({
      where: { companyId: sampleCompany.id },
      orderBy: { date: "desc" }
    });
  });

  const report = buildReport({
    operations: [
      summarizeOperation("bulk_insert", "postgres", bulkInsert.durations, bulkInsert.errors),
      summarizeOperation("appointments_by_company_range", "postgres", companyRange.durations, companyRange.errors),
      summarizeOperation("availability_by_service", "postgres", availability.durations, availability.errors),
      summarizeOperation("create_reservation", "postgres", reserve.durations, reserve.errors),
      summarizeOperation("cancel_reservation", "postgres", cancel.durations, cancel.errors),
      summarizeOperation("company_history", "postgres", history.durations, history.errors, {
        sampleAppointmentId: sampleAppointment.id
      })
    ]
  });

  await writeJsonFile(path.join(reportsDir, "postgres-benchmarks.json"), report);
}

main()
  .catch((error) => {
    console.error("PostgreSQL benchmark failed", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

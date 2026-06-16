import path from "node:path";
import { fileURLToPath } from "node:url";
import { env } from "../config/env.js";
import { AppointmentModel } from "../models/appointment.js";
import { CompanyModel } from "../models/company.js";
import { ServiceModel } from "../models/service.js";
import { readDataset } from "../services/dataset-file.js";
import { connectMongo, disconnectMongo } from "../services/mongo.js";
import { cancelAppointmentMongo, reserveAppointmentMongo } from "../services/operations.js";
import { measureOperation, summarizeOperation, buildReport } from "../utils/benchmark.js";
import { writeJsonFile } from "../../../dataset-tools/src/utils/files.js";
import { scaleConfig } from "../../../dataset-tools/src/shared/scales.js";

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const reportsDir = path.resolve(currentDir, "../../../dataset-tools/output/reports");

async function main(): Promise<void> {
  await connectMongo();

  const dataset = await readDataset();
  const scale = dataset.meta.scale;
  const iterations = scaleConfig[scale].benchmarkIterations;
  const sampleCompany = await CompanyModel.findOne().lean();
  const sampleService = await ServiceModel.findOne().lean();
  const sampleAvailableServices = await ServiceModel.find({
    "availableAppointments.0": { $exists: true }
  })
    .limit(iterations)
    .lean();

  if (!sampleCompany || !sampleService || sampleAvailableServices.length === 0) {
    throw new Error("Mongo benchmark requires loaded dataset");
  }

  const companyIds = [...new Set(sampleAvailableServices.map((service) => String(service.companyId)))];
  const companies = await CompanyModel.find({ _id: { $in: companyIds } }).lean();
  const companyKeyById = new Map(companies.map((company) => [String(company._id), company.companyKey]));
  const reservationPool = sampleAvailableServices.flatMap((service) =>
    service.availableAppointments.map((slot) => ({
      companyKey: companyKeyById.get(String(service.companyId)) ?? sampleCompany.companyKey,
      serviceKey: service.serviceKey,
      slotDate: slot.datetime
    }))
  );
  const sampleScheduledAppointment = await AppointmentModel.findOne().lean();
  if (!sampleScheduledAppointment) {
    throw new Error("Mongo benchmark requires at least one appointment");
  }

  const bulkInsert = await measureOperation(iterations, async (iteration) => {
    const benchCompany = await CompanyModel.create({
      companyKey: `bench-company-${iteration}`,
      name: `Bench Company ${iteration}`,
      company_id: `BENCH-${iteration}`,
      email: `bench-company-${iteration}@example.com`,
      password: "hash",
      city: "Mendoza",
      street: "Bench Street",
      number: "1",
      phone: "2610000000",
      role: "user",
      services: [],
      scheduledAppointments: []
    });
    await CompanyModel.deleteOne({ _id: benchCompany._id });
  });

  const companyRange = await measureOperation(iterations, async () => {
    await AppointmentModel.find({
      companyId: sampleCompany._id,
      date: {
        $gte: new Date("2026-01-01T00:00:00.000Z"),
        $lte: new Date("2026-03-01T00:00:00.000Z")
      }
    }).lean();
  });

  const availability = await measureOperation(iterations, async () => {
    await ServiceModel.findById(sampleAvailableServices[0]._id, { availableAppointments: 1 }).lean();
  });

  const reservationKeys: string[] = [];
  const reserve = await measureOperation(iterations, async (iteration) => {
    const target = reservationPool[iteration % reservationPool.length];
    const key = await reserveAppointmentMongo({
      companyKey: target.companyKey,
      serviceKey: target.serviceKey,
      slotDate: target.slotDate,
      customerIndex: iteration
    });
    reservationKeys.push(key);
  });

  const cancel = await measureOperation(reservationKeys.length, async (iteration) => {
    const appointmentKey = reservationKeys[iteration];
    if (appointmentKey) {
      await cancelAppointmentMongo(appointmentKey);
    }
  });

  const history = await measureOperation(iterations, async () => {
    await AppointmentModel.find({ companyId: sampleCompany._id }).sort({ date: -1 }).lean();
  });

  const report = buildReport({
    scale,
    operations: [
      summarizeOperation("bulk_insert", "mongo", scale, bulkInsert.durations, bulkInsert.errors),
      summarizeOperation("appointments_by_company_range", "mongo", scale, companyRange.durations, companyRange.errors),
      summarizeOperation("availability_by_service", "mongo", scale, availability.durations, availability.errors),
      summarizeOperation("create_reservation", "mongo", scale, reserve.durations, reserve.errors),
      summarizeOperation("cancel_reservation", "mongo", scale, cancel.durations, cancel.errors),
      summarizeOperation("company_history", "mongo", scale, history.durations, history.errors, {
        sampleAppointmentKey: sampleScheduledAppointment.appointmentKey
      })
    ]
  });

  await writeJsonFile(path.join(reportsDir, "mongo-benchmarks.json"), report);
  await disconnectMongo();
}

main().catch(async (error) => {
  console.error("Mongo benchmark failed", error);
  await disconnectMongo();
  process.exitCode = 1;
});

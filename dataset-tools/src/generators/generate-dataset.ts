import { mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type {
  AppointmentSeed,
  BookifyDataset,
  CompanySeed,
  DatasetScale,
  ServiceSeed,
  SlotSeed
} from "../shared/dataset.js";
import { createSeededRandom } from "../shared/random.js";
import { scaleConfig } from "../shared/scales.js";
import { writeJsonFile } from "../utils/files.js";

function getArgValue(flag: string): string | undefined {
  const match = process.argv.find((arg) => arg.startsWith(`${flag}=`));
  return match?.split("=")[1];
}

function pickOne<T>(random: () => number, values: T[]): T {
  return values[Math.floor(random() * values.length)];
}

function createDate(dayOffset: number, slotIndex: number): Date {
  return new Date(Date.UTC(2026, 0, 1 + dayOffset, 12 + slotIndex, 0, 0));
}

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const outputDir = path.resolve(currentDir, "../../output/datasets");

async function main(): Promise<void> {
  const scale = (getArgValue("--scale") ?? process.env.DATASET_SCALE ?? "medium") as DatasetScale;
  const seed = Number.parseInt(process.env.DATASET_SEED ?? "42", 10);
  const config = scaleConfig[scale];

  if (!config) {
    throw new Error(`Unsupported scale: ${scale}`);
  }

  const random = createSeededRandom(seed);
  const companies: CompanySeed[] = [];
  const services: ServiceSeed[] = [];
  const slots: SlotSeed[] = [];
  const appointments: AppointmentSeed[] = [];

  let serviceCounter = 1;
  let slotCounter = 1;
  let appointmentCounter = 1;

  for (let companyIndex = 1; companyIndex <= config.companies; companyIndex += 1) {
    const companyId = `company-${String(companyIndex).padStart(3, "0")}`;
    companies.push({
      id: companyId,
      companyCode: `BOOKIFY-${String(companyIndex).padStart(4, "0")}`,
      name: `Company ${companyIndex}`,
      email: `company${companyIndex}@example.com`,
      passwordHash: `hash-${companyIndex}`,
      city: pickOne(random, ["Mendoza", "Buenos Aires", "Cordoba", "Rosario"]),
      street: `Street ${companyIndex}`,
      number: `${100 + companyIndex}`,
      phone: `261${String(100000 + companyIndex).padStart(6, "0")}`,
      role: "user",
      connectedWithMP: false,
      mpAccessToken: "",
      mpRefreshToken: "",
      mpUserId: "",
      createdAt: new Date(Date.UTC(2025, 11, 1)).toISOString(),
      updatedAt: new Date(Date.UTC(2025, 11, 1)).toISOString()
    });

    for (let serviceIndex = 1; serviceIndex <= config.servicesPerCompany; serviceIndex += 1) {
      const serviceId = `service-${String(serviceCounter).padStart(4, "0")}`;
      const capacityPerShift = 1 + Math.floor(random() * 4);
      const duration = pickOne(random, [30, 45, 60, 90]);

      services.push({
        id: serviceId,
        companyId,
        title: `Service ${serviceCounter}`,
        capacityPerShift,
        description: `Synthetic service ${serviceCounter}`,
        duration,
        price: 5000 + Math.floor(random() * 15000),
        signPrice: 1000 + Math.floor(random() * 3000),
        createdAt: new Date(Date.UTC(2025, 11, 15)).toISOString(),
        updatedAt: new Date(Date.UTC(2025, 11, 15)).toISOString()
      });

      for (let dayOffset = 0; dayOffset < config.days; dayOffset += 1) {
        for (let slotIndex = 0; slotIndex < config.slotsPerDay; slotIndex += 1) {
          const slotId = `slot-${String(slotCounter).padStart(6, "0")}`;
          const datetime = createDate(dayOffset, slotIndex);
          const reserved = Math.floor(random() * (capacityPerShift + 1));

          slots.push({
            id: slotId,
            serviceId,
            companyId,
            datetime: datetime.toISOString(),
            capacity: capacityPerShift,
            reserved
          });

          for (let reservationIndex = 0; reservationIndex < reserved; reservationIndex += 1) {
            const appointmentId = `appointment-${String(appointmentCounter).padStart(6, "0")}`;
            appointments.push({
              id: appointmentId,
              companyId,
              serviceId,
              slotId,
              name: `Name${appointmentCounter}`,
              lastName: `Last${appointmentCounter}`,
              email: `customer${appointmentCounter}@example.com`,
              dni: String(30000000 + appointmentCounter),
              phone: `549261${String(appointmentCounter).padStart(7, "0")}`,
              date: datetime.toISOString(),
              paymentId: null,
              status: "scheduled",
              createdAt: datetime.toISOString(),
              updatedAt: datetime.toISOString()
            });
            appointmentCounter += 1;
          }

          slotCounter += 1;
        }
      }

      serviceCounter += 1;
    }
  }

  const dataset: BookifyDataset = {
    meta: {
      seed,
      scale,
      generatedAt: new Date().toISOString(),
      summary: {
        companies: companies.length,
        services: services.length,
        slots: slots.length,
        appointments: appointments.length
      }
    },
    companies,
    services,
    slots,
    appointments
  };

  await mkdir(outputDir, { recursive: true });
  await writeJsonFile(path.join(outputDir, "bookify-dataset.json"), dataset);
  await writeJsonFile(path.join(outputDir, "bookify-dataset-summary.json"), dataset.meta);

  console.log(JSON.stringify(dataset.meta, null, 2));
}

main().catch((error) => {
  console.error("Dataset generation failed", error);
  process.exitCode = 1;
});


import { prisma } from "../services/prisma.js";
import { readDataset } from "../services/dataset-file.js";
import { loadDatasetIntoPostgres } from "../services/load-dataset.js";

async function main(): Promise<void> {
  const dataset = await readDataset();
  await loadDatasetIntoPostgres(dataset);
}

main()
  .catch((error) => {
    console.error("PostgreSQL load failed", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

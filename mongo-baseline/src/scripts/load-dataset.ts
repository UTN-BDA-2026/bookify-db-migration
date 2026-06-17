import { connectMongo, disconnectMongo } from "../services/mongo.js";
import { readDataset } from "../services/dataset-file.js";
import { loadDatasetIntoMongo } from "../services/load-dataset.js";

async function main(): Promise<void> {
  await connectMongo();
  const dataset = await readDataset();
  await loadDatasetIntoMongo(dataset);
  await disconnectMongo();
}

main().catch(async (error) => {
  console.error("Mongo load failed", error);
  await disconnectMongo();
  process.exitCode = 1;
});

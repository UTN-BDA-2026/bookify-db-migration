import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { BookifyDataset } from "../types/dataset.js";

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const defaultDatasetPath = path.resolve(
  currentDir,
  "../../../dataset-tools/output/datasets/bookify-dataset.json"
);

export async function readDataset(
  datasetPath = defaultDatasetPath
): Promise<BookifyDataset> {
  const raw = await readFile(datasetPath, "utf8");
  return JSON.parse(raw) as BookifyDataset;
}

export function resolveDatasetPath(datasetPath?: string): string {
  return datasetPath ?? defaultDatasetPath;
}


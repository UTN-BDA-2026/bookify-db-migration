import { mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { env } from "../config/env.js";
import {
  getMongoContainerUri,
  MONGO_CONTAINER,
  MONGO_CONTAINER_BACKUP_PATH
} from "../utils/backup.js";
import { runCommand } from "../utils/process.js";

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const outputPath = path.resolve(currentDir, "../../backups/mongo-backup.archive.gz");

async function main(): Promise<void> {
  await mkdir(path.dirname(outputPath), { recursive: true });

  await runCommand("docker", [
    "exec",
    MONGO_CONTAINER,
    "mongodump",
    `--uri=${getMongoContainerUri(env.MONGO_URL)}`,
    `--archive=${MONGO_CONTAINER_BACKUP_PATH}`,
    "--gzip"
  ]);

  await runCommand("docker", ["cp", `${MONGO_CONTAINER}:${MONGO_CONTAINER_BACKUP_PATH}`, outputPath]);
}

main().catch((error) => {
  console.error("Mongo backup failed", error);
  process.exitCode = 1;
});

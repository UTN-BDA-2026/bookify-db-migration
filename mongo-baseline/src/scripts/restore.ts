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
const inputPath = path.resolve(currentDir, "../../backups/mongo-backup.archive.gz");

async function main(): Promise<void> {
  await runCommand("docker", ["cp", inputPath, `${MONGO_CONTAINER}:${MONGO_CONTAINER_BACKUP_PATH}`]);

  await runCommand("docker", [
    "exec",
    MONGO_CONTAINER,
    "mongorestore",
    `--uri=${getMongoContainerUri(env.MONGO_URL)}`,
    `--archive=${MONGO_CONTAINER_BACKUP_PATH}`,
    "--gzip",
    "--drop"
  ]);
}

main().catch((error) => {
  console.error("Mongo restore failed", error);
  process.exitCode = 1;
});

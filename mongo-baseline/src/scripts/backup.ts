import path from "node:path";
import { fileURLToPath } from "node:url";
import { env } from "../config/env.js";
import { runCommand } from "../utils/process.js";

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const outputPath = path.resolve(currentDir, "../../backups/mongo-backup.archive.gz");

async function main(): Promise<void> {
  await runCommand("mongodump", [
    `--uri=${env.MONGO_URL}`,
    `--archive=${outputPath}`,
    "--gzip"
  ]);
}

main().catch((error) => {
  console.error("Mongo backup failed", error);
  process.exitCode = 1;
});


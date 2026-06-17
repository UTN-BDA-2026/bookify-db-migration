import path from "node:path";
import { fileURLToPath } from "node:url";
import { env } from "../config/env.js";
import { runCommand } from "../utils/process.js";

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const inputPath = path.resolve(currentDir, "../../backups/mongo-backup.archive.gz");

async function main(): Promise<void> {
  await runCommand("mongorestore", [
    `--uri=${env.MONGO_URL}`,
    `--archive=${inputPath}`,
    "--gzip",
    "--drop"
  ]);
}

main().catch((error) => {
  console.error("Mongo restore failed", error);
  process.exitCode = 1;
});


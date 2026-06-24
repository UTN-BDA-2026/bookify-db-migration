import { mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { env } from "../config.js";
import { runCommand } from "../utils/process.js";

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const outputPath = path.resolve(currentDir, "../../backups/postgres-backup.dump");
const containerBackupPath = "/tmp/bookify-postgres-backup.dump";

async function main(): Promise<void> {
  await mkdir(path.dirname(outputPath), { recursive: true });

  await runCommand("docker", [
    "exec",
    "-e",
    `PGPASSWORD=${env.POSTGRES_PASSWORD}`,
    "bookify-postgres",
    "pg_dump",
    "-U",
    env.POSTGRES_USER,
    "-d",
    env.POSTGRES_DB,
    "-Fc",
    "-f",
    containerBackupPath
  ]);

  await runCommand("docker", [
    "cp",
    `bookify-postgres:${containerBackupPath}`,
    outputPath
  ]);
}

main().catch((error) => {
  console.error("PostgreSQL backup failed", error);
  process.exitCode = 1;
});

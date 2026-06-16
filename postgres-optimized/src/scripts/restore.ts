import path from "node:path";
import { fileURLToPath } from "node:url";
import { env } from "../config.js";
import { runCommand } from "../utils/process.js";

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const inputPath = path.resolve(currentDir, "../../backups/postgres-backup.dump");
const containerBackupPath = "/tmp/bookify-postgres-backup.dump";

async function main(): Promise<void> {
  await runCommand("docker", [
    "cp",
    inputPath,
    `bookify-postgres:${containerBackupPath}`
  ]);

  await runCommand("docker", [
    "exec",
    "-e",
    `PGPASSWORD=${env.POSTGRES_PASSWORD}`,
    "bookify-postgres",
    "pg_restore",
    "--clean",
    "--if-exists",
    "-U",
    env.POSTGRES_USER,
    "-d",
    env.POSTGRES_DB,
    containerBackupPath
  ]);
}

main().catch((error) => {
  console.error("PostgreSQL restore failed", error);
  process.exitCode = 1;
});

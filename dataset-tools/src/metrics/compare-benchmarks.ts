import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { BenchmarkReport } from "../utils/benchmark.js";
import { writeJsonFile, writeTextFile } from "../utils/files.js";

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const reportsDir = path.resolve(currentDir, "../../output/reports");

async function readReport(fileName: string): Promise<BenchmarkReport> {
  const filePath = path.join(reportsDir, fileName);
  const raw = await readFile(filePath, "utf8");
  return JSON.parse(raw) as BenchmarkReport;
}

function toCsv(reports: BenchmarkReport[]): string {
  const lines = ["engine,operation,iterations,total_ms,average_ms,p95_ms,errors"];

  for (const report of reports) {
    for (const operation of report.operations) {
      lines.push(
        [
          report.engine,
          operation.operation,
          operation.iterations,
          operation.totalMs.toFixed(3),
          operation.averageMs.toFixed(3),
          operation.p95Ms.toFixed(3),
          operation.errors
        ].join(",")
      );
    }
  }

  return `${lines.join("\n")}\n`;
}

function toMarkdown(reports: BenchmarkReport[]): string {
  const header = [
    "# Benchmark Comparison",
    "",
    "| Engine | Operation | Iterations | Total ms | Avg ms | P95 ms | Errors |",
    "| --- | --- | ---: | ---: | ---: | ---: | ---: |"
  ];

  const rows = reports.flatMap((report) =>
    report.operations.map(
      (operation) =>
        `| ${report.engine} | ${operation.operation} | ${operation.iterations} | ${operation.totalMs.toFixed(2)} | ${operation.averageMs.toFixed(2)} | ${operation.p95Ms.toFixed(2)} | ${operation.errors} |`
    )
  );

  return `${header.concat(rows).join("\n")}\n`;
}

async function main(): Promise<void> {
  const mongoReport = await readReport("mongo-benchmarks.json");
  const postgresReport = await readReport("postgres-benchmarks.json");
  const reports = [mongoReport, postgresReport];

  await writeJsonFile(path.join(reportsDir, "benchmark-comparison.json"), reports);
  await writeTextFile(path.join(reportsDir, "benchmark-comparison.csv"), toCsv(reports));
  await writeTextFile(path.join(reportsDir, "benchmark-comparison.md"), toMarkdown(reports));

  console.log(
    JSON.stringify(
      {
        generated: [
          "benchmark-comparison.json",
          "benchmark-comparison.csv",
          "benchmark-comparison.md"
        ]
      },
      null,
      2
    )
  );
}

main().catch((error) => {
  console.error("Benchmark comparison failed", error);
  process.exitCode = 1;
});

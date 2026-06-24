import { performance } from "node:perf_hooks";
import type { BenchmarkOperationResult, BenchmarkReport } from "../../../dataset-tools/src/utils/benchmark.js";
import { summarizeOperation } from "../../../dataset-tools/src/utils/benchmark.js";

export async function measureOperation(
  iterations: number,
  runner: (iteration: number) => Promise<void>
): Promise<{ durations: number[]; errors: number }> {
  const durations: number[] = [];
  let errors = 0;

  for (let iteration = 0; iteration < iterations; iteration += 1) {
    const start = performance.now();
    try {
      await runner(iteration);
    } catch (error) {
      errors += 1;
      console.error(error);
    } finally {
      durations.push(performance.now() - start);
    }
  }

  return { durations, errors };
}

export function buildReport(params: { operations: BenchmarkOperationResult[] }): BenchmarkReport {
  return {
    engine: "postgres",
    generatedAt: new Date().toISOString(),
    operations: params.operations
  };
}

export { summarizeOperation };

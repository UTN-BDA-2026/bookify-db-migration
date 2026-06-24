export interface BenchmarkOperationResult {
  operation: string;
  engine: "mongo" | "postgres";
  iterations: number;
  totalMs: number;
  averageMs: number;
  p95Ms: number;
  errors: number;
  metadata?: Record<string, number | string>;
}

export interface BenchmarkReport {
  engine: "mongo" | "postgres";
  generatedAt: string;
  operations: BenchmarkOperationResult[];
}

export function percentile(values: number[], target: number): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.min(sorted.length - 1, Math.ceil((target / 100) * sorted.length) - 1);
  return sorted[index];
}

export function summarizeOperation(
  operation: string,
  engine: "mongo" | "postgres",
  durations: number[],
  errors = 0,
  metadata?: Record<string, number | string>
): BenchmarkOperationResult {
  const totalMs = durations.reduce((sum, value) => sum + value, 0);
  return {
    operation,
    engine,
    iterations: durations.length,
    totalMs,
    averageMs: durations.length > 0 ? totalMs / durations.length : 0,
    p95Ms: percentile(durations, 95),
    errors,
    metadata
  };
}

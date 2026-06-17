import { z } from "zod";
import path from "node:path";
import { fileURLToPath } from "node:url";

process.loadEnvFile?.(
  path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../.env")
);

const envSchema = z.object({
  MONGO_URL: z.string().min(1),
  DATASET_SCALE: z.enum(["small", "medium", "large"]).default("medium"),
  DATASET_SEED: z.string().default("42")
});

export const env = envSchema.parse(process.env);

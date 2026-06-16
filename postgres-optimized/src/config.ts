import { z } from "zod";
import path from "node:path";
import { fileURLToPath } from "node:url";

process.loadEnvFile?.(
  path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../.env")
);

const envSchema = z.object({
  POSTGRES_URL: z.string().min(1),
  POSTGRES_SHADOW_URL: z.string().min(1).optional(),
  POSTGRES_DB: z.string().min(1).default("bookify_optimized"),
  POSTGRES_USER: z.string().min(1).default("postgres"),
  POSTGRES_PASSWORD: z.string().min(1).default("postgres"),
  DATASET_SCALE: z.enum(["small", "medium", "large"]).default("medium")
});

export const env = envSchema.parse(process.env);

import fs from "node:fs";
import path from "node:path";
import dotenv from "dotenv";
import { z } from "zod";

const requiredEnvKeys = ["MONGO_URI", "JWT_SECRET", "JWT_REFRESH_SECRET", "CLIENT_URL"] as const;

function findEnvFile(startDirectory: string) {
  let currentDirectory = startDirectory;
  let parentDirectory = path.dirname(currentDirectory);

  while (parentDirectory !== currentDirectory) {
    const candidate = path.join(currentDirectory, ".env");
    if (fs.existsSync(candidate)) return candidate;

    currentDirectory = parentDirectory;
    parentDirectory = path.dirname(currentDirectory);
  }

  const rootCandidate = path.join(currentDirectory, ".env");
  return fs.existsSync(rootCandidate) ? rootCandidate : undefined;
}

const envFile = findEnvFile(process.cwd());
if (envFile) {
  dotenv.config({ path: envFile });
}

const EnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().default(5000),
  MONGO_URI: z.string().min(1),
  USE_MEMORY_MONGO: z.enum(["true", "false"]).default("false"),
  JWT_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  OPENAI_API_KEY: z.string().optional(),
  ALLOW_AI_FALLBACK: z.enum(["true", "false"]).default("false"),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  GOOGLE_CALLBACK_URL: z.string().url().optional(),
  GOOGLE_PLACES_API_KEY: z.string().optional(),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().default(587),
  SMTP_SECURE: z.enum(["true", "false"]).default("false"),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  MAIL_FROM: z.string().default("TripPlanner AI <no-reply@example.com>"),
  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),
  AWS_BUCKET_NAME: z.string().optional(),
  AWS_REGION: z.string().default("us-east-1"),
  CLIENT_URL: z.string().min(1).default("http://localhost:5173"),
  STORAGE_DRIVER: z.enum(["local", "s3"]).default("local")
});

function logRequiredEnvPresence() {
  if (process.env.NODE_ENV === "test") return;

  const presence = requiredEnvKeys
    .map((key) => `${key}=${process.env[key] ? "present" : "missing"}`)
    .join(", ");
  console.log(`Environment check: ${presence}`);
}

function parseEnv() {
  logRequiredEnvPresence();

  const result = EnvSchema.safeParse(process.env);
  if (result.success) return result.data;

  const issues = result.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`).join("; ");
  console.error(`Environment validation failed: ${issues}`);
  process.exit(1);
}

export const env = parseEnv();

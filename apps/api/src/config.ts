import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
dotenv.config({ path: path.join(root, ".env") });
dotenv.config();

export const env = {
  port: Number(process.env.PORT ?? 3001),
  databaseUrl: process.env.DATABASE_URL ?? "",
  auth: {
    issuer:
      process.env.AUTH_ISSUER ??
      "https://auth.logisly.id/realms/org-wide",
    audience: process.env.AUTH_AUDIENCE ?? "logisly-connect",
    jwksUri:
      process.env.AUTH_JWKS_URI ??
      "https://auth.logisly.id/realms/org-wide/protocol/openid-connect/certs",
  },
  appOrigin: process.env.APP_ORIGIN ?? "http://localhost:5173",
  apiOrigin: process.env.API_ORIGIN ?? "http://localhost:3001",
  adminEmails: (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean),
  storageDir: process.env.STORAGE_DIR
    ? path.resolve(process.env.STORAGE_DIR)
    : path.resolve(root, "storage"),
  runbooksDir: process.env.RUNBOOKS_DIR
    ? path.resolve(process.env.RUNBOOKS_DIR)
    : path.resolve(root, "docs/runbooks"),
  maxUploadBytes: Number(process.env.MAX_UPLOAD_BYTES ?? 20 * 1024 * 1024),
  notifyEmail: process.env.NOTIFY_EMAIL ?? "devops@logisly.com",
  smtp: {
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT ?? 587),
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
    from: process.env.SMTP_FROM ?? "noreply@logisly.com",
  },
  ticketingProvider: process.env.TICKETING_PROVIDER ?? "noop",
  nodeEnv: process.env.NODE_ENV ?? "development",
};

export function assertAuthEnv(): void {
  if (!env.auth.issuer || !env.auth.jwksUri) {
    console.warn("[warn] AUTH_ISSUER / AUTH_JWKS_URI not set — auth will fail");
  }
  if (!env.databaseUrl) {
    throw new Error("DATABASE_URL is required");
  }
}

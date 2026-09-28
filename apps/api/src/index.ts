import express from "express";
import cors from "cors";
import helmet from "helmet";
import { env, assertAuthEnv } from "./config.js";
import { authRouter } from "./routes/auth.js";
import { incidentsRouter, adminRouter } from "./routes/incidents.js";
import { runbooksRouter } from "./routes/runbooks.js";
import { storage } from "./storage.js";
import { requireAuth, getUser } from "./middleware/auth.js";

assertAuthEnv();
await storage.ensureRoot();

const app = express();

app.set("trust proxy", 1);
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" },
  }),
);
app.use(
  cors({
    origin: env.appOrigin,
    credentials: true,
  }),
);
app.use(express.json({ limit: "1mb" }));

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

app.use("/api/auth", authRouter);
app.get("/api/me", requireAuth, (req, res) => {
  const u = getUser(req)!;
  res.json({ id: u.id, email: u.email, name: u.name, role: u.role });
});
app.use("/api/runbooks", runbooksRouter);
app.use("/api/incidents", incidentsRouter);
app.use("/api/admin", adminRouter);

app.use(
  (
    err: Error,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction,
  ) => {
    console.error("[error]", err.message);
    if (err.message?.includes("File too large")) {
      res.status(413).json({ error: "File too large" });
      return;
    }
    res.status(500).json({ error: "Internal server error" });
  },
);

app.listen(env.port, () => {
  console.info(`API listening on ${env.apiOrigin} (port ${env.port})`);
});

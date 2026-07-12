import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { authenticate } from "./middleware/authenticate.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { authRouter } from "./modules/auth/auth.routes.js";
import { vehiclesRouter } from "./modules/vehicles/vehicles.routes.js";
import { driversRouter } from "./modules/drivers/drivers.routes.js";
import { tripsRouter } from "./modules/trips/trips.routes.js";
import { maintenanceRouter } from "./modules/maintenance/maintenance.routes.js";
import { fuelRouter, expensesRouter } from "./modules/fuel-expense/fuelExpense.routes.js";
import { dashboardRouter } from "./modules/dashboard/dashboard.routes.js";
import { reportsRouter } from "./modules/reports/reports.routes.js";
import { documentsRouter } from "./modules/documents/documents.routes.js";
import { remindersRouter } from "./modules/reminders/reminders.routes.js";
import { assistantRouter } from "./modules/assistant/assistant.routes.js";

export function createApp() {
  const app = express();

  // Security headers (CSP disabled — this API only serves JSON; the SPA is served by Vite).
  app.use(helmet({ contentSecurityPolicy: false }));
  app.use(cors({ origin: process.env.CLIENT_URL ?? "*" }));
  // Cap request bodies to blunt payload-based abuse.
  app.use(express.json({ limit: "1mb" }));

  app.get("/api/health", (_req, res) => res.json({ data: "ok", error: null }));

  // Throttle credential endpoints to slow brute-force / credential-stuffing.
  // Scoped to login & register only — /auth/me runs on every page load and
  // must not be throttled, or a user refreshing repeatedly would get locked out.
  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 30,
    standardHeaders: true,
    legacyHeaders: false,
    message: { data: null, error: "Too many attempts. Please wait a few minutes and try again." },
  });

  // Public
  app.use("/api/auth/login", authLimiter);
  app.use("/api/auth/register", authLimiter);
  app.use("/api/auth", authRouter);

  // Protected — everything below requires a valid token
  app.use("/api/vehicles", authenticate, vehiclesRouter);
  app.use("/api/drivers", authenticate, driversRouter);
  app.use("/api/trips", authenticate, tripsRouter);
  app.use("/api/maintenance", authenticate, maintenanceRouter);
  app.use("/api/fuel", authenticate, fuelRouter);
  app.use("/api/expenses", authenticate, expensesRouter);
  app.use("/api/dashboard", authenticate, dashboardRouter);
  app.use("/api/reports", authenticate, reportsRouter);
  app.use("/api/documents", authenticate, documentsRouter);
  app.use("/api/reminders", authenticate, remindersRouter);
  app.use("/api/assistant", authenticate, assistantRouter);

  app.use(errorHandler);
  return app;
}

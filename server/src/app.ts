import express from "express";
import cors from "cors";
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

export function createApp() {
  const app = express();
  app.use(cors({ origin: process.env.CLIENT_URL ?? "*" }));
  app.use(express.json());

  app.get("/api/health", (_req, res) => res.json({ data: "ok", error: null }));

  // Public
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

  app.use(errorHandler);
  return app;
}

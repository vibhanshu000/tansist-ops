import { Router } from "express";
import { ok, wrap } from "../../lib/http.js";
import { requireRole } from "../../middleware/requireRole.js";
import { findExpiringLicenses, sendExpiryReminders } from "./reminders.service.js";

export const remindersRouter = Router();

// GET /reminders/expiring-licenses?days=30
remindersRouter.get(
  "/expiring-licenses",
  wrap(async (req, res) => {
    const days = Number((req.query as any).days ?? 30);
    const list = await findExpiringLicenses(days);
    return ok(res, list);
  })
);

// POST /reminders/send — trigger reminder emails (Fleet Manager / Safety Officer)
remindersRouter.post(
  "/send",
  requireRole("FleetManager", "SafetyOfficer"),
  wrap(async (req, res) => {
    const days = Number((req.body as any)?.days ?? 30);
    const result = await sendExpiryReminders(days);
    return ok(res, result);
  })
);

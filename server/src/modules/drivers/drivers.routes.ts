import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../lib/prisma.js";
import { ok, wrap } from "../../lib/http.js";
import { AppError } from "../../middleware/errorHandler.js";
import { requireRole } from "../../middleware/requireRole.js";

export const driversRouter = Router();

// RBAC: Fleet Manager and Safety Officer manage driver profiles/compliance.
const canManage = requireRole("FleetManager", "SafetyOfficer");

const driverSchema = z.object({
  name: z.string().min(1),
  licenseNumber: z.string().min(1),
  licenseCategory: z.string().min(1),
  licenseExpiry: z.coerce.date(),
  contact: z.string().min(1),
  safetyScore: z.number().min(0).max(100).default(100),
  status: z.enum(["Available", "OnTrip", "OffDuty", "Suspended"]).default("Available"),
});

// GET /drivers?status=&search=
driversRouter.get(
  "/",
  wrap(async (req, res) => {
    const { status, search } = req.query as Record<string, string>;
    const where: any = {};
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { licenseNumber: { contains: search } },
      ];
    }
    const drivers = await prisma.driver.findMany({ where, orderBy: { id: "desc" } });
    return ok(res, drivers);
  })
);

// GET /drivers/available — dispatch pool. Available, not Suspended, license not expired.
driversRouter.get(
  "/available",
  wrap(async (_req, res) => {
    const drivers = await prisma.driver.findMany({
      where: { status: "Available", licenseExpiry: { gt: new Date() } },
      orderBy: { name: "asc" },
    });
    return ok(res, drivers);
  })
);

driversRouter.get(
  "/:id",
  wrap(async (req, res) => {
    const driver = await prisma.driver.findUnique({ where: { id: Number(req.params.id) } });
    if (!driver) throw new AppError("Driver not found", 404);
    return ok(res, driver);
  })
);

driversRouter.post(
  "/",
  canManage,
  wrap(async (req, res) => {
    const input = driverSchema.parse(req.body);
    const driver = await prisma.driver.create({ data: input });
    return ok(res, driver, 201);
  })
);

driversRouter.put(
  "/:id",
  canManage,
  wrap(async (req, res) => {
    const input = driverSchema.partial().parse(req.body);
    const driver = await prisma.driver.update({
      where: { id: Number(req.params.id) },
      data: input,
    });
    return ok(res, driver);
  })
);

driversRouter.delete(
  "/:id",
  canManage,
  wrap(async (req, res) => {
    await prisma.driver.delete({ where: { id: Number(req.params.id) } });
    return ok(res, { deleted: true });
  })
);

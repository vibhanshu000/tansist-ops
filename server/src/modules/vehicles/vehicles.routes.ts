import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../lib/prisma.js";
import { ok, wrap } from "../../lib/http.js";
import { AppError } from "../../middleware/errorHandler.js";
import { requireRole } from "../../middleware/requireRole.js";

export const vehiclesRouter = Router();

// RBAC: only Fleet Manager creates/edits/retires vehicles. Everyone authenticated can read.
const canManage = requireRole("FleetManager");

const vehicleSchema = z.object({
  regNumber: z.string().min(1),
  name: z.string().min(1),
  type: z.string().min(1),
  maxLoadKg: z.number().positive(),
  odometer: z.number().min(0).default(0),
  acquisitionCost: z.number().min(0).default(0),
  region: z.string().default(""),
  status: z.enum(["Available", "OnTrip", "InShop", "Retired"]).default("Available"),
  fuelLevel: z.number().min(0).default(0),
  fuelCapacity: z.number().positive().default(100),
  fuelEfficiencyKmpl: z.number().positive().default(8),
});

// GET /vehicles?status=&type=&region=&search=
vehiclesRouter.get(
  "/",
  wrap(async (req, res) => {
    const { status, type, region, search } = req.query as Record<string, string>;
    const where: any = {};
    if (status) where.status = status;
    if (type) where.type = type;
    if (region) where.region = region;
    if (search) {
      where.OR = [
        { regNumber: { contains: search } },
        { name: { contains: search } },
      ];
    }
    const vehicles = await prisma.vehicle.findMany({ where, orderBy: { id: "desc" } });
    return ok(res, vehicles);
  })
);

// GET /vehicles/available — dispatch pool (Ajay). Only Available.
vehiclesRouter.get(
  "/available",
  wrap(async (_req, res) => {
    const vehicles = await prisma.vehicle.findMany({
      where: { status: "Available" },
      orderBy: { regNumber: "asc" },
    });
    return ok(res, vehicles);
  })
);

vehiclesRouter.get(
  "/:id",
  wrap(async (req, res) => {
    const vehicle = await prisma.vehicle.findUnique({ where: { id: Number(req.params.id) } });
    if (!vehicle) throw new AppError("Vehicle not found", 404);
    return ok(res, vehicle);
  })
);

vehiclesRouter.post(
  "/",
  canManage,
  wrap(async (req, res) => {
    const input = vehicleSchema.parse(req.body);
    const vehicle = await prisma.vehicle.create({ data: input });
    return ok(res, vehicle, 201);
  })
);

vehiclesRouter.put(
  "/:id",
  canManage,
  wrap(async (req, res) => {
    const input = vehicleSchema.partial().parse(req.body);
    const vehicle = await prisma.vehicle.update({
      where: { id: Number(req.params.id) },
      data: input,
    });
    return ok(res, vehicle);
  })
);

vehiclesRouter.delete(
  "/:id",
  canManage,
  wrap(async (req, res) => {
    await prisma.vehicle.delete({ where: { id: Number(req.params.id) } });
    return ok(res, { deleted: true });
  })
);

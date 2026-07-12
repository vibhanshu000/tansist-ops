import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../lib/prisma.js";
import { ok, wrap } from "../../lib/http.js";
import { AppError } from "../../middleware/errorHandler.js";
import { requireRole } from "../../middleware/requireRole.js";

export const maintenanceRouter = Router();

// RBAC: only Fleet Manager manages maintenance records.
const canManage = requireRole("FleetManager");

const createSchema = z.object({
  vehicleId: z.number().int(),
  type: z.string().min(1),
  cost: z.number().min(0).default(0),
  date: z.coerce.date().optional(),
  notes: z.string().default(""),
});

// GET /maintenance?vehicleId=
maintenanceRouter.get(
  "/",
  wrap(async (req, res) => {
    const { vehicleId } = req.query as Record<string, string>;
    const where: any = {};
    if (vehicleId) where.vehicleId = Number(vehicleId);
    const records = await prisma.maintenance.findMany({
      where,
      orderBy: { id: "desc" },
      include: { vehicle: true },
    });
    return ok(res, records);
  })
);

// POST /maintenance — Rule 9: active record -> vehicle InShop
maintenanceRouter.post(
  "/",
  canManage,
  wrap(async (req, res) => {
    const input = createSchema.parse(req.body);
    const vehicle = await prisma.vehicle.findUnique({ where: { id: input.vehicleId } });
    if (!vehicle) throw new AppError("Vehicle not found", 404);
    if (vehicle.status === "OnTrip") throw new AppError("Vehicle is On Trip; complete the trip first");
    if (vehicle.status === "Retired") throw new AppError("Vehicle is Retired");

    const record = await prisma.$transaction(async (tx) => {
      const created = await tx.maintenance.create({ data: { ...input, isActive: true } });
      await tx.vehicle.update({ where: { id: input.vehicleId }, data: { status: "InShop" } });
      return created;
    });
    return ok(res, record, 201);
  })
);

// POST /maintenance/:id/close — Rule 10: vehicle -> Available (unless Retired)
maintenanceRouter.post(
  "/:id/close",
  canManage,
  wrap(async (req, res) => {
    const id = Number(req.params.id);
    const record = await prisma.maintenance.findUnique({ where: { id } });
    if (!record) throw new AppError("Maintenance record not found", 404);

    const updated = await prisma.$transaction(async (tx) => {
      const closed = await tx.maintenance.update({ where: { id }, data: { isActive: false } });
      const vehicle = await tx.vehicle.findUnique({ where: { id: record.vehicleId } });
      if (vehicle && vehicle.status !== "Retired") {
        await tx.vehicle.update({ where: { id: record.vehicleId }, data: { status: "Available" } });
      }
      return closed;
    });
    return ok(res, updated);
  })
);

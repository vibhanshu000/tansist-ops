import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../lib/prisma.js";
import { ok, wrap } from "../../lib/http.js";
import { requireRole } from "../../middleware/requireRole.js";

export const fuelRouter = Router();
export const expensesRouter = Router();

// RBAC: Financial Analyst logs fuel/expenses.
const canManage = requireRole("FinancialAnalyst");

const fuelSchema = z.object({
  vehicleId: z.number().int(),
  liters: z.number().positive(),
  cost: z.number().min(0),
  date: z.coerce.date().optional(),
});

const expenseSchema = z.object({
  vehicleId: z.number().int(),
  type: z.enum(["toll", "maintenance", "other"]),
  amount: z.number().min(0),
  date: z.coerce.date().optional(),
});

fuelRouter.get(
  "/",
  wrap(async (req, res) => {
    const { vehicleId } = req.query as Record<string, string>;
    const where: any = {};
    if (vehicleId) where.vehicleId = Number(vehicleId);
    const logs = await prisma.fuelLog.findMany({ where, orderBy: { id: "desc" }, include: { vehicle: true } });
    return ok(res, logs);
  })
);

fuelRouter.post(
  "/",
  canManage,
  wrap(async (req, res) => {
    const input = fuelSchema.parse(req.body);
    const log = await prisma.$transaction(async (tx) => {
      const created = await tx.fuelLog.create({ data: input });
      // Refueling tops up the vehicle's tank, capped at its capacity.
      const vehicle = await tx.vehicle.findUnique({ where: { id: input.vehicleId } });
      if (vehicle) {
        const newLevel = Math.min(vehicle.fuelCapacity, vehicle.fuelLevel + input.liters);
        await tx.vehicle.update({ where: { id: input.vehicleId }, data: { fuelLevel: newLevel } });
      }
      return created;
    });
    return ok(res, log, 201);
  })
);

expensesRouter.get(
  "/",
  wrap(async (req, res) => {
    const { vehicleId } = req.query as Record<string, string>;
    const where: any = {};
    if (vehicleId) where.vehicleId = Number(vehicleId);
    const items = await prisma.expense.findMany({ where, orderBy: { id: "desc" }, include: { vehicle: true } });
    return ok(res, items);
  })
);

expensesRouter.post(
  "/",
  canManage,
  wrap(async (req, res) => {
    const input = expenseSchema.parse(req.body);
    const item = await prisma.expense.create({ data: input });
    return ok(res, item, 201);
  })
);

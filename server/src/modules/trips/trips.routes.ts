import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../lib/prisma.js";
import { ok, wrap } from "../../lib/http.js";
import { AppError } from "../../middleware/errorHandler.js";
import { requireRole } from "../../middleware/requireRole.js";

export const tripsRouter = Router();

// RBAC: Drivers create/dispatch/complete/cancel trips. Safety Officers view only.
const canManage = requireRole("Driver");

const createSchema = z.object({
  source: z.string().min(1),
  destination: z.string().min(1),
  vehicleId: z.number().int(),
  driverId: z.number().int(),
  cargoWeight: z.number().positive(),
  plannedDistance: z.number().positive(),
});

const completeSchema = z.object({
  finalOdometer: z.number().min(0),
  fuelConsumed: z.number().min(0),
  revenue: z.number().min(0).default(0),
});

// GET /trips?status=
tripsRouter.get(
  "/",
  wrap(async (req, res) => {
    const { status } = req.query as Record<string, string>;
    const where: any = {};
    if (status) where.status = status;
    const trips = await prisma.trip.findMany({
      where,
      orderBy: { id: "desc" },
      include: { vehicle: true, driver: true },
    });
    return ok(res, trips);
  })
);

// POST /trips — create Draft with all validations
tripsRouter.post(
  "/",
  canManage,
  wrap(async (req, res) => {
    const input = createSchema.parse(req.body);

    const vehicle = await prisma.vehicle.findUnique({ where: { id: input.vehicleId } });
    if (!vehicle) throw new AppError("Vehicle not found", 404);
    const driver = await prisma.driver.findUnique({ where: { id: input.driverId } });
    if (!driver) throw new AppError("Driver not found", 404);

    // Rule 2: Retired / In Shop / On Trip vehicles cannot be dispatched
    if (vehicle.status !== "Available") {
      throw new AppError(`Vehicle is ${vehicle.status} and cannot be assigned`);
    }
    // Rule 4: driver already On Trip / rule 3: Suspended
    if (driver.status !== "Available") {
      throw new AppError(`Driver is ${driver.status} and cannot be assigned`);
    }
    // Rule 3: expired license
    if (new Date(driver.licenseExpiry) <= new Date()) {
      throw new AppError("Driver's license is expired and cannot be assigned");
    }
    // Rule 5: cargo weight <= max load
    if (input.cargoWeight > vehicle.maxLoadKg) {
      throw new AppError(
        `Cargo weight ${input.cargoWeight}kg exceeds vehicle capacity ${vehicle.maxLoadKg}kg`
      );
    }

    // New rule: vehicle must have enough fuel in the tank for the planned distance.
    const requiredFuel = input.plannedDistance / (vehicle.fuelEfficiencyKmpl || 1);
    if (vehicle.fuelLevel < requiredFuel) {
      throw new AppError(
        `Vehicle ${vehicle.regNumber} has insufficient fuel: ${vehicle.fuelLevel.toFixed(1)}L in tank, ` +
          `but this trip needs about ${requiredFuel.toFixed(1)}L (${vehicle.fuelEfficiencyKmpl} km/L over ${input.plannedDistance}km). ` +
          `Refuel the vehicle or choose another one.`
      );
    }

    const trip = await prisma.trip.create({ data: { ...input, status: "Draft" } });
    return ok(res, trip, 201);
  })
);

// POST /trips/:id/dispatch — Rule 6: vehicle + driver -> OnTrip (atomic)
tripsRouter.post(
  "/:id/dispatch",
  canManage,
  wrap(async (req, res) => {
    const id = Number(req.params.id);
    const trip = await prisma.trip.findUnique({ where: { id } });
    if (!trip) throw new AppError("Trip not found", 404);
    if (trip.status !== "Draft") throw new AppError(`Only Draft trips can be dispatched (this is ${trip.status})`);

    const vehicle = await prisma.vehicle.findUnique({ where: { id: trip.vehicleId } });
    const driver = await prisma.driver.findUnique({ where: { id: trip.driverId } });
    if (vehicle?.status !== "Available") throw new AppError(`Vehicle is ${vehicle?.status}, cannot dispatch`);
    if (driver?.status !== "Available") throw new AppError(`Driver is ${driver?.status}, cannot dispatch`);
    if (new Date(driver.licenseExpiry) <= new Date()) throw new AppError("Driver license expired");

    // Re-check fuel at dispatch time too, since the tank level may have changed since the trip was drafted.
    const requiredFuel = trip.plannedDistance / (vehicle.fuelEfficiencyKmpl || 1);
    if (vehicle.fuelLevel < requiredFuel) {
      throw new AppError(
        `Vehicle ${vehicle.regNumber} has insufficient fuel to dispatch: ${vehicle.fuelLevel.toFixed(1)}L in tank, ` +
          `needs about ${requiredFuel.toFixed(1)}L for this trip. Refuel before dispatching.`
      );
    }

    const updated = await prisma.$transaction(async (tx) => {
      await tx.vehicle.update({ where: { id: trip.vehicleId }, data: { status: "OnTrip" } });
      await tx.driver.update({ where: { id: trip.driverId }, data: { status: "OnTrip" } });
      return tx.trip.update({ where: { id }, data: { status: "Dispatched" } });
    });
    return ok(res, updated);
  })
);

// POST /trips/:id/complete — Rule 7: back to Available, update odometer
tripsRouter.post(
  "/:id/complete",
  canManage,
  wrap(async (req, res) => {
    const id = Number(req.params.id);
    const input = completeSchema.parse(req.body);
    const trip = await prisma.trip.findUnique({ where: { id } });
    if (!trip) throw new AppError("Trip not found", 404);
    if (trip.status !== "Dispatched") throw new AppError(`Only Dispatched trips can be completed (this is ${trip.status})`);

    const vehicleBefore = await prisma.vehicle.findUnique({ where: { id: trip.vehicleId } });
    const remainingFuel = Math.max(0, (vehicleBefore?.fuelLevel ?? 0) - input.fuelConsumed);

    const updated = await prisma.$transaction(async (tx) => {
      await tx.vehicle.update({
        where: { id: trip.vehicleId },
        data: { status: "Available", odometer: input.finalOdometer, fuelLevel: remainingFuel },
      });
      await tx.driver.update({ where: { id: trip.driverId }, data: { status: "Available" } });
      return tx.trip.update({
        where: { id },
        data: {
          status: "Completed",
          finalOdometer: input.finalOdometer,
          fuelConsumed: input.fuelConsumed,
          revenue: input.revenue,
        },
      });
    });
    return ok(res, updated);
  })
);

// POST /trips/:id/cancel — Rule 8: restore to Available if it was dispatched
tripsRouter.post(
  "/:id/cancel",
  canManage,
  wrap(async (req, res) => {
    const id = Number(req.params.id);
    const trip = await prisma.trip.findUnique({ where: { id } });
    if (!trip) throw new AppError("Trip not found", 404);
    if (trip.status === "Completed" || trip.status === "Cancelled") {
      throw new AppError(`Cannot cancel a ${trip.status} trip`);
    }

    const updated = await prisma.$transaction(async (tx) => {
      if (trip.status === "Dispatched") {
        await tx.vehicle.update({ where: { id: trip.vehicleId }, data: { status: "Available" } });
        await tx.driver.update({ where: { id: trip.driverId }, data: { status: "Available" } });
      }
      return tx.trip.update({ where: { id }, data: { status: "Cancelled" } });
    });
    return ok(res, updated);
  })
);

import { Router } from "express";
import { prisma } from "../../lib/prisma.js";
import { ok, wrap } from "../../lib/http.js";

export const dashboardRouter = Router();

// GET /dashboard/kpis?type=&status=&region=
dashboardRouter.get(
  "/kpis",
  wrap(async (req, res) => {
    const { type, region } = req.query as Record<string, string>;
    const vWhere: any = {};
    if (type) vWhere.type = type;
    if (region) vWhere.region = region;

    const vehicles = await prisma.vehicle.findMany({ where: vWhere });
    const drivers = await prisma.driver.findMany();
    const trips = await prisma.trip.findMany();

    const nonRetired = vehicles.filter((v) => v.status !== "Retired");
    const onTrip = vehicles.filter((v) => v.status === "OnTrip").length;

    const kpis = {
      activeVehicles: vehicles.filter((v) => v.status === "OnTrip").length,
      availableVehicles: vehicles.filter((v) => v.status === "Available").length,
      inMaintenance: vehicles.filter((v) => v.status === "InShop").length,
      activeTrips: trips.filter((t) => t.status === "Dispatched").length,
      pendingTrips: trips.filter((t) => t.status === "Draft").length,
      driversOnDuty: drivers.filter((d) => d.status === "OnTrip").length,
      fleetUtilization: nonRetired.length ? Math.round((onTrip / nonRetired.length) * 100) : 0,
    };
    return ok(res, kpis);
  })
);

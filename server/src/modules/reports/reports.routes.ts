import { Router } from "express";
import PDFDocument from "pdfkit";
import { prisma } from "../../lib/prisma.js";
import { ok, wrap } from "../../lib/http.js";

export const reportsRouter = Router();

// Compute per-vehicle metrics.
async function computeVehicleMetrics(vehicleId: number) {
  const vehicle = await prisma.vehicle.findUnique({ where: { id: vehicleId } });
  if (!vehicle) return null;

  const trips = await prisma.trip.findMany({ where: { vehicleId, status: "Completed" } });
  const fuelLogs = await prisma.fuelLog.findMany({ where: { vehicleId } });
  const maintenances = await prisma.maintenance.findMany({ where: { vehicleId } });
  const expenses = await prisma.expense.findMany({ where: { vehicleId } });

  const totalDistance = trips.reduce((s, t) => s + (t.plannedDistance ?? 0), 0);
  const tripFuel = trips.reduce((s, t) => s + (t.fuelConsumed ?? 0), 0);
  const loggedFuel = fuelLogs.reduce((s, f) => s + f.liters, 0);
  const totalFuelLiters = tripFuel + loggedFuel;

  const fuelCost = fuelLogs.reduce((s, f) => s + f.cost, 0);
  const maintenanceCost =
    maintenances.reduce((s, m) => s + m.cost, 0) +
    expenses.filter((e) => e.type === "maintenance").reduce((s, e) => s + e.amount, 0);
  const otherExpenses = expenses.filter((e) => e.type !== "maintenance").reduce((s, e) => s + e.amount, 0);
  const revenue = trips.reduce((s, t) => s + (t.revenue ?? 0), 0);

  const operationalCost = fuelCost + maintenanceCost + otherExpenses;
  const fuelEfficiency = totalFuelLiters > 0 ? +(totalDistance / totalFuelLiters).toFixed(2) : 0;
  const roi =
    vehicle.acquisitionCost > 0
      ? +(((revenue - (maintenanceCost + fuelCost)) / vehicle.acquisitionCost).toFixed(3))
      : 0;

  return {
    vehicleId,
    regNumber: vehicle.regNumber,
    name: vehicle.name,
    status: vehicle.status,
    totalDistance,
    totalFuelLiters: +totalFuelLiters.toFixed(2),
    fuelEfficiency,
    fuelCost,
    maintenanceCost,
    operationalCost,
    revenue,
    roi,
  };
}

reportsRouter.get(
  "/vehicle/:id",
  wrap(async (req, res) => {
    const metrics = await computeVehicleMetrics(Number(req.params.id));
    if (!metrics) return ok(res, null);
    return ok(res, metrics);
  })
);

reportsRouter.get(
  "/fleet",
  wrap(async (_req, res) => {
    const vehicles = await prisma.vehicle.findMany();
    const rows = [];
    for (const v of vehicles) {
      const m = await computeVehicleMetrics(v.id);
      if (m) rows.push(m);
    }
    return ok(res, rows);
  })
);

// GET /reports/export.csv
reportsRouter.get(
  "/export.csv",
  wrap(async (_req, res) => {
    const vehicles = await prisma.vehicle.findMany();
    const rows = [];
    for (const v of vehicles) {
      const m = await computeVehicleMetrics(v.id);
      if (m) rows.push(m);
    }
    const headers = [
      "regNumber", "name", "status", "totalDistance", "totalFuelLiters",
      "fuelEfficiency", "fuelCost", "maintenanceCost", "operationalCost", "revenue", "roi",
    ];
    const csv = [
      headers.join(","),
      ...rows.map((r) => headers.map((h) => (r as any)[h]).join(",")),
    ].join("\n");

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", 'attachment; filename="fleet-report.csv"');
    return res.send(csv);
  })
);

// GET /reports/export.pdf — bonus feature: PDF export of the fleet report
reportsRouter.get(
  "/export.pdf",
  wrap(async (_req, res) => {
    const vehicles = await prisma.vehicle.findMany();
    const rows = [];
    for (const v of vehicles) {
      const m = await computeVehicleMetrics(v.id);
      if (m) rows.push(m);
    }

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", 'attachment; filename="fleet-report.pdf"');

    const doc = new PDFDocument({ margin: 40, size: "A4" });
    doc.pipe(res);

    doc.fontSize(20).fillColor("#4F46E5").text("TransitOps — Fleet Report", { align: "left" });
    doc.moveDown(0.3);
    doc.fontSize(10).fillColor("#64748B").text(`Generated ${new Date().toLocaleString()}`);
    doc.moveDown(1);

    const colX = [40, 110, 190, 250, 320, 390, 460];
    const headers = ["Vehicle", "Distance", "Fuel(L)", "Efficiency", "Op.Cost", "Revenue", "ROI"];
    doc.fontSize(9).fillColor("#0F172A");
    headers.forEach((h, i) => doc.text(h, colX[i], doc.y, { continued: false, width: 80 }));
    doc.moveDown(0.5);
    doc.moveTo(40, doc.y).lineTo(560, doc.y).strokeColor("#E2E8F0").stroke();
    doc.moveDown(0.3);

    for (const r of rows) {
      const y = doc.y;
      doc.fontSize(9).fillColor("#0F172A");
      doc.text(r.regNumber, colX[0], y, { width: 65 });
      doc.text(`${r.totalDistance} km`, colX[1], y, { width: 70 });
      doc.text(`${r.totalFuelLiters}`, colX[2], y, { width: 55 });
      doc.text(`${r.fuelEfficiency}`, colX[3], y, { width: 65 });
      doc.text(`Rs.${r.operationalCost}`, colX[4], y, { width: 65 });
      doc.text(`Rs.${r.revenue}`, colX[5], y, { width: 65 });
      doc.fillColor(r.roi >= 0 ? "#16A34A" : "#DC2626").text(`${r.roi}`, colX[6], y, { width: 60 });
      doc.moveDown(0.6);
    }

    doc.end();
  })
);

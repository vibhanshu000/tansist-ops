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

    const PAGE_LEFT = 40;
    const PAGE_RIGHT = doc.page.width - 40; // 555.28 on A4
    const CONTENT_WIDTH = PAGE_RIGHT - PAGE_LEFT;
    const ROW_HEIGHT = 22;
    const HEADER_HEIGHT = 24;
    const PAGE_BOTTOM = doc.page.height - 50;
    const CELL_PAD = 6;

    const nf = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 2 });
    const fmt = (n: number) => nf.format(n ?? 0);
    const money = (n: number) => `Rs. ${nf.format(n ?? 0)}`; // pdfkit's default font lacks the ₹ glyph

    // Column definitions. Widths sum to CONTENT_WIDTH (515) so the table fills
    // the page cleanly; x positions are derived once below.
    type Align = "left" | "right";
    interface Col {
      key: string;
      label: string;
      width: number;
      align: Align;
      x: number;
    }
    const columns: Col[] = [
      { key: "vehicle", label: "Vehicle", width: 90, align: "left", x: 0 },
      { key: "distance", label: "Distance", width: 70, align: "right", x: 0 },
      { key: "fuel", label: "Fuel (L)", width: 60, align: "right", x: 0 },
      { key: "efficiency", label: "Efficiency", width: 75, align: "right", x: 0 },
      { key: "opcost", label: "Op. Cost", width: 80, align: "right", x: 0 },
      { key: "revenue", label: "Revenue", width: 80, align: "right", x: 0 },
      { key: "roi", label: "ROI", width: 60, align: "right", x: 0 },
    ];
    let cursorX = PAGE_LEFT;
    for (const c of columns) {
      c.x = cursorX;
      cursorX += c.width;
    }

    function drawRow(rowY: number, cells: Record<string, string>, opts: { header?: boolean; roi?: number } = {}) {
      if (opts.header) {
        doc.rect(PAGE_LEFT, rowY, CONTENT_WIDTH, HEADER_HEIGHT).fill("#4F46E5");
      }
      const textY = rowY + (opts.header ? 8 : 7);
      for (const c of columns) {
        if (opts.header) {
          doc.font("Helvetica-Bold").fontSize(9).fillColor("#FFFFFF");
        } else if (c.key === "roi" && opts.roi !== undefined) {
          doc.font("Helvetica").fontSize(9).fillColor(opts.roi >= 0 ? "#16A34A" : "#DC2626");
        } else if (c.key === "vehicle") {
          doc.font("Helvetica-Bold").fontSize(9).fillColor("#0F172A");
        } else {
          doc.font("Helvetica").fontSize(9).fillColor("#334155");
        }
        doc.text(cells[c.key] ?? "", c.x + CELL_PAD, textY, {
          width: c.width - CELL_PAD * 2,
          align: c.align,
          lineBreak: false,
        });
      }
    }

    // Title
    doc.font("Helvetica-Bold").fontSize(20).fillColor("#4F46E5").text("TransitOps — Fleet Report", PAGE_LEFT, 40);
    doc.font("Helvetica").fontSize(10).fillColor("#64748B").text(`Generated ${new Date().toLocaleString("en-IN")}`);

    let y = doc.y + 14;

    // Header
    const headerCells: Record<string, string> = Object.fromEntries(columns.map((c) => [c.key, c.label]));
    drawRow(y, headerCells, { header: true });
    y += HEADER_HEIGHT;

    if (rows.length === 0) {
      doc.font("Helvetica").fontSize(10).fillColor("#64748B").text("No vehicle data available.", PAGE_LEFT, y + 8);
    }

    const totals = { distance: 0, fuel: 0, opcost: 0, revenue: 0 };

    rows.forEach((r, i) => {
      // Page break: start a fresh page and repeat the header.
      if (y + ROW_HEIGHT > PAGE_BOTTOM) {
        doc.addPage();
        y = 40;
        drawRow(y, headerCells, { header: true });
        y += HEADER_HEIGHT;
      }

      // Zebra striping for readability.
      if (i % 2 === 1) {
        doc.rect(PAGE_LEFT, y, CONTENT_WIDTH, ROW_HEIGHT).fill("#F1F5F9");
      }

      drawRow(
        y,
        {
          vehicle: r.regNumber,
          distance: `${fmt(r.totalDistance)} km`,
          fuel: fmt(r.totalFuelLiters),
          efficiency: r.fuelEfficiency ? `${fmt(r.fuelEfficiency)}` : "-",
          opcost: money(r.operationalCost),
          revenue: money(r.revenue),
          roi: `${r.roi}`,
        },
        { roi: r.roi }
      );

      // Row separator line.
      doc.moveTo(PAGE_LEFT, y + ROW_HEIGHT).lineTo(PAGE_RIGHT, y + ROW_HEIGHT).lineWidth(0.5).strokeColor("#E2E8F0").stroke();

      totals.distance += r.totalDistance;
      totals.fuel += r.totalFuelLiters;
      totals.opcost += r.operationalCost;
      totals.revenue += r.revenue;
      y += ROW_HEIGHT;
    });

    // Totals row.
    if (rows.length > 0) {
      if (y + ROW_HEIGHT > PAGE_BOTTOM) {
        doc.addPage();
        y = 40;
      }
      doc.rect(PAGE_LEFT, y, CONTENT_WIDTH, ROW_HEIGHT).fill("#E0E7FF");
      const textY = y + 7;
      const totalCells: Record<string, string> = {
        vehicle: "TOTAL",
        distance: `${fmt(totals.distance)} km`,
        fuel: fmt(totals.fuel),
        efficiency: "",
        opcost: money(totals.opcost),
        revenue: money(totals.revenue),
        roi: "",
      };
      for (const c of columns) {
        doc.font("Helvetica-Bold").fontSize(9).fillColor("#3730A3");
        doc.text(totalCells[c.key] ?? "", c.x + CELL_PAD, textY, {
          width: c.width - CELL_PAD * 2,
          align: c.align,
          lineBreak: false,
        });
      }
    }

    doc.end();
  })
);

import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../lib/prisma.js";
import { ok, wrap } from "../../lib/http.js";
import { requireRole } from "../../middleware/requireRole.js";

export const documentsRouter = Router();

// RBAC: Fleet Manager manages vehicle documents; Safety Officer can also add (compliance docs).
const canManage = requireRole("FleetManager", "SafetyOfficer");

const docSchema = z.object({
  vehicleId: z.number().int(),
  name: z.string().min(1),
  docType: z.enum(["Registration", "Insurance", "Permit", "Other"]),
  expiryDate: z.coerce.date().optional(),
  notes: z.string().default(""),
});

// GET /documents?vehicleId=
documentsRouter.get(
  "/",
  wrap(async (req, res) => {
    const { vehicleId } = req.query as Record<string, string>;
    const where: any = {};
    if (vehicleId) where.vehicleId = Number(vehicleId);
    const docs = await prisma.vehicleDocument.findMany({ where, orderBy: { id: "desc" }, include: { vehicle: true } });
    return ok(res, docs);
  })
);

documentsRouter.post(
  "/",
  canManage,
  wrap(async (req, res) => {
    const input = docSchema.parse(req.body);
    const doc = await prisma.vehicleDocument.create({ data: input });
    return ok(res, doc, 201);
  })
);

documentsRouter.delete(
  "/:id",
  canManage,
  wrap(async (req, res) => {
    await prisma.vehicleDocument.delete({ where: { id: Number(req.params.id) } });
    return ok(res, { deleted: true });
  })
);

import { z } from "zod";
import { prisma } from "../../lib/prisma.js";
import { findExpiringLicenses } from "../reminders/reminders.service.js";

// Context passed into every tool so it can enforce the same RBAC as the REST API.
export interface ToolContext {
  role: string;
  userName: string;
}

// Tools that mutate the fleet. Only a Fleet Manager may run these — mirrors the
// requireRole("FleetManager") guards on the vehicles/maintenance REST routes.
const WRITE_TOOLS = new Set([
  "create_vehicle",
  "update_vehicle",
  "delete_vehicle",
  "set_vehicle_status",
  "open_maintenance",
  "close_maintenance",
]);

const VEHICLE_STATUSES = ["Available", "OnTrip", "InShop", "Retired"] as const;

// ---- OpenAI/Groq-compatible tool (function) definitions ---------------------
export const TOOL_DEFINITIONS = [
  {
    type: "function",
    function: {
      name: "list_vehicles",
      description:
        "List vehicles in the fleet. Optionally filter by status, type, region, or a free-text search over registration number and name.",
      parameters: {
        type: "object",
        properties: {
          status: { type: "string", enum: VEHICLE_STATUSES as unknown as string[] },
          type: { type: "string", description: "Vehicle type, e.g. Van, Truck." },
          region: { type: "string" },
          search: { type: "string", description: "Matches regNumber or name (case-insensitive)." },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_vehicle",
      description: "Get full details of a single vehicle by its id or registration number.",
      parameters: {
        type: "object",
        properties: {
          id: { type: "number" },
          regNumber: { type: "string" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "list_drivers",
      description: "List drivers. Optionally filter by status or search by name/license number.",
      parameters: {
        type: "object",
        properties: {
          status: { type: "string", enum: ["Available", "OnTrip", "OffDuty", "Suspended"] },
          search: { type: "string" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "list_trips",
      description: "List trips with their vehicle and driver. Optionally filter by status.",
      parameters: {
        type: "object",
        properties: {
          status: { type: "string", enum: ["Draft", "Dispatched", "Completed", "Cancelled"] },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "list_maintenance",
      description: "List maintenance records. Optionally filter by vehicleId or only active (open) records.",
      parameters: {
        type: "object",
        properties: {
          vehicleId: { type: "number" },
          activeOnly: { type: "boolean" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_fleet_summary",
      description:
        "Get an at-a-glance operational summary: vehicle counts by status, driver counts by status, active/pending trips, fleet utilization %, and vehicles that are low on fuel.",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "get_expiring_licenses",
      description: "List drivers whose license expires within the given number of days (default 30).",
      parameters: {
        type: "object",
        properties: { days: { type: "number" } },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "create_vehicle",
      description:
        "Register a new vehicle. Requires Fleet Manager role. regNumber, name, type and maxLoadKg are required.",
      parameters: {
        type: "object",
        properties: {
          regNumber: { type: "string" },
          name: { type: "string" },
          type: { type: "string" },
          maxLoadKg: { type: "number" },
          odometer: { type: "number" },
          acquisitionCost: { type: "number" },
          region: { type: "string" },
          status: { type: "string", enum: VEHICLE_STATUSES as unknown as string[] },
          fuelLevel: { type: "number" },
          fuelCapacity: { type: "number" },
          fuelEfficiencyKmpl: { type: "number" },
        },
        required: ["regNumber", "name", "type", "maxLoadKg"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "update_vehicle",
      description:
        "Update fields on an existing vehicle (identified by id or regNumber). Requires Fleet Manager role. Only include the fields you want to change.",
      parameters: {
        type: "object",
        properties: {
          id: { type: "number" },
          regNumber: { type: "string", description: "Used to locate the vehicle if id is not given." },
          newRegNumber: { type: "string", description: "Set a new registration number." },
          name: { type: "string" },
          type: { type: "string" },
          maxLoadKg: { type: "number" },
          odometer: { type: "number" },
          acquisitionCost: { type: "number" },
          region: { type: "string" },
          status: { type: "string", enum: VEHICLE_STATUSES as unknown as string[] },
          fuelLevel: { type: "number" },
          fuelCapacity: { type: "number" },
          fuelEfficiencyKmpl: { type: "number" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "set_vehicle_status",
      description:
        "Set a vehicle's operational status (Available, OnTrip, InShop, Retired). Requires Fleet Manager role. Controls whether the vehicle is available for dispatch.",
      parameters: {
        type: "object",
        properties: {
          id: { type: "number" },
          regNumber: { type: "string" },
          status: { type: "string", enum: VEHICLE_STATUSES as unknown as string[] },
        },
        required: ["status"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "delete_vehicle",
      description:
        "Permanently delete a vehicle by id or regNumber. Requires Fleet Manager role. This is destructive — only do it after the user has clearly confirmed.",
      parameters: {
        type: "object",
        properties: {
          id: { type: "number" },
          regNumber: { type: "string" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "open_maintenance",
      description:
        "Open an active maintenance record for a vehicle. Requires Fleet Manager role. This moves the vehicle to InShop so it is hidden from dispatch.",
      parameters: {
        type: "object",
        properties: {
          vehicleId: { type: "number" },
          regNumber: { type: "string" },
          type: { type: "string", description: "e.g. Oil change, Brake repair." },
          cost: { type: "number" },
          notes: { type: "string" },
        },
        required: ["type"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "close_maintenance",
      description:
        "Close an active maintenance record. Requires Fleet Manager role. The vehicle returns to Available (unless Retired). Identify by maintenanceId, or by vehicleId/regNumber to close that vehicle's active record.",
      parameters: {
        type: "object",
        properties: {
          maintenanceId: { type: "number" },
          vehicleId: { type: "number" },
          regNumber: { type: "string" },
        },
      },
    },
  },
];

// ---- Helpers ----------------------------------------------------------------
async function resolveVehicle(args: { id?: number; regNumber?: string }) {
  if (args.id != null) return prisma.vehicle.findUnique({ where: { id: Number(args.id) } });
  if (args.regNumber) return prisma.vehicle.findFirst({ where: { regNumber: args.regNumber } });
  return null;
}

const createVehicleSchema = z.object({
  regNumber: z.string().min(1),
  name: z.string().min(1),
  type: z.string().min(1),
  maxLoadKg: z.number().positive(),
  odometer: z.number().min(0).default(0),
  acquisitionCost: z.number().min(0).default(0),
  region: z.string().default(""),
  status: z.enum(VEHICLE_STATUSES).default("Available"),
  fuelLevel: z.number().min(0).default(0),
  fuelCapacity: z.number().positive().default(100),
  fuelEfficiencyKmpl: z.number().positive().default(8),
});

// ---- Tool execution ---------------------------------------------------------
// Returns a plain JSON-serialisable object. On any expected failure it returns
// { error: string } so the model can explain the problem to the user gracefully.
export async function executeTool(
  name: string,
  args: any,
  ctx: ToolContext
): Promise<unknown> {
  try {
    if (WRITE_TOOLS.has(name) && ctx.role !== "FleetManager") {
      return {
        error: `Permission denied. Your role is ${ctx.role}; only a Fleet Manager can perform "${name}".`,
      };
    }

    switch (name) {
      case "list_vehicles": {
        const where: any = {};
        if (args.status) where.status = args.status;
        if (args.type) where.type = args.type;
        if (args.region) where.region = args.region;
        if (args.search)
          where.OR = [
            { regNumber: { contains: args.search } },
            { name: { contains: args.search } },
          ];
        const vehicles = await prisma.vehicle.findMany({ where, orderBy: { id: "desc" } });
        return { count: vehicles.length, vehicles };
      }

      case "get_vehicle": {
        const vehicle = await resolveVehicle(args);
        if (!vehicle) return { error: "Vehicle not found." };
        return { vehicle };
      }

      case "list_drivers": {
        const where: any = {};
        if (args.status) where.status = args.status;
        if (args.search)
          where.OR = [
            { name: { contains: args.search } },
            { licenseNumber: { contains: args.search } },
          ];
        const drivers = await prisma.driver.findMany({ where, orderBy: { id: "desc" } });
        return { count: drivers.length, drivers };
      }

      case "list_trips": {
        const where: any = {};
        if (args.status) where.status = args.status;
        const trips = await prisma.trip.findMany({
          where,
          orderBy: { id: "desc" },
          include: { vehicle: true, driver: true },
        });
        return { count: trips.length, trips };
      }

      case "list_maintenance": {
        const where: any = {};
        if (args.vehicleId != null) where.vehicleId = Number(args.vehicleId);
        if (args.activeOnly) where.isActive = true;
        const records = await prisma.maintenance.findMany({
          where,
          orderBy: { id: "desc" },
          include: { vehicle: true },
        });
        return { count: records.length, records };
      }

      case "get_fleet_summary": {
        const [vehicles, drivers, trips] = await Promise.all([
          prisma.vehicle.findMany(),
          prisma.driver.findMany(),
          prisma.trip.findMany(),
        ]);
        const byStatus = (items: any[], key: string) =>
          items.reduce((acc: Record<string, number>, it) => {
            acc[it[key]] = (acc[it[key]] ?? 0) + 1;
            return acc;
          }, {});
        const nonRetired = vehicles.filter((v) => v.status !== "Retired");
        const onTrip = vehicles.filter((v) => v.status === "OnTrip").length;
        const lowFuel = vehicles
          .filter((v) => v.fuelCapacity > 0 && v.fuelLevel / v.fuelCapacity < 0.2)
          .map((v) => ({ regNumber: v.regNumber, fuelLevel: v.fuelLevel, fuelCapacity: v.fuelCapacity }));
        return {
          totalVehicles: vehicles.length,
          vehiclesByStatus: byStatus(vehicles, "status"),
          totalDrivers: drivers.length,
          driversByStatus: byStatus(drivers, "status"),
          activeTrips: trips.filter((t) => t.status === "Dispatched").length,
          pendingTrips: trips.filter((t) => t.status === "Draft").length,
          fleetUtilizationPct: nonRetired.length ? Math.round((onTrip / nonRetired.length) * 100) : 0,
          lowFuelVehicles: lowFuel,
        };
      }

      case "get_expiring_licenses": {
        const days = Number(args.days ?? 30);
        const list = await findExpiringLicenses(days);
        return { days, count: list.length, drivers: list };
      }

      case "create_vehicle": {
        const input = createVehicleSchema.parse(args);
        const vehicle = await prisma.vehicle.create({ data: input });
        return { created: true, vehicle };
      }

      case "update_vehicle": {
        const vehicle = await resolveVehicle(args);
        if (!vehicle) return { error: "Vehicle not found." };
        const patch: any = {};
        const fields = [
          "name",
          "type",
          "maxLoadKg",
          "odometer",
          "acquisitionCost",
          "region",
          "status",
          "fuelLevel",
          "fuelCapacity",
          "fuelEfficiencyKmpl",
        ];
        for (const f of fields) if (args[f] !== undefined) patch[f] = args[f];
        if (args.newRegNumber !== undefined) patch.regNumber = args.newRegNumber;
        if (Object.keys(patch).length === 0) return { error: "No fields provided to update." };
        const updated = await prisma.vehicle.update({ where: { id: vehicle.id }, data: patch });
        return { updated: true, vehicle: updated };
      }

      case "set_vehicle_status": {
        if (!VEHICLE_STATUSES.includes(args.status))
          return { error: `Invalid status. Use one of: ${VEHICLE_STATUSES.join(", ")}.` };
        const vehicle = await resolveVehicle(args);
        if (!vehicle) return { error: "Vehicle not found." };
        const updated = await prisma.vehicle.update({
          where: { id: vehicle.id },
          data: { status: args.status },
        });
        return { updated: true, vehicle: updated };
      }

      case "delete_vehicle": {
        const vehicle = await resolveVehicle(args);
        if (!vehicle) return { error: "Vehicle not found." };
        await prisma.vehicle.delete({ where: { id: vehicle.id } });
        return { deleted: true, regNumber: vehicle.regNumber };
      }

      case "open_maintenance": {
        const vehicle = await resolveVehicle({ id: args.vehicleId, regNumber: args.regNumber });
        if (!vehicle) return { error: "Vehicle not found." };
        if (vehicle.status === "OnTrip")
          return { error: "Vehicle is On Trip; complete the trip before opening maintenance." };
        if (vehicle.status === "Retired") return { error: "Vehicle is Retired." };
        const record = await prisma.$transaction(async (tx) => {
          const created = await tx.maintenance.create({
            data: {
              vehicleId: vehicle.id,
              type: String(args.type),
              cost: Number(args.cost ?? 0),
              notes: String(args.notes ?? ""),
              isActive: true,
            },
          });
          await tx.vehicle.update({ where: { id: vehicle.id }, data: { status: "InShop" } });
          return created;
        });
        return { opened: true, maintenance: record, vehicleStatus: "InShop" };
      }

      case "close_maintenance": {
        let record = null as null | { id: number; vehicleId: number };
        if (args.maintenanceId != null) {
          record = await prisma.maintenance.findUnique({ where: { id: Number(args.maintenanceId) } });
        } else {
          const vehicle = await resolveVehicle({ id: args.vehicleId, regNumber: args.regNumber });
          if (!vehicle) return { error: "Vehicle not found." };
          record = await prisma.maintenance.findFirst({
            where: { vehicleId: vehicle.id, isActive: true },
            orderBy: { id: "desc" },
          });
        }
        if (!record) return { error: "No matching maintenance record found." };
        const updated = await prisma.$transaction(async (tx) => {
          const closed = await tx.maintenance.update({
            where: { id: record!.id },
            data: { isActive: false },
          });
          const vehicle = await tx.vehicle.findUnique({ where: { id: record!.vehicleId } });
          if (vehicle && vehicle.status !== "Retired") {
            await tx.vehicle.update({ where: { id: record!.vehicleId }, data: { status: "Available" } });
          }
          return closed;
        });
        return { closed: true, maintenance: updated };
      }

      default:
        return { error: `Unknown tool: ${name}` };
    }
  } catch (err: any) {
    if (err?.code === "P2002") {
      const field = Array.isArray(err.meta?.target) ? err.meta.target[0] : "field";
      return { error: `${field} already exists.` };
    }
    if (err instanceof z.ZodError) {
      return { error: err.errors.map((e) => `${e.path.join(".")}: ${e.message}`).join(", ") };
    }
    return { error: err?.message ?? "Tool execution failed." };
  }
}

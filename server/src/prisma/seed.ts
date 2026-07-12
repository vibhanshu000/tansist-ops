import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const ROLES = ["FleetManager", "Driver", "SafetyOfficer", "FinancialAnalyst"];

function daysFromNow(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d;
}

async function main() {
  console.log("Seeding TransitOps...");

  // Clean (order matters for FK)
  await prisma.expense.deleteMany();
  await prisma.fuelLog.deleteMany();
  await prisma.maintenance.deleteMany();
  await prisma.trip.deleteMany();
  await prisma.driver.deleteMany();
  await prisma.vehicle.deleteMany();
  await prisma.user.deleteMany();
  await prisma.role.deleteMany();

  // Roles
  for (const name of ROLES) {
    await prisma.role.create({ data: { name } });
  }
  const roleMap = Object.fromEntries((await prisma.role.findMany()).map((r) => [r.name, r.id]));

  // One user per role — password is "password" for all
  const passwordHash = await bcrypt.hash("password", 10);
  await prisma.user.createMany({
    data: [
      { name: "Fiona Fleet", email: "fleet@transitops.com", passwordHash, roleId: roleMap.FleetManager },
      { name: "Dan Driver", email: "driver@transitops.com", passwordHash, roleId: roleMap.Driver },
      { name: "Sam Safety", email: "safety@transitops.com", passwordHash, roleId: roleMap.SafetyOfficer },
      { name: "Fred Finance", email: "finance@transitops.com", passwordHash, roleId: roleMap.FinancialAnalyst },
    ],
  });

  // Vehicles — includes Van-05 from the example workflow
  // fuelLevel/fuelCapacity/fuelEfficiencyKmpl support the "enough fuel for the trip" validation
  await prisma.vehicle.createMany({
    data: [
      { regNumber: "Van-05", name: "Ford Transit", type: "Van", maxLoadKg: 500, odometer: 42000, acquisitionCost: 25000, region: "North", status: "Available", fuelLevel: 40, fuelCapacity: 70, fuelEfficiencyKmpl: 10 },
      { regNumber: "TRK-101", name: "Volvo FH16", type: "Truck", maxLoadKg: 20000, odometer: 120000, acquisitionCost: 90000, region: "North", status: "Available", fuelLevel: 150, fuelCapacity: 400, fuelEfficiencyKmpl: 3 },
      { regNumber: "TRK-102", name: "Scania R500", type: "Truck", maxLoadKg: 18000, odometer: 98000, acquisitionCost: 85000, region: "South", status: "Available", fuelLevel: 20, fuelCapacity: 380, fuelEfficiencyKmpl: 3.2 },
      { regNumber: "VAN-06", name: "Mercedes Sprinter", type: "Van", maxLoadKg: 1200, odometer: 30000, acquisitionCost: 40000, region: "East", status: "Available", fuelLevel: 55, fuelCapacity: 75, fuelEfficiencyKmpl: 9 },
      { regNumber: "PKP-201", name: "Toyota Hilux", type: "Pickup", maxLoadKg: 1000, odometer: 55000, acquisitionCost: 35000, region: "West", status: "InShop", fuelLevel: 30, fuelCapacity: 80, fuelEfficiencyKmpl: 11 },
      { regNumber: "TRK-103", name: "MAN TGX", type: "Truck", maxLoadKg: 22000, odometer: 210000, acquisitionCost: 95000, region: "South", status: "Retired", fuelLevel: 0, fuelCapacity: 400, fuelEfficiencyKmpl: 3 },
      { regNumber: "VAN-07", name: "Renault Master", type: "Van", maxLoadKg: 1500, odometer: 18000, acquisitionCost: 38000, region: "North", status: "Available", fuelLevel: 60, fuelCapacity: 80, fuelEfficiencyKmpl: 9.5 },
    ],
  });

  // Drivers — includes Alex with a valid license
  await prisma.driver.createMany({
    data: [
      { name: "Alex", licenseNumber: "DL-ALEX-001", licenseCategory: "C", licenseExpiry: daysFromNow(365), contact: "555-0101", safetyScore: 95, status: "Available" },
      { name: "Maria Gomez", licenseNumber: "DL-2002", licenseCategory: "CE", licenseExpiry: daysFromNow(200), contact: "555-0102", safetyScore: 88, status: "Available" },
      { name: "John Park", licenseNumber: "DL-2003", licenseCategory: "C", licenseExpiry: daysFromNow(90), contact: "555-0103", safetyScore: 76, status: "Available" },
      { name: "Ravi Kumar", licenseNumber: "DL-2004", licenseCategory: "B", licenseExpiry: daysFromNow(-10), contact: "555-0104", safetyScore: 60, status: "Available" }, // expired license
      { name: "Lena Fischer", licenseNumber: "DL-2005", licenseCategory: "CE", licenseExpiry: daysFromNow(500), contact: "555-0105", safetyScore: 92, status: "Suspended" },
    ],
  });

  // A little fuel/expense data so reports aren't empty
  const van05 = await prisma.vehicle.findUnique({ where: { regNumber: "Van-05" } });
  const trk101 = await prisma.vehicle.findUnique({ where: { regNumber: "TRK-101" } });
  if (van05) {
    await prisma.fuelLog.create({ data: { vehicleId: van05.id, liters: 40, cost: 60, date: daysFromNow(-5) } });
    await prisma.expense.create({ data: { vehicleId: van05.id, type: "toll", amount: 15, date: daysFromNow(-5) } });
  }
  if (trk101) {
    await prisma.fuelLog.create({ data: { vehicleId: trk101.id, liters: 300, cost: 450, date: daysFromNow(-3) } });
  }

  console.log("Seed complete.");
  console.log("Logins (password = 'password'):");
  console.log("  fleet@transitops.com    (Fleet Manager)");
  console.log("  driver@transitops.com   (Driver)");
  console.log("  safety@transitops.com   (Safety Officer)");
  console.log("  finance@transitops.com  (Financial Analyst)");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

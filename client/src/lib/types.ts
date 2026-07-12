export type Role = "FleetManager" | "Driver" | "SafetyOfficer" | "FinancialAnalyst";

export interface User {
  id: number;
  name: string;
  email: string;
  role: Role;
}

export type VehicleStatus = "Available" | "OnTrip" | "InShop" | "Retired";
export type DriverStatus = "Available" | "OnTrip" | "OffDuty" | "Suspended";
export type TripStatus = "Draft" | "Dispatched" | "Completed" | "Cancelled";

export interface Vehicle {
  id: number;
  regNumber: string;
  name: string;
  type: string;
  maxLoadKg: number;
  odometer: number;
  acquisitionCost: number;
  region: string;
  status: VehicleStatus;
  fuelLevel: number;
  fuelCapacity: number;
  fuelEfficiencyKmpl: number;
}

export interface Driver {
  id: number;
  name: string;
  licenseNumber: string;
  licenseCategory: string;
  licenseExpiry: string;
  contact: string;
  safetyScore: number;
  status: DriverStatus;
}

export interface Trip {
  id: number;
  source: string;
  destination: string;
  vehicleId: number;
  driverId: number;
  cargoWeight: number;
  plannedDistance: number;
  finalOdometer?: number;
  fuelConsumed?: number;
  revenue?: number;
  status: TripStatus;
  vehicle?: Vehicle;
  driver?: Driver;
}

export interface Maintenance {
  id: number;
  vehicleId: number;
  type: string;
  cost: number;
  date: string;
  notes: string;
  isActive: boolean;
  vehicle?: Vehicle;
}

export interface FuelLog {
  id: number;
  vehicleId: number;
  liters: number;
  cost: number;
  date: string;
  vehicle?: Vehicle;
}

export interface Expense {
  id: number;
  vehicleId: number;
  type: "toll" | "maintenance" | "other";
  amount: number;
  date: string;
  vehicle?: Vehicle;
}

export interface VehicleDocument {
  id: number;
  vehicleId: number;
  name: string;
  docType: "Registration" | "Insurance" | "Permit" | "Other";
  expiryDate?: string;
  notes: string;
  vehicle?: Vehicle;
}

export interface ExpiringLicense {
  driverId: number;
  name: string;
  licenseNumber: string;
  licenseExpiry: string;
  daysLeft: number;
  contact: string;
}

export interface Kpis {
  activeVehicles: number;
  availableVehicles: number;
  inMaintenance: number;
  activeTrips: number;
  pendingTrips: number;
  driversOnDuty: number;
  fleetUtilization: number;
}

export interface VehicleReport {
  vehicleId: number;
  regNumber: string;
  name: string;
  status: string;
  totalDistance: number;
  totalFuelLiters: number;
  fuelEfficiency: number;
  fuelCost: number;
  maintenanceCost: number;
  operationalCost: number;
  revenue: number;
  roi: number;
}

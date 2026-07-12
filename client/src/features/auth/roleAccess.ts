import type { Role } from "../../lib/types";

export interface NavItem {
  to: string;
  label: string;
  icon: string; // lucide icon name key (mapped in Sidebar)
  roles: Role[]; // which roles can see this
}

const ALL: Role[] = ["FleetManager", "Driver", "SafetyOfficer", "FinancialAnalyst"];

// Role-based navigation. RBAC on the frontend hides links; backend enforces too.
export const NAV: NavItem[] = [
  { to: "/", label: "Dashboard", icon: "dashboard", roles: ALL },
  { to: "/vehicles", label: "Vehicles", icon: "truck", roles: ["FleetManager", "SafetyOfficer", "FinancialAnalyst"] },
  { to: "/drivers", label: "Drivers", icon: "users", roles: ["FleetManager", "SafetyOfficer"] },
  { to: "/trips", label: "Trips", icon: "map", roles: ["FleetManager", "Driver"] },
  { to: "/maintenance", label: "Maintenance", icon: "wrench", roles: ["FleetManager"] },
  { to: "/fuel-expense", label: "Fuel & Expense", icon: "fuel", roles: ["FleetManager", "FinancialAnalyst"] },
  { to: "/reports", label: "Reports", icon: "chart", roles: ["FleetManager", "FinancialAnalyst"] },
  { to: "/documents", label: "Documents", icon: "file", roles: ["FleetManager", "SafetyOfficer"] },
];

export function navForRole(role: Role): NavItem[] {
  return NAV.filter((n) => n.roles.includes(role));
}

export function canAccess(path: string, role: Role): boolean {
  const item = NAV.find((n) => n.to === path);
  return item ? item.roles.includes(role) : true;
}

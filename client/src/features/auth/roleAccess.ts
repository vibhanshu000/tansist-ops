import type { Role } from "../../lib/types";

export interface NavItem {
  to: string;
  label: string;
  icon: string; // lucide icon name key (mapped in Sidebar)
  roles: Role[]; // which roles can see this
}

const ALL: Role[] = ["FleetManager", "Driver", "SafetyOfficer", "FinancialAnalyst"];

// Role-based navigation. RBAC on the frontend hides links; backend enforces too.
// `roles: []` means the tab is hidden from everyone (e.g. Maintenance is no
// longer surfaced in the UI). Keeping the entry with an empty list is important
// so canAccess() explicitly denies it rather than falling through to allow.
export const NAV: NavItem[] = [
  { to: "/", label: "Dashboard", icon: "dashboard", roles: ALL },
  { to: "/vehicles", label: "Vehicles", icon: "truck", roles: ["FleetManager", "Driver", "FinancialAnalyst"] },
  { to: "/drivers", label: "Drivers", icon: "users", roles: ["FleetManager", "SafetyOfficer"] },
  { to: "/trips", label: "Trips", icon: "map", roles: ["Driver", "SafetyOfficer"] },
  { to: "/maintenance", label: "Maintenance", icon: "wrench", roles: [] },
  { to: "/fuel-expense", label: "Fuel & Expense", icon: "fuel", roles: ["FinancialAnalyst"] },
  { to: "/reports", label: "Reports", icon: "chart", roles: ["FleetManager", "FinancialAnalyst"] },
  { to: "/documents", label: "Documents", icon: "file", roles: ["FleetManager"] },
];

// Who may edit (create / update / delete) on each page. Any authenticated role
// that can see a page can still read it; editing is the narrower right below.
// Mirrors the requireRole(...) guards on the server for defense in depth.
const EDIT_ACCESS: Record<string, Role[]> = {
  "/vehicles": ["FleetManager"], // Driver & Financial Analyst are view-only
  "/drivers": ["FleetManager", "SafetyOfficer"],
  "/trips": ["Driver"], // Safety Officer is view-only
  "/fuel-expense": ["FinancialAnalyst"],
  "/documents": ["FleetManager"],
  "/maintenance": ["FleetManager"],
};

export function navForRole(role: Role): NavItem[] {
  return NAV.filter((n) => n.roles.includes(role));
}

export function canAccess(path: string, role: Role): boolean {
  const item = NAV.find((n) => n.to === path);
  return item ? item.roles.includes(role) : true;
}

// True if the role may modify data on the given page (not just view it).
export function canEdit(path: string, role: Role): boolean {
  const roles = EDIT_ACCESS[path];
  return roles ? roles.includes(role) : false;
}

// Where each role lands right after signing in. The role comes from the account
// (e.g. driver@transitops.com -> Driver), so each user is dropped on the view
// most relevant to their job instead of a one-size-fits-all page.
const LANDING_BY_ROLE: Record<Role, string> = {
  FleetManager: "/", // full operations dashboard
  Driver: "/trips", // drivers work out of the trips board
  SafetyOfficer: "/drivers", // driver/vehicle compliance
  FinancialAnalyst: "/reports", // cost & analytics
};

export function landingPathForRole(role: Role): string {
  const target = LANDING_BY_ROLE[role] ?? "/";
  // Guard against a mismatch between the map and the access rules.
  return canAccess(target, role) ? target : "/";
}

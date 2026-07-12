import type { Request, Response, NextFunction } from "express";
import { fail } from "../lib/http.js";

// RBAC: usage requireRole("FleetManager", "SafetyOfficer")
export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) return fail(res, "Not authenticated", 401);
    if (!roles.includes(req.user.role)) {
      return fail(res, "You do not have permission for this action", 403);
    }
    next();
  };
}

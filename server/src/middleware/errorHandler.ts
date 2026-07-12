import type { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";

export function errorHandler(err: any, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ZodError) {
    const msg = err.errors.map((e) => `${e.path.join(".")}: ${e.message}`).join(", ");
    return res.status(400).json({ data: null, error: msg });
  }
  // Prisma unique constraint
  if (err?.code === "P2002") {
    const field = Array.isArray(err.meta?.target) ? err.meta.target[0] : "field";
    return res.status(409).json({ data: null, error: `${field} already exists` });
  }
  console.error(err);
  const status = err?.status ?? 500;
  return res.status(status).json({ data: null, error: err?.message ?? "Server error" });
}

// Throw this for expected business-rule violations.
export class AppError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

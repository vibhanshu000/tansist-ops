import type { Response } from "express";

// Consistent response envelope: { data, error }
export function ok(res: Response, data: unknown, status = 200) {
  return res.status(status).json({ data, error: null });
}

export function fail(res: Response, message: string, status = 400) {
  return res.status(status).json({ data: null, error: message });
}

// Wrap async route handlers so thrown errors hit the error middleware.
export function wrap(fn: (req: any, res: any, next: any) => Promise<unknown>) {
  return (req: any, res: any, next: any) => Promise.resolve(fn(req, res, next)).catch(next);
}

import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { fail } from "../lib/http.js";

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  role: string;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export function authenticate(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    return fail(res, "Not authenticated", 401);
  }
  const token = header.slice(7);
  try {
    const secret = process.env.JWT_SECRET as string;
    req.user = jwt.verify(token, secret) as AuthUser;
    next();
  } catch {
    return fail(res, "Invalid or expired token", 401);
  }
}

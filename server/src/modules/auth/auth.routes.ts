import { Router } from "express";
import { z } from "zod";
import { ok, wrap } from "../../lib/http.js";
import { authenticate } from "../../middleware/authenticate.js";
import * as service from "./auth.service.js";

export const authRouter = Router();

const registerSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(4),
  role: z.string().min(1),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

authRouter.post(
  "/register",
  wrap(async (req, res) => {
    const input = registerSchema.parse(req.body);
    const result = await service.register(input);
    return ok(res, result, 201);
  })
);

authRouter.post(
  "/login",
  wrap(async (req, res) => {
    const input = loginSchema.parse(req.body);
    const result = await service.login(input);
    return ok(res, result);
  })
);

authRouter.get(
  "/me",
  authenticate,
  wrap(async (req, res) => ok(res, { user: req.user }))
);

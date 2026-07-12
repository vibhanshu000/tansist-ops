import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../../lib/prisma.js";
import { AppError } from "../../middleware/errorHandler.js";

const VALID_ROLES = ["FleetManager", "Driver", "SafetyOfficer", "FinancialAnalyst"];

function signToken(user: { id: number; name: string; email: string; role: string }) {
  const secret = process.env.JWT_SECRET as string;
  const expiresIn = process.env.JWT_EXPIRES_IN ?? "1d";
  return jwt.sign(user, secret, { expiresIn } as jwt.SignOptions);
}

export async function register(input: { name: string; email: string; password: string; role: string }) {
  if (!VALID_ROLES.includes(input.role)) {
    throw new AppError(`role must be one of ${VALID_ROLES.join(", ")}`);
  }
  const role = await prisma.role.findUnique({ where: { name: input.role } });
  if (!role) throw new AppError("Role not found. Run the seed script.", 500);

  const passwordHash = await bcrypt.hash(input.password, 10);
  const user = await prisma.user.create({
    data: { name: input.name, email: input.email, passwordHash, roleId: role.id },
  });
  const payload = { id: user.id, name: user.name, email: user.email, role: input.role };
  return { token: signToken(payload), user: payload };
}

export async function login(input: { email: string; password: string }) {
  const user = await prisma.user.findUnique({ where: { email: input.email }, include: { role: true } });
  if (!user) throw new AppError("Invalid email or password", 401);
  const valid = await bcrypt.compare(input.password, user.passwordHash);
  if (!valid) throw new AppError("Invalid email or password", 401);
  const payload = { id: user.id, name: user.name, email: user.email, role: user.role.name };
  return { token: signToken(payload), user: payload };
}

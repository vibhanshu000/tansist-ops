import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "./AuthContext";
import { canAccess } from "./roleAccess";

// Guards a route by role even if the user types the URL directly (sidebar hiding isn't enough).
export function RoleRoute({ path, children }: { path: string; children: ReactNode }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (!canAccess(path, user.role)) return <Navigate to="/" replace />;
  return <>{children}</>;
}

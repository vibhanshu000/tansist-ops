import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { apiGet, apiPost } from "../../lib/api";
import type { User } from "../../lib/types";

interface AuthState {
  user: User | null;
  login: (email: string, password: string) => Promise<User>;
  logout: () => void;
}

const AuthContext = createContext<AuthState | null>(null);

function readStoredUser(): User | null {
  try {
    const stored = localStorage.getItem("user");
    return stored ? (JSON.parse(stored) as User) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  // Initialise synchronously from localStorage so a page refresh keeps the
  // session on the very first render (prevents ProtectedRoute from bouncing
  // an authenticated user to /login before an effect can run).
  const [user, setUser] = useState<User | null>(readStoredUser);

  // Validate the stored token against the server on load. If it's expired or
  // invalid the API returns 401 (which clears the token), so we drop the user.
  // Network/other errors are ignored so a temporary outage doesn't log you out.
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;
    apiGet<{ user: User }>("/auth/me")
      .then((data) => {
        if (data?.user) {
          setUser(data.user);
          localStorage.setItem("user", JSON.stringify(data.user));
        }
      })
      .catch(() => {
        if (!localStorage.getItem("token")) setUser(null);
      });
  }, []);

  async function login(email: string, password: string) {
    const data = await apiPost<{ token: string; user: User }>("/auth/login", { email, password });
    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify(data.user));
    setUser(data.user);
    return data.user;
  }

  function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
  }

  return <AuthContext.Provider value={{ user, login, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

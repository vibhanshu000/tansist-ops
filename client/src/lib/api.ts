import axios from "axios";

export const api = axios.create({ baseURL: "/api" });

// Attach token from localStorage on every request.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Unwrap { data, error } envelope; surface errors as thrown messages.
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const message = err.response?.data?.error ?? err.message ?? "Request failed";
    if (err.response?.status === 401 && !location.pathname.includes("login")) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
    }
    return Promise.reject(new Error(message));
  }
);

// Helper: returns the inner data payload.
export async function apiGet<T>(url: string, params?: Record<string, unknown>): Promise<T> {
  const res = await api.get(url, { params });
  return res.data.data as T;
}

export async function apiPost<T>(url: string, body?: unknown): Promise<T> {
  const res = await api.post(url, body);
  return res.data.data as T;
}

export async function apiPut<T>(url: string, body?: unknown): Promise<T> {
  const res = await api.put(url, body);
  return res.data.data as T;
}

export async function apiDelete<T>(url: string): Promise<T> {
  const res = await api.delete(url);
  return res.data.data as T;
}

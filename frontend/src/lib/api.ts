// Tiny typed API client. Two modes:
//  - COOKIE_MODE (NEXT_PUBLIC_AUTH_COOKIE_ENABLED=true): JWT lives in HttpOnly cookies; the browser
//    is same-origin (Next rewrites /api -> backend), so we send credentials and no Bearer header.
//  - legacy: JWT in localStorage, attached as Authorization: Bearer to the cross-origin API.

export const COOKIE_MODE = process.env.NEXT_PUBLIC_AUTH_COOKIE_ENABLED === "true";

const BASE = COOKIE_MODE
  ? "/api"
  : process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000/api";
const TOKEN_KEY = "crownwager_access";
const REFRESH_KEY = "crownwager_refresh";

export function getToken(): string | null {
  if (COOKIE_MODE || typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

export function setTokens(access: string, refresh?: string): void {
  if (COOKIE_MODE) return; // tokens are in HttpOnly cookies, not readable by JS
  window.localStorage.setItem(TOKEN_KEY, access);
  if (refresh) window.localStorage.setItem(REFRESH_KEY, refresh);
}

export function clearTokens(): void {
  if (COOKIE_MODE) return;
  window.localStorage.removeItem(TOKEN_KEY);
  window.localStorage.removeItem(REFRESH_KEY);
}

export class ApiError extends Error {
  status: number;
  data: unknown;
  constructor(status: number, message: string, data?: unknown) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers);
  headers.set("Content-Type", "application/json");
  if (!COOKIE_MODE) {
    const token = getToken();
    if (token) headers.set("Authorization", `Bearer ${token}`);
  }

  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers,
    credentials: COOKIE_MODE ? "include" : "same-origin",
    cache: "no-store",
  });
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) {
    const message =
      (data && (data.detail || data.non_field_errors?.[0])) || `Request failed (${res.status})`;
    throw new ApiError(res.status, message, data);
  }
  return data as T;
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body: unknown) =>
    request<T>(path, { method: "POST", body: JSON.stringify(body) }),
  patch: <T>(path: string, body: unknown) =>
    request<T>(path, { method: "PATCH", body: JSON.stringify(body) }),
  del: (path: string) => request<null>(path, { method: "DELETE" }),
};

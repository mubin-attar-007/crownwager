"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { api, clearTokens, COOKIE_MODE, getToken, setTokens } from "./api";
import type { CurrentUser } from "./types";

interface AuthState {
  user: CurrentUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

interface RegisterData {
  email: string;
  first_name: string;
  last_name: string;
  password: string;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    // Legacy mode short-circuits when there's no localStorage token. Cookie mode can't read the
    // HttpOnly cookie, so it always asks /auth/me/ and lets a 401 mean "not signed in".
    if (!COOKIE_MODE && !getToken()) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const me = await api.get<CurrentUser>("/auth/me/");
      setUser(me);
    } catch {
      clearTokens();
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshUser();
  }, [refreshUser]);

  async function login(email: string, password: string) {
    const res = await api.post<{ access: string; refresh: string }>("/auth/login/", {
      username: email,
      password,
    });
    setTokens(res.access, res.refresh);
    await refreshUser();
  }

  async function register(data: RegisterData) {
    const res = await api.post<{ access: string; refresh: string; user: CurrentUser }>(
      "/auth/register/",
      data,
    );
    setTokens(res.access, res.refresh);
    setUser(res.user);
    setLoading(false);
  }

  async function logout() {
    if (COOKIE_MODE) {
      // Only the server can clear the HttpOnly cookies; ignore failures (already logged out).
      try {
        await api.post("/auth/logout/", {});
      } catch {
        /* no-op */
      }
    } else {
      clearTokens();
    }
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

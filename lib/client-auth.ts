"use client";

import { useCallback, useEffect, useState } from "react";

export interface ClientUser {
  id: number;
  username: string;
  email?: string;
  display_name?: string | null;
  avatar?: string | null;
  role?: string;
  bio?: string | null;
}

const USER_KEY = "user";
const TOKEN_KEY = "token";
const AUTH_EVENT = "app-auth-changed";

export function getStoredUser(): ClientUser | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as ClientUser;
  } catch {
    localStorage.removeItem(USER_KEY);
    return null;
  }
}

export function getStoredToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function storeAuth(user: ClientUser, token: string) {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  localStorage.setItem(TOKEN_KEY, token);
  window.dispatchEvent(new Event(AUTH_EVENT));
}

export function clearAuth() {
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem(TOKEN_KEY);
  window.dispatchEvent(new Event(AUTH_EVENT));
}

/**
 * 统一认证状态 hook。
 * 跨标签页/跨组件同步；401 时调用 handleUnauthorized 自动登出。
 */
export function useAuth() {
  const [user, setUser] = useState<ClientUser | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const sync = () => setUser(getStoredUser());
    sync();
    setReady(true);
    window.addEventListener(AUTH_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(AUTH_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const logout = useCallback(() => {
    clearAuth();
  }, []);

  return { user, token: getStoredToken(), ready, logout };
}

/**
 * 带认证头的 fetch 封装：自动附加 Bearer token，401 时自动登出并跳转登录页。
 */
export async function authFetch(input: string, init: RequestInit = {}): Promise<Response> {
  const token = getStoredToken();
  const headers = new Headers(init.headers);
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const res = await fetch(input, { ...init, headers });
  if (res.status === 401 && token) {
    // token 失效：清理本地状态，避免 UI 停留在"已登录"假象
    clearAuth();
  }
  return res;
}

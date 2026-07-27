/**
 * API 路由公共助手（仅 app/api/** 内部使用，不动 lib/）。
 * 收敛三类重复逻辑：取 D1 连接、登录/权限校验、JSON body 解析。
 */
import { NextRequest, NextResponse } from "next/server";
import { getRequestContext } from "@cloudflare/next-on-pages";
import { AuthUser, getCurrentUserFromRequest, hasPermission } from "@/lib/auth";
import { json, noStoreHeaders } from "@/lib/security";
import type { PostMode, PostStatus } from "@/lib/types";

/** 取当前请求的 D1 连接 */
export function getDb(): D1Database {
  const ctx = getRequestContext();
  return (ctx.env as unknown as CloudflareEnv).DB;
}

export type AuthResult =
  | { user: AuthUser; error?: never }
  | { user?: never; error: NextResponse };

/** 要求登录；未登录返回 401（message 可定制以兼容现有中文提示契约） */
export async function requireLogin(request: NextRequest, message = "Unauthorized"): Promise<AuthResult> {
  const user = await getCurrentUserFromRequest(request);
  if (!user) return { error: json({ error: message }, { status: 401 }) };
  return { user };
}

/** 要求登录 + 指定权限；未登录 401，无权限 403（匹配 posts/upload 等路由现有契约） */
export async function requirePermission(request: NextRequest, permission: string): Promise<AuthResult> {
  const user = await getCurrentUserFromRequest(request);
  if (!user) return { error: json({ error: "Unauthorized" }, { status: 401 }) };
  if (!hasPermission(user, permission)) return { error: json({ error: "Forbidden" }, { status: 403 }) };
  return { user };
}

/** 管理面校验：未登录与无权限统一 403 + no-store（匹配 admin/** 路由现有契约） */
export async function requireAdmin(request: NextRequest, permission: string): Promise<AuthResult> {
  const user = await getCurrentUserFromRequest(request);
  if (!user || !hasPermission(user, permission)) {
    return { error: json({ error: "Forbidden" }, { status: 403, headers: noStoreHeaders() }) };
  }
  return { user };
}

/** 解析 JSON body；格式非法返回 null（路由据此返回 400，而非裸崩 500） */
export async function parseJsonBody<T = Record<string, unknown>>(request: NextRequest): Promise<T | null> {
  try {
    return (await request.json()) as T;
  } catch {
    return null;
  }
}

/** 文章创建/更新请求体（posts POST/PUT 共用；字段均为可选，由路由内校验兜底） */
export interface PostWriteBody {
  title?: string;
  content?: string;
  tags?: string;
  coverImage?: string;
  status?: PostStatus;
  mode?: PostMode;
  images?: string[];
}

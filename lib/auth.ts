import { SignJWT, jwtVerify } from "jose";
import { getRequestContext } from "@cloudflare/next-on-pages";
import { User, UserRole } from "./types";

export const ROLE_LABELS: Record<UserRole, string> = {
  owner: "站主",
  admin: "管理员",
  editor: "编辑",
  author: "作者",
  member: "成员",
};

export const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  owner: ["*"],
  admin: ["admin:access", "posts:manage_all", "comments:manage_all", "guestbook:manage_all", "users:manage", "images:manage_all"],
  editor: ["posts:create", "posts:manage_own", "images:upload", "images:manage_own", "comments:create", "guestbook:create"],
  author: ["posts:create", "posts:manage_own", "images:upload", "images:manage_own", "comments:create", "guestbook:create"],
  member: ["comments:create", "guestbook:create"],
};

export type AuthUser = Pick<User, "id" | "username" | "email" | "display_name" | "avatar" | "role" | "bio" | "is_active" | "created_at">;

// Use Web Crypto API instead of bcryptjs (Edge-compatible)
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const keyMaterial = await crypto.subtle.importKey(
    "raw", encoder.encode(password), { name: "PBKDF2" }, false, ["deriveBits"]
  );
  const hash = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt, iterations: 100000, hash: "SHA-256" },
    keyMaterial, 256
  );
  const hashArray = Array.from(new Uint8Array(hash));
  const saltArray = Array.from(salt);
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
  const saltHex = saltArray.map(b => b.toString(16).padStart(2, "0")).join("");
  return `${saltHex}:${hashHex}`;
}

async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  const [saltHex, hashHex] = storedHash.split(":");
  if (!saltHex || !hashHex || !/^[a-f0-9]+$/i.test(saltHex) || !/^[a-f0-9]+$/i.test(hashHex)) return false;
  const saltParts = saltHex.match(/.{2}/g);
  if (!saltParts || saltParts.length !== 16 || hashHex.length !== 64) return false;
  const salt = new Uint8Array(saltParts.map(byte => parseInt(byte, 16)));
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw", encoder.encode(password), { name: "PBKDF2" }, false, ["deriveBits"]
  );
  const hash = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt, iterations: 100000, hash: "SHA-256" },
    keyMaterial, 256
  );
  const hashArray = Array.from(new Uint8Array(hash));
  const newHashHex = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
  let diff = newHashHex.length ^ hashHex.length;
  for (let i = 0; i < newHashHex.length && i < hashHex.length; i += 1) {
    diff |= newHashHex.charCodeAt(i) ^ hashHex.charCodeAt(i);
  }
  return diff === 0;
}

export { hashPassword, verifyPassword };

export async function createToken(user: User): Promise<string> {
  const secret = new TextEncoder().encode(getJwtSecret());
  return new SignJWT({ userId: user.id, username: user.username, role: getEffectiveRole(user) })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret);
}

export async function verifyToken(token: string): Promise<{ userId: number; username: string; role?: UserRole } | null> {
  try {
    const secret = new TextEncoder().encode(getJwtSecret());
    const { payload } = await jwtVerify(token, secret, { clockTolerance: 60 });
    return payload as { userId: number; username: string; role?: UserRole };
  } catch {
    return null;
  }
}

export function getJwtSecret(): string {
  const ctx = getRequestContext();
  const secret = (ctx.env as any).JWT_SECRET;
  if (!secret || secret.length < 32 || secret === "default-secret") {
    throw new Error("JWT_SECRET must be configured with at least 32 characters");
  }
  return secret;
}

export function getEffectiveRole(user: Pick<User, "username"> & Partial<Pick<User, "role">>): UserRole {
  return (user.role || "author") as UserRole;
}

export function serializeUser(user: any): AuthUser {
  const role = getEffectiveRole(user);
  return {
    id: Number(user.id),
    username: user.username,
    email: user.email,
    display_name: user.display_name ?? null,
    avatar: user.avatar ?? null,
    role,
    bio: user.bio ?? null,
    is_active: Number(user.is_active ?? 1),
    created_at: user.created_at,
  };
}

export function hasPermission(user: Pick<User, "username"> & Partial<Pick<User, "role">>, permission: string): boolean {
  const permissions = ROLE_PERMISSIONS[getEffectiveRole(user)] || [];
  return permissions.includes("*") || permissions.includes(permission);
}

export function canManagePost(user: Pick<User, "id" | "username"> & Partial<Pick<User, "role">>, authorId: number): boolean {
  return hasPermission(user, "posts:manage_all") || (Number(user.id) === Number(authorId) && hasPermission(user, "posts:manage_own"));
}

export function canManageImage(user: Pick<User, "id" | "username"> & Partial<Pick<User, "role">>, imageUserId: number): boolean {
  return hasPermission(user, "images:manage_all") || (Number(user.id) === Number(imageUserId) && hasPermission(user, "images:manage_own"));
}

export function canAccessAdmin(user: Pick<User, "username"> & Partial<Pick<User, "role">>): boolean {
  return hasPermission(user, "admin:access");
}

export async function getCurrentUserFromRequest(request: Request): Promise<AuthUser | null> {
  const token = request.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) return null;

  const payload = await verifyToken(token);
  if (!payload) return null;

  const ctx = getRequestContext();
  const db = (ctx.env as any).DB;
  const user = await db.prepare(
    "SELECT id, username, email, display_name, avatar, role, bio, is_active, created_at FROM users WHERE id = ?"
  ).bind(payload.userId).first();

  if (!user || Number(user.is_active ?? 1) !== 1) return null;
  return serializeUser(user);
}

import { SignJWT, jwtVerify } from "jose";
import bcryptjs from "bcryptjs";
import { getRequestContext } from "@cloudflare/next-on-pages";
import { User } from "./types";

export async function hashPassword(password: string): Promise<string> {
  return bcryptjs.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcryptjs.compare(password, hash);
}

export async function createToken(user: User): Promise<string> {
  const ctx = getRequestContext();
  const secret = new TextEncoder().encode(ctx.env.JWT_SECRET || "default-secret");
  return new SignJWT({ userId: user.id, username: user.username })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret);
}

export async function verifyToken(token: string): Promise<{ userId: number; username: string } | null> {
  try {
    const ctx = getRequestContext();
    const secret = new TextEncoder().encode(ctx.env.JWT_SECRET || "default-secret");
    const { payload } = await jwtVerify(token, secret, { clockTolerance: 60 });
    return payload as { userId: number; username: string };
  } catch {
    return null;
  }
}

export function getJwtSecret(): string {
  const ctx = getRequestContext();
  return ctx.env.JWT_SECRET || "default-secret";
}

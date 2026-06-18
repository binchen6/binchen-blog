import { SignJWT, jwtVerify } from "jose";
import { getRequestContext } from "@cloudflare/next-on-pages";
import { User } from "./types";

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
  if (!saltHex || !hashHex) return false;
  const salt = new Uint8Array(saltHex.match(/.{2}/g)!.map(byte => parseInt(byte, 16)));
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
  return newHashHex === hashHex;
}

export { hashPassword, verifyPassword };

export async function createToken(user: User): Promise<string> {
  const ctx = getRequestContext();
  const secret = new TextEncoder().encode((ctx.env as any).JWT_SECRET || "default-secret");
  return new SignJWT({ userId: user.id, username: user.username })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret);
}

export async function verifyToken(token: string): Promise<{ userId: number; username: string } | null> {
  try {
    const ctx = getRequestContext();
    const secret = new TextEncoder().encode((ctx.env as any).JWT_SECRET || "default-secret");
    const { payload } = await jwtVerify(token, secret, { clockTolerance: 60 });
    return payload as { userId: number; username: string };
  } catch {
    return null;
  }
}

export function getJwtSecret(): string {
  const ctx = getRequestContext();
  return (ctx.env as any).JWT_SECRET || "default-secret";
}

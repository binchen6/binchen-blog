import { getRequestContext } from "@cloudflare/next-on-pages";
import { NextResponse } from "next/server";

export const runtime = "edge";

export async function GET() {
  try {
    const ctx = getRequestContext();
    const db = ctx.env.DB;
    await db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
    return NextResponse.json({ status: "ok", message: "Database connection successful" });
  } catch (error) {
    console.error("Database health check failed:", error);
    return NextResponse.json({ status: "error", message: "Database connection failed" }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { getRequestContext } from "@cloudflare/next-on-pages";
import { createTables } from "@/lib/db";
import { json, noStoreHeaders } from "@/lib/security";

export const runtime = "edge";

export async function GET(request: Request) {
  try {
    const ctx = getRequestContext();
    const env = ctx.env as any;
    const configuredToken = env.INIT_TOKEN;
    const providedToken = new URL(request.url).searchParams.get("token") || request.headers.get("x-init-token");

    if (configuredToken && providedToken !== configuredToken) {
      return json({ success: false, error: "Forbidden" }, { status: 403, headers: noStoreHeaders() });
    }
    if (!configuredToken && env.ALLOW_PUBLIC_INIT !== "true") {
      return json({ success: false, error: "INIT_TOKEN is required in production" }, { status: 403, headers: noStoreHeaders() });
    }

    await createTables();
    const db = env.DB;
    const owner = await db.prepare("SELECT id FROM users WHERE role = 'owner' LIMIT 1").first();
    if (!owner) {
      await db.prepare("UPDATE users SET role = 'owner' WHERE username = 'binchen'").run();
    }

    return json({ success: true, message: "Database initialized and migrated successfully" }, { headers: noStoreHeaders() });
  } catch (error) {
    console.error("Database initialization error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return json(
      { success: false, error: "Failed to initialize database", detail: message.slice(0, 300) },
      { status: 500, headers: noStoreHeaders() }
    );
  }
}

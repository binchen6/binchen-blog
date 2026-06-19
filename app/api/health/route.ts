import { getRequestContext } from "@cloudflare/next-on-pages";
import { cacheHeaders, json } from "@/lib/security";

export const runtime = "edge";

export async function GET() {
  try {
    const ctx = getRequestContext();
    const db = (ctx.env as any).DB;
    await db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
    return json({ status: "ok" }, { headers: cacheHeaders(10, 30) });
  } catch (error) {
    console.error("Database health check failed:", error);
    return json({ status: "error" }, { status: 500 });
  }
}

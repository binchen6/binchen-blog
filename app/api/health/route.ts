import { getDB } from "@/lib/db";
import { cacheHeaders, json } from "@/lib/security";

export const runtime = "edge";

export async function GET() {
  try {
    const db = getDB();
    await db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
    return json({ status: "ok" }, { headers: cacheHeaders(10, 30) });
  } catch (error) {
    console.error("Database health check failed:", error);
    return json({ status: "error" }, { status: 500 });
  }
}

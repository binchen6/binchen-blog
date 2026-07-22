import { NextRequest } from "next/server";
import { getPerformanceSummary } from "@/lib/performance";
import { json, noStoreHeaders } from "@/lib/security";
import { getDb, requireAdmin } from "../_shared";

export const runtime = "edge";

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdmin(request, "admin:access");
    if (auth.error) return auth.error;

    const db = getDb();
    const summary = await getPerformanceSummary(db);
    return json(summary, { headers: noStoreHeaders() });
  } catch (error) {
    console.error("Performance summary error:", error);
    return json({ error: "Failed to fetch performance summary" }, { status: 500, headers: noStoreHeaders() });
  }
}

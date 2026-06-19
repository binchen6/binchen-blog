import { NextRequest } from "next/server";
import { getRequestContext } from "@cloudflare/next-on-pages";
import { canAccessAdmin, getCurrentUserFromRequest } from "@/lib/auth";
import { getPerformanceSummary } from "@/lib/performance";
import { json, noStoreHeaders } from "@/lib/security";

export const runtime = "edge";

export async function GET(request: NextRequest) {
  try {
    const currentUser = await getCurrentUserFromRequest(request);
    if (!currentUser || !canAccessAdmin(currentUser)) {
      return json({ error: "Forbidden" }, { status: 403, headers: noStoreHeaders() });
    }

    const ctx = getRequestContext();
    const summary = await getPerformanceSummary((ctx.env as any).DB);
    return json(summary, { headers: noStoreHeaders() });
  } catch (error) {
    console.error("Performance summary error:", error);
    return json({ error: "Failed to fetch performance summary" }, { status: 500, headers: noStoreHeaders() });
  }
}

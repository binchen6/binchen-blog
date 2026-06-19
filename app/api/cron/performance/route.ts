import { NextRequest } from "next/server";
import { getRequestContext } from "@cloudflare/next-on-pages";
import { runPerformanceSchedule } from "@/lib/performance";
import { json, noStoreHeaders } from "@/lib/security";

export const runtime = "edge";

export async function POST(request: NextRequest) {
  try {
    const ctx = getRequestContext();
    const env = ctx.env as any;
    const configuredSecret = env.CRON_SECRET;
    const providedSecret = request.headers.get("x-cron-secret") || new URL(request.url).searchParams.get("secret");

    if (!configuredSecret || providedSecret !== configuredSecret) {
      return json({ error: "Forbidden" }, { status: 403, headers: noStoreHeaders() });
    }

    const results = await runPerformanceSchedule(env.DB);
    return json({ success: true, results }, { headers: noStoreHeaders() });
  } catch (error) {
    console.error("Performance schedule error:", error);
    return json({ error: "Performance schedule failed" }, { status: 500, headers: noStoreHeaders() });
  }
}

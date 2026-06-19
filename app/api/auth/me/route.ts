import { NextRequest } from "next/server";
import { getCurrentUserFromRequest } from "@/lib/auth";
import { json, noStoreHeaders } from "@/lib/security";

export const runtime = "edge";

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUserFromRequest(request);
    if (!user) {
      return json({ error: "Invalid token" }, { status: 401, headers: noStoreHeaders() });
    }
    return json({ user }, { headers: noStoreHeaders() });
  } catch (error) {
    return json({ error: "Authentication failed" }, { status: 500, headers: noStoreHeaders() });
  }
}

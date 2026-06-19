import { NextResponse } from "next/server";
import { createTables } from "@/lib/db";

export const runtime = "edge";

export async function GET() {
  try {
    await createTables();
    return NextResponse.json({ success: true, message: "Database initialized and migrated successfully" });
  } catch (error) {
    console.error("Database initialization error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to initialize database" },
      { status: 500 }
    );
  }
}

import { NextRequest } from "next/server";
import { cacheHeaders, json, noStoreHeaders, parsePositiveId, requireText } from "@/lib/security";
import { getDb, parseJsonBody, requireAdmin } from "../_shared";

export const runtime = "edge";

const COLUMNS =
  "id, title, badge, year, description, tags, href, external, cta, icon, accent, cover, repo, featured, sort_order, visible, updated_at";

function opt(value: unknown, max = 500): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}
function flag(value: unknown): number {
  return value === true || value === 1 || value === "1" ? 1 : 0;
}
function num(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) ? Math.trunc(n) : 0;
}

/** GET /api/works — 公开作品列表；?all=1 管理员看全部（含隐藏） */
export async function GET(request: NextRequest) {
  try {
    const db = getDb();
    const { searchParams } = new URL(request.url);
    if (searchParams.get("all") === "1") {
      const auth = await requireAdmin(request, "admin:access");
      if (auth.error) return auth.error;
      const rows = await db.prepare(`SELECT ${COLUMNS} FROM works ORDER BY sort_order ASC, id ASC`).all();
      return json({ works: rows.results }, { headers: noStoreHeaders() });
    }
    const rows = await db
      .prepare(`SELECT ${COLUMNS} FROM works WHERE visible = 1 ORDER BY featured DESC, sort_order ASC, id ASC LIMIT 50`)
      .all();
    return json({ works: rows.results }, { headers: cacheHeaders(60, 300) });
  } catch (error) {
    console.error("Get works error:", error);
    return json({ error: "Failed to fetch works" }, { status: 500 });
  }
}

/** POST /api/works — 管理员新增作品 */
export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdmin(request, "admin:access");
    if (auth.error) return auth.error;
    const body = await parseJsonBody(request);
    if (!body) return json({ error: "Invalid JSON body" }, { status: 400 });
    const title = requireText(body.title, 80);
    if (!title) return json({ error: "Title is required" }, { status: 400 });

    const db = getDb();
    const work = await db
      .prepare(
        `INSERT INTO works (title, badge, year, description, tags, href, external, cta, icon, accent, cover, repo, featured, sort_order, visible)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING ${COLUMNS}`
      )
      .bind(
        title, opt(body.badge, 40), opt(body.year, 40), opt(body.description, 1000), opt(body.tags, 300),
        opt(body.href, 300), flag(body.external), opt(body.cta, 40), opt(body.icon, 120), opt(body.accent, 20) || "dai",
        opt(body.cover, 300), opt(body.repo, 300), flag(body.featured), num(body.sort_order),
        body.visible === undefined ? 1 : flag(body.visible)
      )
      .first();
    return json({ work }, { status: 201 });
  } catch (error) {
    console.error("Create work error:", error);
    return json({ error: "Failed to create work" }, { status: 500 });
  }
}

/** PUT /api/works?id= — 管理员更新作品 */
export async function PUT(request: NextRequest) {
  try {
    const auth = await requireAdmin(request, "admin:access");
    if (auth.error) return auth.error;
    const id = parsePositiveId(new URL(request.url).searchParams.get("id"));
    if (!id) return json({ error: "Invalid id" }, { status: 400 });
    const body = await parseJsonBody(request);
    if (!body) return json({ error: "Invalid JSON body" }, { status: 400 });
    const title = requireText(body.title, 80);
    if (!title) return json({ error: "Title is required" }, { status: 400 });

    const db = getDb();
    const work = await db
      .prepare(
        `UPDATE works SET title=?, badge=?, year=?, description=?, tags=?, href=?, external=?, cta=?, icon=?, accent=?,
                cover=?, repo=?, featured=?, sort_order=?, visible=?, updated_at=CURRENT_TIMESTAMP
         WHERE id=? RETURNING ${COLUMNS}`
      )
      .bind(
        title, opt(body.badge, 40), opt(body.year, 40), opt(body.description, 1000), opt(body.tags, 300),
        opt(body.href, 300), flag(body.external), opt(body.cta, 40), opt(body.icon, 120), opt(body.accent, 20) || "dai",
        opt(body.cover, 300), opt(body.repo, 300), flag(body.featured), num(body.sort_order), flag(body.visible), id
      )
      .first();
    if (!work) return json({ error: "Work not found" }, { status: 404 });
    return json({ work });
  } catch (error) {
    console.error("Update work error:", error);
    return json({ error: "Failed to update work" }, { status: 500 });
  }
}

/** DELETE /api/works?id= — 管理员删除作品 */
export async function DELETE(request: NextRequest) {
  try {
    const auth = await requireAdmin(request, "admin:access");
    if (auth.error) return auth.error;
    const id = parsePositiveId(new URL(request.url).searchParams.get("id"));
    if (!id) return json({ error: "Invalid id" }, { status: 400 });
    const db = getDb();
    await db.prepare("DELETE FROM works WHERE id = ?").bind(id).run();
    return json({ success: true });
  } catch (error) {
    console.error("Delete work error:", error);
    return json({ error: "Failed to delete work" }, { status: 500 });
  }
}

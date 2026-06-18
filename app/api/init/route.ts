import { getRequestContext } from "@cloudflare/next-on-pages";
import { NextResponse } from "next/server";

export const runtime = "edge";

export async function GET() {
  try {
    const ctx = getRequestContext();
    const db = ctx.env.DB;

    await db.batch([
      db.prepare(`
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          username TEXT UNIQUE NOT NULL,
          email TEXT UNIQUE NOT NULL,
          password_hash TEXT NOT NULL,
          display_name TEXT,
          avatar TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `),
      db.prepare(`
        CREATE TABLE IF NOT EXISTS posts (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          title TEXT NOT NULL,
          slug TEXT UNIQUE NOT NULL,
          content TEXT NOT NULL,
          excerpt TEXT,
          cover_image TEXT,
          author_id INTEGER NOT NULL,
          status TEXT DEFAULT 'draft' CHECK (status IN ('published', 'draft')),
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          published_at DATETIME,
          tags TEXT,
          view_count INTEGER DEFAULT 0
        )
      `),
      db.prepare(`
        CREATE TABLE IF NOT EXISTS guestbook (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          email TEXT NOT NULL,
          content TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          user_id INTEGER,
          reply_to INTEGER
        )
      `),
      db.prepare(`
        CREATE TABLE IF NOT EXISTS comments (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          post_id INTEGER NOT NULL,
          name TEXT NOT NULL,
          email TEXT NOT NULL,
          content TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          user_id INTEGER,
          parent_id INTEGER
        )
      `),
      db.prepare(`CREATE INDEX IF NOT EXISTS idx_posts_slug ON posts(slug)`),
      db.prepare(`CREATE INDEX IF NOT EXISTS idx_posts_status ON posts(status)`),
      db.prepare(`CREATE INDEX IF NOT EXISTS idx_posts_created ON posts(created_at)`),
      db.prepare(`CREATE INDEX IF NOT EXISTS idx_comments_post ON comments(post_id)`),
    ]);

    return NextResponse.json({ success: true, message: "Database initialized successfully" });
  } catch (error) {
    console.error("Database initialization error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to initialize database" },
      { status: 500 }
    );
  }
}

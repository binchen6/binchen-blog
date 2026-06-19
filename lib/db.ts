import { getRequestContext } from "@cloudflare/next-on-pages";
import { User, Post, GuestbookEntry, Comment, PostMode } from "./types";
import { OWNER_USERNAME, ROLE_PERMISSIONS } from "./auth";

export function getDB() {
  const ctx = getRequestContext();
  return (ctx.env as any).DB as any;
}

export async function createTables() {
  const db = getDB();
  await db.batch([
    db.prepare(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        display_name TEXT,
        avatar TEXT,
        role TEXT DEFAULT 'author' CHECK (role IN ('owner', 'admin', 'editor', 'author', 'member')),
        bio TEXT,
        is_active INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `),
    db.prepare(`
      CREATE TABLE IF NOT EXISTS user_groups (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE NOT NULL,
        label TEXT NOT NULL,
        permissions TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `),
    db.prepare(`
      CREATE TABLE IF NOT EXISTS username_change_requests (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        current_username TEXT NOT NULL,
        requested_username TEXT NOT NULL,
        status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
        reviewed_by INTEGER,
        reviewed_at DATETIME,
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
        images TEXT,
        mode TEXT DEFAULT 'article' CHECK (mode IN ('article', 'moment')),
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
      CREATE TABLE IF NOT EXISTS images (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        url TEXT NOT NULL,
        storage_key TEXT NOT NULL,
        filename TEXT NOT NULL,
        mime_type TEXT NOT NULL,
        size INTEGER NOT NULL,
        sha TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
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
    db.prepare(`CREATE INDEX IF NOT EXISTS idx_posts_author ON posts(author_id)`),
    db.prepare(`CREATE INDEX IF NOT EXISTS idx_images_user ON images(user_id)`),
    db.prepare(`CREATE INDEX IF NOT EXISTS idx_comments_post ON comments(post_id)`),
    db.prepare(`CREATE INDEX IF NOT EXISTS idx_username_requests_status ON username_change_requests(status)`),
    db.prepare(`CREATE INDEX IF NOT EXISTS idx_username_requests_user ON username_change_requests(user_id)`),
  ]);

  await migrateSchema(db);
  await seedUserGroups(db);
  await db.prepare("UPDATE users SET role = 'owner' WHERE username = ?").bind(OWNER_USERNAME).run();
}

async function addColumnIfMissing(db: any, table: string, column: string, definition: string) {
  const columns = await db.prepare(`PRAGMA table_info(${table})`).all();
  const exists = (columns.results || []).some((item: any) => item.name === column);
  if (!exists) {
    await db.prepare(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`).run();
  }
}

async function migrateSchema(db: any) {
  await addColumnIfMissing(db, "users", "role", "TEXT DEFAULT 'author'");
  await addColumnIfMissing(db, "users", "bio", "TEXT");
  await addColumnIfMissing(db, "users", "is_active", "INTEGER DEFAULT 1");
  await addColumnIfMissing(db, "posts", "images", "TEXT");
  await addColumnIfMissing(db, "posts", "mode", "TEXT DEFAULT 'article'");
}

async function seedUserGroups(db: any) {
  const rows = [
    ["owner", "站主", JSON.stringify(ROLE_PERMISSIONS.owner)],
    ["admin", "管理员", JSON.stringify(ROLE_PERMISSIONS.admin)],
    ["editor", "编辑", JSON.stringify(ROLE_PERMISSIONS.editor)],
    ["author", "作者", JSON.stringify(ROLE_PERMISSIONS.author)],
    ["member", "成员", JSON.stringify(ROLE_PERMISSIONS.member)],
  ];

  for (const row of rows) {
    await db.prepare(
      "INSERT OR IGNORE INTO user_groups (name, label, permissions) VALUES (?, ?, ?)"
    ).bind(...row).run();
  }
}

export async function getUserByUsername(username: string): Promise<User | null> {
  const db = getDB();
  const result = await db.prepare("SELECT * FROM users WHERE username = ?").bind(username).first();
  return result as any;
}

export async function getUserByEmail(email: string): Promise<User | null> {
  const db = getDB();
  const result = await db.prepare("SELECT * FROM users WHERE email = ?").bind(email).first();
  return result as any;
}

export async function createUser(username: string, email: string, passwordHash: string, displayName?: string): Promise<User> {
  const db = getDB();
  const role = username === OWNER_USERNAME ? "owner" : "author";
  const result = await db.prepare(
    "INSERT INTO users (username, email, password_hash, display_name, role) VALUES (?, ?, ?, ?, ?) RETURNING *"
  ).bind(username, email, passwordHash, displayName || null, role).first();
  return result as any;
}

export async function getPostBySlug(slug: string): Promise<Post | null> {
  const db = getDB();
  const result = await db.prepare(
    "SELECT * FROM posts WHERE slug = ? AND status = 'published'"
  ).bind(slug).first();
  return result as any;
}

export async function getPosts(limit: number = 10, offset: number = 0): Promise<Post[]> {
  const db = getDB();
  const results = await db.prepare(
    "SELECT * FROM posts WHERE status = 'published' ORDER BY published_at DESC LIMIT ? OFFSET ?"
  ).bind(limit, offset).all();
  return results.results as any;
}

export async function getAllPosts(limit: number = 50, offset: number = 0): Promise<Post[]> {
  const db = getDB();
  const results = await db.prepare(
    "SELECT * FROM posts ORDER BY created_at DESC LIMIT ? OFFSET ?"
  ).bind(limit, offset).all();
  return results.results as any;
}

export async function createPost(
  title: string,
  slug: string,
  content: string,
  excerpt: string,
  authorId: number,
  coverImage?: string,
  tags?: string,
  status: "published" | "draft" = "published",
  mode: PostMode = "article",
  images?: string
): Promise<Post> {
  const db = getDB();
  const publishedAt = status === "published" ? new Date().toISOString() : null;
  const result = await db.prepare(
    `INSERT INTO posts (title, slug, content, excerpt, cover_image, images, mode, author_id, status, published_at, tags)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING *`
  ).bind(title, slug, content, excerpt, coverImage || null, images || null, mode, authorId, status, publishedAt, tags || null).first();
  return result as any;
}

export async function incrementViewCount(slug: string): Promise<void> {
  const db = getDB();
  await db.prepare("UPDATE posts SET view_count = view_count + 1 WHERE slug = ?").bind(slug).run();
}

export async function getGuestbookEntries(limit: number = 50): Promise<GuestbookEntry[]> {
  const db = getDB();
  const results = await db.prepare(
    "SELECT * FROM guestbook ORDER BY created_at DESC LIMIT ?"
  ).bind(limit).all();
  return results.results as any;
}

export async function createGuestbookEntry(name: string, email: string, content: string, userId?: number, replyTo?: number): Promise<GuestbookEntry> {
  const db = getDB();
  const result = await db.prepare(
    "INSERT INTO guestbook (name, email, content, user_id, reply_to) VALUES (?, ?, ?, ?, ?) RETURNING *"
  ).bind(name, email, content, userId || null, replyTo || null).first();
  return result as any;
}

export async function getCommentsByPostId(postId: number): Promise<Comment[]> {
  const db = getDB();
  const results = await db.prepare(
    "SELECT * FROM comments WHERE post_id = ? ORDER BY created_at DESC"
  ).bind(postId).all();
  return results.results as any;
}

export async function createComment(
  postId: number,
  name: string,
  email: string,
  content: string,
  userId?: number,
  parentId?: number
): Promise<Comment> {
  const db = getDB();
  const result = await db.prepare(
    "INSERT INTO comments (post_id, name, email, content, user_id, parent_id) VALUES (?, ?, ?, ?, ?, ?) RETURNING *"
  ).bind(postId, name, email, content, userId || null, parentId || null).first();
  return result as any;
}

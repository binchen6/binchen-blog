import { getRequestContext } from "@cloudflare/next-on-pages";
import { User, Post, GuestbookEntry, Comment } from "./types";

export function getDB() {
  const ctx = getRequestContext();
  return ctx.env.DB;
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
        view_count INTEGER DEFAULT 0,
        FOREIGN KEY (author_id) REFERENCES users(id)
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
        reply_to INTEGER,
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (reply_to) REFERENCES guestbook(id)
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
        parent_id INTEGER,
        FOREIGN KEY (post_id) REFERENCES posts(id),
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (parent_id) REFERENCES comments(id)
      )
    `),
    db.prepare(`
      CREATE INDEX IF NOT EXISTS idx_posts_slug ON posts(slug)
    `),
    db.prepare(`
      CREATE INDEX IF NOT EXISTS idx_posts_status ON posts(status)
    `),
    db.prepare(`
      CREATE INDEX IF NOT EXISTS idx_posts_created ON posts(created_at)
    `),
    db.prepare(`
      CREATE INDEX IF NOT EXISTS idx_comments_post ON comments(post_id)
    `),
  ]);
}

export async function getUserByUsername(username: string): Promise<User | null> {
  const db = getDB();
  const result = await db.prepare("SELECT * FROM users WHERE username = ?").bind(username).first();
  return result as User | null;
}

export async function getUserByEmail(email: string): Promise<User | null> {
  const db = getDB();
  const result = await db.prepare("SELECT * FROM users WHERE email = ?").bind(email).first();
  return result as User | null;
}

export async function createUser(username: string, email: string, passwordHash: string, displayName?: string): Promise<User> {
  const db = getDB();
  const result = await db.prepare(
    "INSERT INTO users (username, email, password_hash, display_name) VALUES (?, ?, ?, ?) RETURNING *"
  ).bind(username, email, passwordHash, displayName || null).first();
  return result as User;
}

export async function getPostBySlug(slug: string): Promise<Post | null> {
  const db = getDB();
  const result = await db.prepare(
    "SELECT * FROM posts WHERE slug = ? AND status = 'published'"
  ).bind(slug).first();
  return result as Post | null;
}

export async function getPosts(limit: number = 10, offset: number = 0): Promise<Post[]> {
  const db = getDB();
  const results = await db.prepare(
    "SELECT * FROM posts WHERE status = 'published' ORDER BY published_at DESC LIMIT ? OFFSET ?"
  ).bind(limit, offset).all();
  return results.results as Post[];
}

export async function getAllPosts(limit: number = 50, offset: number = 0): Promise<Post[]> {
  const db = getDB();
  const results = await db.prepare(
    "SELECT * FROM posts ORDER BY created_at DESC LIMIT ? OFFSET ?"
  ).bind(limit, offset).all();
  return results.results as Post[];
}

export async function createPost(
  title: string,
  slug: string,
  content: string,
  excerpt: string,
  authorId: number,
  coverImage?: string,
  tags?: string,
  status: "published" | "draft" = "published"
): Promise<Post> {
  const db = getDB();
  const publishedAt = status === "published" ? new Date().toISOString() : null;
  const result = await db.prepare(
    `INSERT INTO posts (title, slug, content, excerpt, cover_image, author_id, status, published_at, tags)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING *`
  ).bind(title, slug, content, excerpt, coverImage || null, authorId, status, publishedAt, tags || null).first();
  return result as Post;
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
  return results.results as GuestbookEntry[];
}

export async function createGuestbookEntry(name: string, email: string, content: string, userId?: number, replyTo?: number): Promise<GuestbookEntry> {
  const db = getDB();
  const result = await db.prepare(
    "INSERT INTO guestbook (name, email, content, user_id, reply_to) VALUES (?, ?, ?, ?, ?) RETURNING *"
  ).bind(name, email, content, userId || null, replyTo || null).first();
  return result as GuestbookEntry;
}

export async function getCommentsByPostId(postId: number): Promise<Comment[]> {
  const db = getDB();
  const results = await db.prepare(
    "SELECT * FROM comments WHERE post_id = ? ORDER BY created_at DESC"
  ).bind(postId).all();
  return results.results as Comment[];
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
  return result as Comment;
}

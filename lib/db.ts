import { DEFAULT_WORKS } from "./works-data";
import { getRequestContext } from "@cloudflare/next-on-pages";
import { User, Post, GuestbookEntry, Comment, PostMode } from "./types";
import { ROLE_PERMISSIONS } from "./auth";

/**
 * D1 绑定。env 类型来自全局 CloudflareEnv（env.d.ts 声明，含 DB: D1Database），
 * 无需 as any 强转；返回 D1Database 供泛型查询（first<T>()/all<T>()）。
 */
export function getDB(): D1Database {
  return getRequestContext().env.DB;
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
        view_count INTEGER DEFAULT 0,
        is_featured INTEGER DEFAULT 0,
        featured_rank INTEGER DEFAULT 0
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
      CREATE TABLE IF NOT EXISTS performance_events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        run_id TEXT,
        task TEXT NOT NULL,
        status TEXT NOT NULL CHECK (status IN ('ok', 'error')),
        duration_ms INTEGER NOT NULL,
        details TEXT,
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
    db.prepare(`
      CREATE TABLE IF NOT EXISTS likes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        target_type TEXT NOT NULL CHECK (target_type IN ('post', 'comment')),
        target_id INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, target_type, target_id)
      )
    `),
    db.prepare(`
      CREATE TABLE IF NOT EXISTS follows (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        follower_id INTEGER NOT NULL,
        author_id INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(follower_id, author_id)
      )
    `),
    db.prepare(`
      CREATE TABLE IF NOT EXISTS notifications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        type TEXT NOT NULL CHECK (type IN ('mention', 'reply', 'comment', 'guestbook', 'like', 'follow', 'announcement')),
        actor_id INTEGER,
        actor_name TEXT,
        target_type TEXT,
        target_id INTEGER,
        link TEXT,
        content TEXT,
        is_read INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `),
    db.prepare(`
      CREATE TABLE IF NOT EXISTS announcements (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        created_by INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `),
    db.prepare(`
      CREATE TABLE IF NOT EXISTS works (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        badge TEXT DEFAULT '',
        year TEXT DEFAULT '',
        description TEXT DEFAULT '',
        tags TEXT DEFAULT '',
        href TEXT DEFAULT '',
        external INTEGER DEFAULT 0,
        cta TEXT DEFAULT '',
        icon TEXT DEFAULT '',
        accent TEXT DEFAULT 'dai',
        cover TEXT DEFAULT '',
        repo TEXT DEFAULT '',
        featured INTEGER DEFAULT 0,
        sort_order INTEGER DEFAULT 0,
        visible INTEGER DEFAULT 1,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `),
    db.prepare(`CREATE INDEX IF NOT EXISTS idx_works_visible ON works(visible, featured, sort_order)`),
    db.prepare(`CREATE INDEX IF NOT EXISTS idx_posts_slug ON posts(slug)`),
    db.prepare(`CREATE INDEX IF NOT EXISTS idx_posts_status ON posts(status)`),
    db.prepare(`CREATE INDEX IF NOT EXISTS idx_posts_created ON posts(created_at)`),
    db.prepare(`CREATE INDEX IF NOT EXISTS idx_posts_author ON posts(author_id)`),
    db.prepare(`CREATE INDEX IF NOT EXISTS idx_images_user ON images(user_id)`),
    db.prepare(`CREATE INDEX IF NOT EXISTS idx_comments_post ON comments(post_id)`),
    db.prepare(`CREATE INDEX IF NOT EXISTS idx_username_requests_status ON username_change_requests(status)`),
    db.prepare(`CREATE INDEX IF NOT EXISTS idx_username_requests_user ON username_change_requests(user_id)`),
    db.prepare(`CREATE INDEX IF NOT EXISTS idx_performance_events_created ON performance_events(created_at)`),
    db.prepare(`CREATE INDEX IF NOT EXISTS idx_likes_target ON likes(target_type, target_id)`),
    db.prepare(`CREATE INDEX IF NOT EXISTS idx_follows_author ON follows(author_id)`),
    db.prepare(`CREATE INDEX IF NOT EXISTS idx_follows_follower ON follows(follower_id)`),
    db.prepare(`CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, is_read)`),
    // 复合索引：匹配高频查询的 WHERE + ORDER BY（只加不改旧索引，IF NOT EXISTS 幂等）
    db.prepare(`CREATE INDEX IF NOT EXISTS idx_posts_status_published ON posts(status, published_at DESC)`),
    db.prepare(`CREATE INDEX IF NOT EXISTS idx_comments_post_created ON comments(post_id, created_at)`),
    db.prepare(`CREATE INDEX IF NOT EXISTS idx_guestbook_created ON guestbook(created_at)`),
    db.prepare(`CREATE INDEX IF NOT EXISTS idx_notifications_user_read_created ON notifications(user_id, is_read, created_at)`),
    db.prepare(`CREATE TABLE IF NOT EXISTS _meta (key TEXT PRIMARY KEY, value TEXT NOT NULL)`),
  ]);

  await seedWorks(db);
  await migrateSchema(db);
  await migrateImageUrls(db);
  await seedUserGroups(db);
  await db.prepare("UPDATE users SET role = 'author' WHERE role IS NULL").run();
}


/** 作品表为空时写入默认作品（幂等：只在空表执行） */
async function seedWorks(db: D1Database) {
  const row = await db.prepare("SELECT COUNT(*) AS c FROM works").first<{ c: number }>();
  if (row && row.c > 0) return;
  for (const w of DEFAULT_WORKS) {
    await db.prepare(
      `INSERT INTO works (title, badge, year, description, tags, href, external, cta, icon, accent, cover, repo, featured, sort_order, visible)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      w.title, w.badge, w.year, w.description, w.tags, w.href, w.external, w.cta,
      w.icon, w.accent, w.cover, w.repo, w.featured, w.sort_order, w.visible
    ).run();
  }
}

async function addColumnIfMissing(db: D1Database, table: string, column: string, definition: string) {
  const columns = await db.prepare(`PRAGMA table_info(${table})`).all<{ name: string }>();
  const exists = (columns.results || []).some((item) => item.name === column);
  if (!exists) {
    await db.prepare(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`).run();
  }
}

async function migrateSchema(db: D1Database) {
  await addColumnIfMissing(db, "users", "role", "TEXT DEFAULT 'author'");
  await addColumnIfMissing(db, "users", "bio", "TEXT");
  await addColumnIfMissing(db, "users", "is_active", "INTEGER DEFAULT 1");
  await addColumnIfMissing(db, "posts", "images", "TEXT");
  await addColumnIfMissing(db, "posts", "mode", "TEXT DEFAULT 'article'");
  await addColumnIfMissing(db, "posts", "is_featured", "INTEGER DEFAULT 0");
  await addColumnIfMissing(db, "posts", "featured_rank", "INTEGER DEFAULT 0");
  await addColumnIfMissing(db, "images", "sha", "TEXT");
  await addColumnIfMissing(db, "guestbook", "user_id", "INTEGER");
  await addColumnIfMissing(db, "guestbook", "reply_to", "INTEGER");
  await addColumnIfMissing(db, "comments", "user_id", "INTEGER");
  await addColumnIfMissing(db, "comments", "parent_id", "INTEGER");
  await addColumnIfMissing(db, "users", "avatar_history", "TEXT");
  await addColumnIfMissing(db, "images", "purpose", "TEXT DEFAULT 'general'");
  await addColumnIfMissing(db, "performance_events", "run_id", "TEXT");
  await db.prepare("CREATE INDEX IF NOT EXISTS idx_posts_featured ON posts(is_featured, featured_rank)").run();
}

function decodeMaybeEncodedPath(path: string): string {
  try {
    return decodeURIComponent(path);
  } catch {
    return path;
  }
}

function githubCdnPathFromUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    const match = parsed.pathname.match(/^\/gh\/[^/]+\/[^@/]+@[^/]+\/(.+)$/);
    return match ? decodeMaybeEncodedPath(match[1]) : null;
  } catch {
    return null;
  }
}

async function migrateImageUrls(db: D1Database) {
  // 版本检查：避免每次启动都全表扫描
  const versionRow = await db.prepare("SELECT value FROM _meta WHERE key = 'schema_version'").first<{ value: string }>().catch(() => null);
  if (versionRow && Number(versionRow.value) >= 2) return;

  const imageRows = await db.prepare("SELECT id, url, storage_key FROM images").all<{ id: number; url: string; storage_key: string }>();
  const urlMap = new Map<string, string>();

  for (const image of imageRows.results || []) {
    const proxyUrl = `/api/images/${image.id}`;
    urlMap.set(String(image.url), proxyUrl);
    urlMap.set(String(image.storage_key), proxyUrl);
    const cdnPath = githubCdnPathFromUrl(String(image.url || ""));
    if (cdnPath) urlMap.set(cdnPath, proxyUrl);

    if (image.url !== proxyUrl) {
      await db.prepare("UPDATE images SET url = ? WHERE id = ?").bind(proxyUrl, image.id).run();
    }
  }

  if (urlMap.size === 0) return;

  const posts = await db.prepare("SELECT id, cover_image, images FROM posts").all<{ id: number; cover_image: string | null; images: string | null }>();
  for (const post of posts.results || []) {
    let changed = false;
    let coverImage = post.cover_image;
    const mappedCover = coverImage ? urlMap.get(String(coverImage)) || urlMap.get(githubCdnPathFromUrl(String(coverImage)) || "") : null;
    if (mappedCover && mappedCover !== coverImage) {
      coverImage = mappedCover;
      changed = true;
    }

    let images = post.images;
    if (images) {
      try {
        const parsedImages = JSON.parse(images);
        if (Array.isArray(parsedImages)) {
          const nextImages = parsedImages.map((url) => urlMap.get(String(url)) || urlMap.get(githubCdnPathFromUrl(String(url)) || "") || url);
          if (JSON.stringify(nextImages) !== images) {
            images = JSON.stringify(nextImages);
            changed = true;
          }
        }
      } catch {
        // Leave malformed image JSON untouched.
      }
    }

    if (changed) {
      await db.prepare("UPDATE posts SET cover_image = ?, images = ? WHERE id = ?").bind(coverImage || null, images || null, post.id).run();
    }
  }

  // 标记迁移完成
  await db.prepare("INSERT OR REPLACE INTO _meta (key, value) VALUES ('schema_version', '2')").run();
}

async function seedUserGroups(db: D1Database) {
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
  return db.prepare("SELECT * FROM users WHERE username = ?").bind(username).first<User>();
}

export async function getUserByEmail(email: string): Promise<User | null> {
  const db = getDB();
  return db.prepare("SELECT * FROM users WHERE email = ?").bind(email).first<User>();
}

export async function createUser(username: string, email: string, passwordHash: string, displayName?: string): Promise<User> {
  const db = getDB();
  const result = await db.prepare(
    "INSERT INTO users (username, email, password_hash, display_name, role) VALUES (?, ?, ?, ?, ?) RETURNING *"
  ).bind(username, email, passwordHash, displayName || null, "member").first<User>();
  // INSERT ... RETURNING 恒返回一行；D1 类型为 T | null，此处断言非空
  return result as User;
}

export async function getPostBySlug(slug: string): Promise<Post | null> {
  const db = getDB();
  return db.prepare(
    "SELECT * FROM posts WHERE slug = ? AND status = 'published'"
  ).bind(slug).first<Post>();
}

export async function getPosts(limit: number = 10, offset: number = 0): Promise<Post[]> {
  const db = getDB();
  const results = await db.prepare(
    "SELECT * FROM posts WHERE status = 'published' ORDER BY published_at DESC LIMIT ? OFFSET ?"
  ).bind(limit, offset).all<Post>();
  return results.results;
}

export async function getAllPosts(limit: number = 50, offset: number = 0): Promise<Post[]> {
  const db = getDB();
  const results = await db.prepare(
    "SELECT * FROM posts ORDER BY created_at DESC LIMIT ? OFFSET ?"
  ).bind(limit, offset).all<Post>();
  return results.results;
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
  ).bind(title, slug, content, excerpt, coverImage || null, images || null, mode, authorId, status, publishedAt, tags || null).first<Post>();
  // INSERT ... RETURNING 恒返回一行；D1 类型为 T | null，此处断言非空
  return result as Post;
}

export async function incrementViewCount(slug: string): Promise<void> {
  const db = getDB();
  await db.prepare("UPDATE posts SET view_count = view_count + 1 WHERE slug = ?").bind(slug).run();
}

export async function getGuestbookEntries(limit: number = 50): Promise<GuestbookEntry[]> {
  const db = getDB();
  const results = await db.prepare(
    "SELECT id, name, content, created_at, user_id, reply_to FROM guestbook ORDER BY created_at DESC LIMIT ?"
  ).bind(limit).all<GuestbookEntry>();
  return results.results;
}

export async function createGuestbookEntry(name: string, email: string, content: string, userId?: number, replyTo?: number): Promise<GuestbookEntry> {
  const db = getDB();
  const result = await db.prepare(
    "INSERT INTO guestbook (name, email, content, user_id, reply_to) VALUES (?, ?, ?, ?, ?) RETURNING *"
  ).bind(name, email, content, userId || null, replyTo || null).first<GuestbookEntry>();
  // INSERT ... RETURNING 恒返回一行；D1 类型为 T | null，此处断言非空
  return result as GuestbookEntry;
}

export async function getCommentsByPostId(postId: number): Promise<Comment[]> {
  const db = getDB();
  const results = await db.prepare(
    "SELECT id, post_id, name, content, created_at, user_id, parent_id FROM comments WHERE post_id = ? ORDER BY created_at DESC"
  ).bind(postId).all<Comment>();
  return results.results;
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
  ).bind(postId, name, email, content, userId || null, parentId || null).first<Comment>();
  // INSERT ... RETURNING 恒返回一行；D1 类型为 T | null，此处断言非空
  return result as Comment;
}

export interface Env {
  DB: D1Database;
  BUCKET: R2Bucket;
  JWT_SECRET: string;
  NEXT_PUBLIC_SITE_URL: string;
}

export interface User {
  id: number;
  username: string;
  email: string;
  display_name: string | null;
  avatar: string | null;
  created_at: string;
}

export interface Post {
  id: number;
  title: string;
  slug: string;
  content: string;
  excerpt: string | null;
  cover_image: string | null;
  author_id: number;
  status: "published" | "draft";
  created_at: string;
  updated_at: string;
  published_at: string | null;
  tags: string | null;
  view_count: number;
}

export interface GuestbookEntry {
  id: number;
  name: string;
  email: string;
  content: string;
  created_at: string;
  user_id: number | null;
  reply_to: number | null;
}

export interface Comment {
  id: number;
  post_id: number;
  name: string;
  email: string;
  content: string;
  created_at: string;
  user_id: number | null;
  parent_id: number | null;
}

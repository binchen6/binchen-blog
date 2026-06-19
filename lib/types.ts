export interface Env {
  DB: D1Database;
  JWT_SECRET: string;
  NEXT_PUBLIC_SITE_URL: string;
  GITHUB_TOKEN: string;
  GITHUB_OWNER: string;
  GITHUB_REPO: string;
  GITHUB_BRANCH?: string;
  GITHUB_UPLOAD_DIR?: string;
}

export type UserRole = "owner" | "admin" | "editor" | "author" | "member";
export type PostMode = "article" | "moment";
export type PostStatus = "published" | "draft";

export interface User {
  id: number;
  username: string;
  email: string;
  display_name: string | null;
  avatar: string | null;
  role: UserRole;
  bio: string | null;
  is_active: number;
  created_at: string;
}

export interface Post {
  id: number;
  title: string;
  slug: string;
  content: string;
  excerpt: string | null;
  cover_image: string | null;
  images: string | null;
  mode: PostMode;
  author_id: number;
  status: PostStatus;
  created_at: string;
  updated_at: string;
  published_at: string | null;
  tags: string | null;
  view_count: number;
}

export interface ImageAsset {
  id: number;
  user_id: number;
  url: string;
  storage_key: string;
  filename: string;
  mime_type: string;
  size: number;
  sha: string | null;
  created_at: string;
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

export interface UsernameChangeRequest {
  id: number;
  user_id: number;
  current_username: string;
  requested_username: string;
  status: "pending" | "approved" | "rejected";
  reviewed_by: number | null;
  reviewed_at: string | null;
  created_at: string;
}

export interface UserRow {
  id: number;
  username: string;
  email: string;
  display_name?: string | null;
  role: string;
  is_active: number;
  created_at: string;
}

export interface PostRow {
  slug: string;
  title: string;
  mode: string;
  status: string;
  is_featured: number;
  featured_rank: number;
  author_username?: string | null;
}

export interface GuestbookRow {
  id: number;
  name: string;
  content: string;
}

export interface CommentRow {
  id: number;
  name: string;
  content: string;
  post_title?: string | null;
}

export interface ImageRow {
  id: number;
  url: string;
  filename: string;
}

export interface UsernameRequestRow {
  id: number;
  current_username: string;
  requested_username: string;
  display_name?: string | null;
  created_at: string;
}

export interface PerformanceTaskRow {
  task: string;
  description?: string;
  runs: number;
  failures: number;
  avg_duration_ms: number;
  max_duration_ms: number;
  last_failed_at?: string | null;
}

export interface PerformanceRunRow {
  run_id: string | null;
  status: "ok" | "error";
  duration_ms: number;
  details: string;
  created_at: string;
  detailsText?: string;
}

export interface AnnouncementRow {
  id: number;
  title: string;
  content: string;
  created_at: string;
  created_by_name?: string | null;
  created_by_username?: string | null;
}

export interface GithubStorageStatus {
  configured: boolean;
  missing: string[];
  owner?: string;
  repo?: string;
  branch: string;
  uploadDir: string;
  tokenPresent: boolean;
  tokenLength: number;
  repoCheck: { ok: boolean; status?: number; message?: string };
  sources?: Record<string, string>;
  runtimeEnvPresence?: Record<string, boolean>;
  buildEnvPresence?: Record<string, boolean>;
  relatedRuntimeEnvKeys?: string[];
}

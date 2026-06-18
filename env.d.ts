/// <reference types="@cloudflare/next-on-pages" />
/// <reference types="@cloudflare/workers-types" />

interface CloudflareEnv {
  DB: D1Database;
  JWT_SECRET: string;
  NEXT_PUBLIC_SITE_URL: string;
  GITHUB_TOKEN: string;
  GITHUB_OWNER: string;
  GITHUB_REPO: string;
  GITHUB_BRANCH?: string;
  GITHUB_UPLOAD_DIR?: string;
}

type EnhancedRequest = import('next').NextRequest & {
  cf?: import('@cloudflare/workers-types').RequestInitCfProperties;
};

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
  INIT_TOKEN?: string;
  ALLOW_PUBLIC_INIT?: string;
  CRON_SECRET?: string;
  /** 上传大小上限（MB），默认 25，硬上限 50 */
  MAX_UPLOAD_MB?: string;
  /** 设为 jsdelivr 且图床仓库公开时，图片走 CDN 302 直出 */
  IMAGE_CDN?: string;
}

type EnhancedRequest = import('next').NextRequest & {
  cf?: import('@cloudflare/workers-types').RequestInitCfProperties;
};

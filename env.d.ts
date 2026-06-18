/// <reference types="@cloudflare/next-on-pages" />
/// <reference types="@cloudflare/workers-types" />

interface CloudflareEnv {
  DB: D1Database;
  BUCKET: R2Bucket;
  JWT_SECRET: string;
  NEXT_PUBLIC_SITE_URL: string;
}

type EnhancedRequest = import('next').NextRequest & {
  cf?: import('@cloudflare/workers-types').RequestInitCfProperties;
};
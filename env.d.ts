/// <reference types="@cloudflare/next-on-pages" />

interface CloudflareEnv {
  DB: D1Database;
  BUCKET: R2Bucket;
  JWT_SECRET: string;
  NEXT_PUBLIC_SITE_URL: string;
}

type EnhancedRequest = import('next').NextRequest & {
  cf?: import('@cloudflare/workers-types').RequestInitCfProperties;
};

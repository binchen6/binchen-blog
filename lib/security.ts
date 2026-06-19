import { NextRequest, NextResponse } from "next/server";

type RateLimitOptions = {
  key: string;
  limit: number;
  windowMs: number;
};

const buckets = new Map<string, { count: number; resetAt: number }>();

export function cleanupRateLimitBuckets(now: number = Date.now()): number {
  let removed = 0;
  Array.from(buckets.entries()).forEach(([key, bucket]) => {
    if (bucket.resetAt <= now) {
      buckets.delete(key);
      removed += 1;
    }
  });
  return removed;
}

export function getClientIp(request: NextRequest): string {
  return (
    request.headers.get("cf-connecting-ip") ||
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "unknown"
  );
}

export function rateLimit(request: NextRequest, options: RateLimitOptions): NextResponse | null {
  const now = Date.now();
  const bucketKey = `${options.key}:${getClientIp(request)}`;
  const existing = buckets.get(bucketKey);

  if (!existing || existing.resetAt <= now) {
    buckets.set(bucketKey, { count: 1, resetAt: now + options.windowMs });
    return null;
  }

  existing.count += 1;
  if (existing.count > options.limit) {
    return NextResponse.json(
      { error: "Too many requests" },
      {
        status: 429,
        headers: {
          ...securityHeaders(),
          "Retry-After": String(Math.ceil((existing.resetAt - now) / 1000)),
        },
      }
    );
  }

  return null;
}

export function clampText(value: unknown, maxLength: number): string {
  return String(value || "").trim().slice(0, maxLength);
}

export function requireText(value: unknown, maxLength: number): string | null {
  const text = clampText(value, maxLength);
  return text.length > 0 ? text : null;
}

export function isSafePublicUrl(value: unknown): boolean {
  if (!value) return true;
  try {
    const url = new URL(String(value));
    return url.protocol === "https:" && !url.username && !url.password && url.href.length <= 2048;
  } catch {
    return false;
  }
}

export function parseBoundedInt(value: unknown, fallback: number, min: number, max: number): number {
  const parsed = Number.parseInt(String(value ?? ""), 10);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(Math.max(parsed, min), max);
}

export function parsePositiveId(value: unknown): number | null {
  const parsed = Number.parseInt(String(value ?? ""), 10);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null;
}

export function cacheHeaders(maxAgeSeconds: number = 60, staleSeconds: number = 300): HeadersInit {
  return {
    "Cache-Control": `public, max-age=${maxAgeSeconds}, stale-while-revalidate=${staleSeconds}`,
  };
}

export function noStoreHeaders(): HeadersInit {
  return {
    "Cache-Control": "no-store",
  };
}

export function securityHeaders(): HeadersInit {
  return {
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
  };
}

export function json(data: unknown, init: ResponseInit = {}) {
  return NextResponse.json(data, {
    ...init,
    headers: {
      ...securityHeaders(),
      ...(init.headers || {}),
    },
  });
}

import { NextRequest, NextResponse } from "next/server";

/**
 * 旧/小写路径 → /CryoClaw 301
 * Cloudflare Pages 上 Function 优先于 _redirects，next.config 的 redirect
 * 又因大小写不敏感匹配会自循环，所以用 middleware 做精确（大小写敏感）判断。
 * /CryClaw 与 /cryclaw 是 2026.9 之前的旧拼写，301 到新拼写 /CryoClaw。
 */
export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  if (path === "/cryclaw" || path === "/CryClaw" || path === "/cryoclaw") {
    return NextResponse.redirect(new URL("/CryoClaw", request.url), 301);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/cryclaw", "/CryClaw", "/cryoclaw"],
};

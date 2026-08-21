import { NextRequest, NextResponse } from "next/server";

/**
 * /cryclaw → /CryClaw 301
 * Cloudflare Pages 上 Function 优先于 _redirects，next.config 的 redirect
 * 又因大小写不敏感匹配会自循环，所以用 middleware 做精确（大小写敏感）判断。
 */
export function middleware(request: NextRequest) {
  if (request.nextUrl.pathname === "/cryclaw") {
    return NextResponse.redirect(new URL("/CryClaw", request.url), 301);
  }
  return NextResponse.next();
}

export const config = {
  matcher: "/cryclaw",
};

import { NextRequest, NextResponse } from "next/server";
import { rateLimit } from "@/lib/rateLimit";

// Simple global API rate limiting middleware.
// For distributed deployments, move buckets to a shared store (e.g., Redis) and use IP from edge.
export function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;
  // Auth guard for protected routes (expand as needed)
  const protectedPaths = ["/post", "/account", "/account/settings"];
  const isProtected = protectedPaths.some((p) => path === p || path.startsWith(`${p}/`));
  if (isProtected) {
    const session = req.cookies.get("session");
    if (!session || !session.value) {
      const url = req.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("next", path);
      return NextResponse.redirect(url);
    }
  }

  // Apply API rate limiting
  if (!path.startsWith("/api/")) return NextResponse.next();

  const ip =
    // Next.js provides .ip on some platforms; else fall back to header
    (req as any).ip ||
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "127.0.0.1";

  // Allow more budget for health checks; adjust per route as needed
  const isHealth = path.startsWith("/api/health");
  const opts = {
    windowMs: 60_000, // 1 minute
    max: isHealth ? 60 : 120, // per minute
  } as const;

  const result = rateLimit(ip, path, opts);

  if (!result.success) {
    const res = NextResponse.json(
      { error: "Too Many Requests" },
      { status: 429 }
    );
    res.headers.set("Retry-After", Math.max(1, Math.ceil((result.resetAt - Date.now()) / 1000)).toString());
    res.headers.set("X-RateLimit-Remaining", result.remaining.toString());
    res.headers.set("X-RateLimit-Reset", result.resetAt.toString());
    return res;
  }

  const res = NextResponse.next();
  res.headers.set("X-RateLimit-Remaining", result.remaining.toString());
  res.headers.set("X-RateLimit-Reset", result.resetAt.toString());
  return res;
}

export const config = {
  // Run on API routes for rate limiting, and on protected pages for auth
  matcher: ["/api/:path*", "/post", "/post/:path*", "/account", "/account/:path*"],
};

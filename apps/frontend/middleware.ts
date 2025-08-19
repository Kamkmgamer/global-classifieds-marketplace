import { NextRequest, NextResponse } from "next/server";
import { rateLimit } from "@/lib/rateLimit";

// Simple global API rate limiting middleware.
// For distributed deployments, move buckets to a shared store (e.g., Redis) and use IP from edge.
export function middleware(req: NextRequest) {
  // Generate a per-request nonce and pass it downstream via request headers
  const nonce = crypto.randomUUID().replaceAll("-", "");

  const isDev = process.env.NODE_ENV !== "production";
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
  let backendOrigin = "";
  try {
    if (backendUrl) backendOrigin = new URL(backendUrl).origin;
  } catch {
    // ignore invalid URL
  }

  const baseDirectives = [
    "default-src 'self'",
    // In dev, allow unsafe-eval for React Refresh. Use nonce for any inline scripts.
    `script-src 'self' 'nonce-${nonce}'${isDev ? " 'unsafe-eval'" : ""}`,
    "style-src 'self' 'unsafe-inline' https: data:",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data: https:",
    // Allow websocket and backend connections in dev; https only in prod
    isDev
      ? `connect-src 'self' http: https: ws: wss: ${backendOrigin}`.trim()
      : `connect-src 'self' https: ${backendOrigin}`.trim(),
    "frame-ancestors 'self'",
    "form-action 'self'",
    "base-uri 'self'",
    "object-src 'none'",
  ];
  if (!isDev) baseDirectives.push("upgrade-insecure-requests");
  const cspValue = baseDirectives.join("; ");

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
      const res = NextResponse.redirect(url);
      res.headers.set("Content-Security-Policy", cspValue);
      return res;
    }
  }

  // Pass nonce to the App Router via request headers and set CSP on the response
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-nonce", nonce);
  const res = NextResponse.next({ request: { headers: requestHeaders } });
  res.headers.set("Content-Security-Policy", cspValue);

  // Apply API rate limiting only for API paths
  if (path.startsWith("/api/")) {
    const ip =
      (req as any).ip ||
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "127.0.0.1";

    const isHealth = path.startsWith("/api/health");
    const opts = {
      windowMs: 60_000,
      max: isHealth ? 60 : 120,
    } as const;

    const result = rateLimit(ip, path, opts);
    if (!result.success) {
      const rateRes = NextResponse.json({ error: "Too Many Requests" }, { status: 429 });
      rateRes.headers.set("Retry-After", Math.max(1, Math.ceil((result.resetAt - Date.now()) / 1000)).toString());
      rateRes.headers.set("X-RateLimit-Remaining", result.remaining.toString());
      rateRes.headers.set("X-RateLimit-Reset", result.resetAt.toString());
      rateRes.headers.set("Content-Security-Policy", cspValue);
      return rateRes;
    }
    res.headers.set("X-RateLimit-Remaining", result.remaining.toString());
    res.headers.set("X-RateLimit-Reset", result.resetAt.toString());
  }
  return res;
}

export const config = {
  // Run on all routes to apply CSP and auth; rate limiting is applied only on /api/* inside middleware
  matcher: ["/(.*)"],
};

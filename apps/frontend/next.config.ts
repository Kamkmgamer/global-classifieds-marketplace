import type { NextConfig } from "next";

const securityHeaders = [
  { key: "X-DNS-Prefetch-Control", value: "on" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "accelerometer=(), autoplay=(), camera=(), clipboard-read=(), clipboard-write=(), geolocation=(self), microphone=(), payment=()" },
];

function buildCsp() {
  const isDev = process.env.NODE_ENV !== "production";
  // In dev, allow unsafe-eval for React Refresh; in prod, remove it.
  const scriptSrc = isDev
    ? "script-src 'self' 'unsafe-inline' 'unsafe-eval'"
    : "script-src 'self'";

  // Allow connecting to configured backend origin (if present)
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
  let backendOrigin = "";
  try {
    if (backendUrl) backendOrigin = new URL(backendUrl).origin;
  } catch {
    // ignore invalid URL
  }

  const connectSrc = isDev
    ? `connect-src 'self' http: https: ws: wss: ${backendOrigin}`.trim()
    : `connect-src 'self' https: ${backendOrigin}`.trim();

  return [
    "default-src 'self'",
    scriptSrc,
    "style-src 'self' 'unsafe-inline' https: data:",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data: https:",
    // Allow websocket connections for HMR in dev and the API/backend origin
    connectSrc,
    "frame-ancestors 'self'",
    "form-action 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    // In production, upgrade any http subresources to https
    ...(isDev ? [] : ["upgrade-insecure-requests"]),
    // Opt-in to powerful isolation without breaking 3rd parties (avoid COEP here)
    // COOP/CORP sent as separate headers below
  ].join("; ");
}

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,
  experimental: {
    optimizeCss: true,
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "picsum.photos" },
    ],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          ...securityHeaders,
          { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
          { key: "Cross-Origin-Resource-Policy", value: "same-origin" },
          { key: "Origin-Agent-Cluster", value: "?1" },
        ],
      },
    ];
  },
};

export default nextConfig;

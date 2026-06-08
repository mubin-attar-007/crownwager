/** @type {import('next').NextConfig} */

// Content-Security-Policy. connect-src allows https: so the browser can reach the API on its own
// origin/domain (set via NEXT_PUBLIC_API_BASE_URL). 'unsafe-inline' is needed for Next/Tailwind.
const csp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: https:",
  "font-src 'self' data:",
  "connect-src 'self' https:",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

const nextConfig = {
  reactStrictMode: true,
  output: "standalone",
  poweredByHeader: false,
  // Same-origin API proxy (used in cookie-auth mode): the browser calls /api/* and Next forwards
  // to the backend, so JWT cookies stay same-origin (SameSite=Lax) and CSRF is handled by SameSite.
  // Set API_PROXY_TARGET to the backend ORIGIN (the Django app serves under /api). Unused by the
  // legacy localStorage flow, which calls NEXT_PUBLIC_API_BASE_URL directly.
  async rewrites() {
    const target = (process.env.API_PROXY_TARGET ?? "http://localhost:8000").replace(/\/+$/, "");
    return [{ source: "/api/:path*", destination: `${target}/api/:path*` }];
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;

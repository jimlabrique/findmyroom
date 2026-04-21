import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

function cspValue() {
  const supabaseUrlRaw = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  let supabaseOrigin = "";
  try {
    supabaseOrigin = supabaseUrlRaw ? new URL(supabaseUrlRaw).origin : "";
  } catch {
    supabaseOrigin = "";
  }

  const connectSrc = [
    "'self'",
    supabaseOrigin,
    "https://accounts.google.com",
    "https://oauth2.googleapis.com",
    "https://www.googleapis.com",
    "https://api.resend.com",
  ]
    .filter(Boolean)
    .join(" ");

  const scriptSrc = [
    "'self'",
    "'unsafe-inline'",
    process.env.NODE_ENV !== "production" ? "'unsafe-eval'" : "",
    "https://accounts.google.com",
    "https://apis.google.com",
  ]
    .filter(Boolean)
    .join(" ");

  const imgSrc = ["'self'", "data:", "blob:", "https:", supabaseOrigin].filter(Boolean).join(" ");

  const shouldUpgradeInsecureRequests = process.env.NODE_ENV === "production" && process.env.VERCEL === "1";

  const directives = [
    "default-src 'self'",
    `script-src ${scriptSrc}`,
    `style-src 'self' 'unsafe-inline'`,
    `img-src ${imgSrc}`,
    "font-src 'self' data:",
    `connect-src ${connectSrc}`,
    "frame-src https://accounts.google.com",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "object-src 'none'",
  ];

  if (shouldUpgradeInsecureRequests) {
    directives.push("upgrade-insecure-requests");
  }

  return directives.join("; ");
}

const nextConfig: NextConfig = {
  async headers() {
    const securityHeaders = [
      { key: "Content-Security-Policy", value: cspValue() },
      { key: "X-Frame-Options", value: "DENY" },
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
      { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=(), accelerometer=()" },
    ];

    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

export default withNextIntl(nextConfig);

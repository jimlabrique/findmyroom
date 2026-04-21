import { NextResponse, type NextRequest } from "next/server";
import { DEFAULT_LOCALE, LOCALE_COOKIE, LOCALE_HEADER, normalizeLocale, isSupportedLocale } from "@/lib/i18n/locales";
import { withLocalePath } from "@/lib/i18n/pathname";

const PUBLIC_FILE = /\.[^/]+$/;
const EXCLUDED_PREFIXES = ["/_next", "/api"];
const EXCLUDED_PATHS = ["/robots.txt", "/sitemap.xml", "/auth/callback"];
const NONCE_HEADER = "x-nonce";

function isExcluded(pathname: string) {
  if (PUBLIC_FILE.test(pathname)) return true;
  if (EXCLUDED_PATHS.includes(pathname)) return true;
  return EXCLUDED_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

function preferredLocale(request: NextRequest) {
  const fromCookie = request.cookies.get(LOCALE_COOKIE)?.value ?? null;
  if (fromCookie) return normalizeLocale(fromCookie);
  const fromAcceptLanguage = request.headers.get("accept-language");
  if (fromAcceptLanguage) return normalizeLocale(fromAcceptLanguage.split(",")[0] ?? DEFAULT_LOCALE);
  return DEFAULT_LOCALE;
}

function supabaseOrigin() {
  const supabaseUrlRaw = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  if (!supabaseUrlRaw) return "";
  try {
    return new URL(supabaseUrlRaw).origin;
  } catch {
    return "";
  }
}

function generateNonce() {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  const binary = String.fromCharCode(...bytes);
  return btoa(binary);
}

function cspValue(nonce: string) {
  const shouldUpgradeInsecureRequests = process.env.NODE_ENV === "production" && process.env.VERCEL === "1";
  const supabase = supabaseOrigin();
  const connectSrc = [
    "'self'",
    supabase,
    "https://accounts.google.com",
    "https://oauth2.googleapis.com",
    "https://www.googleapis.com",
    "https://api.resend.com",
  ]
    .filter(Boolean)
    .join(" ");
  const scriptSrc = [
    "'self'",
    `'nonce-${nonce}'`,
    process.env.NODE_ENV !== "production" ? "'unsafe-eval'" : "",
    "https://accounts.google.com",
    "https://apis.google.com",
  ]
    .filter(Boolean)
    .join(" ");
  const imgSrc = ["'self'", "data:", "blob:", "https:", supabase].filter(Boolean).join(" ");

  const directives = [
    "default-src 'self'",
    `script-src ${scriptSrc}`,
    "style-src 'self' 'unsafe-inline'",
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

function applySecurityHeaders(response: NextResponse, nonce: string) {
  response.headers.set("Content-Security-Policy", cspValue(nonce));
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload");
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=(), payment=(), usb=(), accelerometer=()");
  return response;
}

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const nonce = generateNonce();
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set(NONCE_HEADER, nonce);

  if (isExcluded(pathname)) {
    const response = NextResponse.next({
      request: { headers: requestHeaders },
    });
    return applySecurityHeaders(response, nonce);
  }

  const segments = pathname.split("/").filter(Boolean);
  const firstSegment = segments[0] ?? "";

  if (isSupportedLocale(firstSegment)) {
    const rewrittenPath = `/${segments.slice(1).join("/")}` || "/";
    const rewriteUrl = request.nextUrl.clone();
    rewriteUrl.pathname = rewrittenPath === "/" ? "/" : rewrittenPath.replace(/\/+$/, "");

    requestHeaders.set(LOCALE_HEADER, firstSegment);

    const response = NextResponse.rewrite(rewriteUrl, {
      request: { headers: requestHeaders },
    });
    response.cookies.set(LOCALE_COOKIE, firstSegment, {
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });
    return applySecurityHeaders(response, nonce);
  }

  const locale = preferredLocale(request);
  const redirectUrl = request.nextUrl.clone();
  redirectUrl.pathname = withLocalePath(pathname, locale);
  const response = NextResponse.redirect(redirectUrl);
  return applySecurityHeaders(response, nonce);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};

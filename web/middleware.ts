import { NextResponse, type NextRequest } from "next/server";
import { DEFAULT_LOCALE, LOCALE_COOKIE, LOCALE_HEADER, normalizeLocale, isSupportedLocale } from "@/lib/i18n/locales";
import { withLocalePath } from "@/lib/i18n/pathname";

const PUBLIC_FILE = /\.[^/]+$/;
const EXCLUDED_PREFIXES = ["/_next", "/api"];
const EXCLUDED_PATHS = ["/robots.txt", "/sitemap.xml", "/auth/callback"];

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

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  if (isExcluded(pathname)) {
    return NextResponse.next();
  }

  const segments = pathname.split("/").filter(Boolean);
  const firstSegment = segments[0] ?? "";

  if (isSupportedLocale(firstSegment)) {
    const rewrittenPath = `/${segments.slice(1).join("/")}` || "/";
    const rewriteUrl = request.nextUrl.clone();
    rewriteUrl.pathname = rewrittenPath === "/" ? "/" : rewrittenPath.replace(/\/+$/, "");

    const requestHeaders = new Headers(request.headers);
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
    return response;
  }

  const locale = preferredLocale(request);
  const redirectUrl = request.nextUrl.clone();
  redirectUrl.pathname = withLocalePath(pathname, locale);
  return NextResponse.redirect(redirectUrl);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};

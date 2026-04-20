import { headers } from "next/headers";

function normalizeHost(host: string | null) {
  if (!host) return null;
  return host.trim().toLowerCase();
}

function parseUrl(value: string | null) {
  if (!value) return null;
  try {
    return new URL(value);
  } catch {
    return null;
  }
}

function currentHost(requestHeaders: Headers) {
  return normalizeHost(requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host"));
}

function allowedOriginsSet() {
  const raw = `${process.env.ALLOWED_ORIGINS ?? ""}`.trim();
  if (!raw) return new Set<string>();
  return new Set(
    raw
      .split(",")
      .map((item) => item.trim().toLowerCase())
      .filter(Boolean),
  );
}

export function isTrustedRequestHeaders(requestHeaders: Headers) {
  const host = currentHost(requestHeaders);
  if (!host) return false;

  const allowedOrigins = allowedOriginsSet();
  const origin = parseUrl(requestHeaders.get("origin"));
  if (origin) {
    const originHost = normalizeHost(origin.host);
    if (originHost && (originHost === host || allowedOrigins.has(origin.origin.toLowerCase()))) {
      return true;
    }
    return false;
  }

  const referer = parseUrl(requestHeaders.get("referer"));
  if (referer) {
    const refererHost = normalizeHost(referer.host);
    if (refererHost && (refererHost === host || allowedOrigins.has(referer.origin.toLowerCase()))) {
      return true;
    }
    return false;
  }

  return false;
}

export async function assertTrustedFormRequest() {
  const requestHeaders = await headers();
  if (process.env.NODE_ENV !== "production") {
    const host = currentHost(requestHeaders);
    const isLocal = host?.startsWith("localhost:") || host?.startsWith("127.0.0.1:");
    if (isLocal) return;
  }
  if (!isTrustedRequestHeaders(requestHeaders)) {
    throw new Error("untrusted_origin");
  }
}

export function getRequestIpFromHeaders(requestHeaders: Headers) {
  const forwarded = requestHeaders.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }

  const realIp = requestHeaders.get("x-real-ip")?.trim();
  if (realIp) return realIp;

  return "unknown";
}

"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { env } from "@/lib/env";

function isLocalHostname(hostname: string) {
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname.startsWith("192.168.");
}

function parseOrigin(value: string | null) {
  if (!value) return null;
  try {
    return new URL(value);
  } catch {
    return null;
  }
}

function resolveRequestOrigin(requestHeaders: Headers) {
  const isDev = process.env.NODE_ENV !== "production";

  const refererUrl = parseOrigin(requestHeaders.get("referer"));
  if (refererUrl && isLocalHostname(refererUrl.hostname)) {
    return refererUrl.origin;
  }

  const origin = requestHeaders.get("origin");
  if (origin) {
    const originUrl = parseOrigin(origin);
    if (originUrl) {
      if (isDev && !isLocalHostname(originUrl.hostname)) {
        // In dev, ignore non-local origins to prevent bouncing to prod.
      } else {
        return originUrl.origin;
      }
    }
  }

  const host = requestHeaders.get("host");
  if (host) {
    const hostname = host.split(":")[0] ?? host;
    if (isLocalHostname(hostname)) {
      return `http://${host}`;
    }
    if (!isDev) {
      const forwardedProto = requestHeaders.get("x-forwarded-proto");
      const proto = forwardedProto === "http" || forwardedProto === "https" ? forwardedProto : "https";
      return `${proto}://${host}`;
    }
  }

  if (isDev) {
    return "http://localhost:3000";
  }

  const referer = parseOrigin(requestHeaders.get("referer"));
  if (referer) {
    return referer.origin;
  }

  return env.NEXT_PUBLIC_SITE_URL;
}

export async function signInWithGoogle(formData: FormData) {
  const nextPath = `${formData.get("next") ?? "/"}`;
  const requestHeaders = await headers();
  const origin = resolveRequestOrigin(requestHeaders);
  const redirectTo = `${origin}/auth/callback`;

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo,
      queryParams: {
        access_type: "offline",
        prompt: "consent",
      },
    },
  });

  if (error || !data.url) {
    redirect("/connexion?error=google_oauth_failed");
  }

  // Preserve post-login destination in app-level navigation when needed,
  // but keep OAuth redirectTo strict to avoid provider fallback to production site URL.
  if (!nextPath.startsWith("/")) {
    redirect("/connexion?error=invalid_next");
  }

  redirect(data.url);
}

export async function signOut() {
  const supabase = await createServerSupabaseClient();
  await supabase.auth.signOut();
  redirect("/");
}

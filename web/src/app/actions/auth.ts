"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { env } from "@/lib/env";

function resolveRequestOrigin(requestHeaders: Headers) {
  const origin = requestHeaders.get("origin");
  if (origin) {
    return origin;
  }

  const forwardedProto = requestHeaders.get("x-forwarded-proto");
  const forwardedHost = requestHeaders.get("x-forwarded-host");
  if (forwardedProto && forwardedHost) {
    return `${forwardedProto}://${forwardedHost}`;
  }

  const host = requestHeaders.get("host");
  if (host) {
    const isLocalHost = host.startsWith("localhost") || host.startsWith("127.0.0.1") || host.startsWith("192.168.");
    const protocol = isLocalHost ? "http" : "https";
    return `${protocol}://${host}`;
  }

  const referer = requestHeaders.get("referer");
  if (referer) {
    try {
      return new URL(referer).origin;
    } catch {
      // Ignore invalid referer and fallback below.
    }
  }

  return env.NEXT_PUBLIC_SITE_URL;
}

export async function signInWithGoogle(formData: FormData) {
  const nextPath = `${formData.get("next") ?? "/"}`;
  const safeNextPath = nextPath.startsWith("/") ? nextPath : "/";
  const requestHeaders = await headers();
  const origin = resolveRequestOrigin(requestHeaders);
  const redirectTo = `${origin}/auth/callback?next=${encodeURIComponent(safeNextPath)}`;

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

  redirect(data.url);
}

export async function signOut() {
  const supabase = await createServerSupabaseClient();
  await supabase.auth.signOut();
  redirect("/");
}

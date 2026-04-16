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

function readNextPath(formData: FormData) {
  const nextPath = `${formData.get("next") ?? "/"}`.trim();
  if (!nextPath.startsWith("/")) {
    redirect("/connexion?error=invalid_next");
  }
  return nextPath;
}

function readEmail(formData: FormData) {
  return `${formData.get("email") ?? ""}`.trim().toLowerCase();
}

function readPassword(formData: FormData) {
  return `${formData.get("password") ?? ""}`;
}

function isValidEmailAddress(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isEmailNotConfirmedError(error: { message?: string; code?: string } | null | undefined) {
  if (!error) return false;
  const message = `${error.message ?? ""}`.toLowerCase();
  const code = `${error.code ?? ""}`.toLowerCase();
  return message.includes("email not confirmed") || code === "email_not_confirmed";
}

function isInvalidCredentialsError(error: { message?: string; code?: string } | null | undefined) {
  if (!error) return false;
  const message = `${error.message ?? ""}`.toLowerCase();
  const code = `${error.code ?? ""}`.toLowerCase();
  return (
    message.includes("invalid login credentials") ||
    message.includes("invalid email or password") ||
    code === "invalid_credentials" ||
    code === "invalid_grant"
  );
}

export async function signInWithGoogle(formData: FormData) {
  readNextPath(formData);
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

  redirect(data.url);
}

export async function signUpWithEmailPassword(formData: FormData) {
  readNextPath(formData);
  const email = readEmail(formData);
  const password = readPassword(formData);

  if (!isValidEmailAddress(email)) {
    redirect("/connexion?error=invalid_email");
  }
  if (password.length < 8) {
    redirect("/connexion?error=password_too_short");
  }

  const requestHeaders = await headers();
  const origin = resolveRequestOrigin(requestHeaders);
  const emailRedirectTo = `${origin}/connexion?confirmed=1`;

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo,
    },
  });

  if (error) {
    redirect(`/connexion?error=${encodeURIComponent(error.code || error.message || "signup_failed")}`);
  }

  if (data.session) {
    redirect("/annonces");
  }

  redirect("/connexion?check_email=1");
}

export async function signInWithPassword(formData: FormData) {
  const nextPath = readNextPath(formData);
  const email = readEmail(formData);
  const password = readPassword(formData);

  if (!isValidEmailAddress(email)) {
    redirect("/connexion?error=invalid_email");
  }
  if (!password) {
    redirect("/connexion?error=missing_password");
  }

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (isEmailNotConfirmedError(error)) {
    redirect("/connexion?error=email_not_confirmed");
  }
  if (isInvalidCredentialsError(error)) {
    redirect("/connexion?error=invalid_credentials");
  }
  if (error) {
    redirect(`/connexion?error=${encodeURIComponent(error.code || error.message || "signin_failed")}`);
  }

  redirect(nextPath);
}

export async function signOut() {
  const supabase = await createServerSupabaseClient();
  await supabase.auth.signOut();
  redirect("/");
}

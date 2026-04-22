"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { env } from "@/lib/env";
import { consumeRateLimitByIdentity, consumeRateLimitSlot } from "@/lib/rate-limit";
import { DEFAULT_LOCALE, LOCALE_HEADER, normalizeLocale, type AppLocale } from "@/lib/i18n/locales";
import { withLocalePath } from "@/lib/i18n/pathname";
import { assertTrustedFormRequest, getRequestIpFromHeaders } from "@/lib/security/request";

const SIGNIN_RATE_LIMIT_MS = 20_000;
const SIGNUP_RATE_LIMIT_MS = 30_000;
const GOOGLE_RATE_LIMIT_MS = 20_000;
const APPLE_RATE_LIMIT_MS = 20_000;

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
  if (!nextPath.startsWith("/") || nextPath.startsWith("//")) {
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

function isAlreadyRegisteredError(error: { message?: string; code?: string } | null | undefined) {
  if (!error) return false;
  const message = `${error.message ?? ""}`.toLowerCase();
  const code = `${error.code ?? ""}`.toLowerCase();
  return message.includes("already registered") || code === "user_already_exists" || code === "email_exists";
}

function hasNoIdentitiesUser(signUpData: { user?: { identities?: unknown } | null; session?: unknown } | null | undefined) {
  if (!signUpData?.user || signUpData.session) return false;
  const identities = signUpData.user.identities;
  return Array.isArray(identities) && identities.length === 0;
}

function requestLocale(requestHeaders: Headers): AppLocale {
  return normalizeLocale(requestHeaders.get(LOCALE_HEADER) ?? DEFAULT_LOCALE);
}

function localizePath(path: string, locale: AppLocale) {
  return withLocalePath(path, locale);
}

function redirectConnexionWithError(locale: AppLocale, errorCode: string) {
  const path = localizePath("/connexion", locale);
  redirect(`${path}?error=${encodeURIComponent(errorCode)}`);
}

async function enforceRateLimit({
  prefix,
  email,
  requestHeaders,
  windowMs,
  locale,
}: {
  prefix: string;
  email?: string;
  requestHeaders: Headers;
  windowMs: number;
  locale: AppLocale;
}) {
  const ip = getRequestIpFromHeaders(requestHeaders);
  const ipLimit = await consumeRateLimitSlot({
    key: `${prefix}:ip:${ip}`,
    windowMs,
  });
  if (ipLimit.limited) {
    redirectConnexionWithError(locale, "auth_rate_limited");
  }

  if (email) {
    const emailLimit = await consumeRateLimitByIdentity({
      prefix: `${prefix}:email`,
      identity: email,
      windowMs,
    });
    if (emailLimit.limited) {
      redirectConnexionWithError(locale, "auth_rate_limited");
    }
  }
}

export async function signInWithGoogle(formData: FormData) {
  await assertTrustedFormRequest();
  const nextPath = readNextPath(formData);
  const requestHeaders = await headers();
  const locale = requestLocale(requestHeaders);
  await enforceRateLimit({
    prefix: "auth_google",
    requestHeaders,
    windowMs: GOOGLE_RATE_LIMIT_MS,
    locale,
  });

  const origin = resolveRequestOrigin(requestHeaders);
  const localizedNextPath = localizePath(nextPath, locale);
  const callbackUrl = new URL("/auth/callback", origin);
  callbackUrl.searchParams.set("next", localizedNextPath);

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: callbackUrl.toString(),
      queryParams: {
        access_type: "offline",
        prompt: "consent",
      },
    },
  });

  const oauthUrl = data?.url ?? null;
  if (error || !oauthUrl) {
    redirectConnexionWithError(locale, "google_oauth_failed");
    return;
  }

  redirect(oauthUrl);
}

export async function signInWithApple(formData: FormData) {
  await assertTrustedFormRequest();
  const nextPath = readNextPath(formData);
  const requestHeaders = await headers();
  const locale = requestLocale(requestHeaders);
  await enforceRateLimit({
    prefix: "auth_apple",
    requestHeaders,
    windowMs: APPLE_RATE_LIMIT_MS,
    locale,
  });

  const origin = resolveRequestOrigin(requestHeaders);
  const localizedNextPath = localizePath(nextPath, locale);
  const callbackUrl = new URL("/auth/callback", origin);
  callbackUrl.searchParams.set("next", localizedNextPath);

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "apple",
    options: {
      redirectTo: callbackUrl.toString(),
    },
  });

  const oauthUrl = data?.url ?? null;
  if (error || !oauthUrl) {
    redirectConnexionWithError(locale, "apple_oauth_failed");
    return;
  }

  redirect(oauthUrl);
}

export async function signUpWithEmailPassword(formData: FormData) {
  await assertTrustedFormRequest();
  readNextPath(formData);
  const email = readEmail(formData);
  const password = readPassword(formData);
  const requestHeaders = await headers();
  const locale = requestLocale(requestHeaders);

  if (!isValidEmailAddress(email)) {
    redirectConnexionWithError(locale, "invalid_email");
  }
  if (password.length < 8) {
    redirectConnexionWithError(locale, "password_too_short");
  }

  await enforceRateLimit({
    prefix: "auth_signup",
    email,
    requestHeaders,
    windowMs: SIGNUP_RATE_LIMIT_MS,
    locale,
  });

  const origin = resolveRequestOrigin(requestHeaders);
  const emailRedirectUrl = new URL("/connexion", origin);
  emailRedirectUrl.searchParams.set("confirmed", "1");
  emailRedirectUrl.searchParams.set("locale", locale);
  emailRedirectUrl.searchParams.set("next", localizePath("/annonces", locale));

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: emailRedirectUrl.toString(),
      data: {
        locale,
      },
    },
  });

  if (error) {
    if (isAlreadyRegisteredError(error)) {
      redirectConnexionWithError(locale, "account_already_exists");
    }
    redirectConnexionWithError(locale, error.code || error.message || "signup_failed");
  }

  if (hasNoIdentitiesUser(data)) {
    redirectConnexionWithError(locale, "account_already_exists");
  }

  if (data.session) {
    redirect(localizePath("/annonces", locale));
  }

  redirect(`${localizePath("/connexion", locale)}?check_email=1&mode=signup`);
}

export async function signInWithPassword(formData: FormData) {
  await assertTrustedFormRequest();
  const nextPath = readNextPath(formData);
  const email = readEmail(formData);
  const password = readPassword(formData);
  const requestHeaders = await headers();
  const locale = requestLocale(requestHeaders);

  if (!isValidEmailAddress(email)) {
    redirectConnexionWithError(locale, "invalid_email");
  }
  if (!password) {
    redirectConnexionWithError(locale, "missing_password");
  }

  await enforceRateLimit({
    prefix: "auth_signin",
    email,
    requestHeaders,
    windowMs: SIGNIN_RATE_LIMIT_MS,
    locale,
  });

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (isEmailNotConfirmedError(error)) {
    redirectConnexionWithError(locale, "email_not_confirmed");
  }
  if (isInvalidCredentialsError(error)) {
    redirectConnexionWithError(locale, "invalid_credentials");
  }
  if (error) {
    redirectConnexionWithError(locale, error.code || error.message || "signin_failed");
  }

  const localizedNext = localizePath(nextPath, locale);
  redirect(localizedNext);
}

export async function signOut() {
  const requestHeaders = await headers();
  const locale = requestLocale(requestHeaders);
  const supabase = await createServerSupabaseClient();
  await supabase.auth.signOut();
  redirect(localizePath("/annonces", locale));
}

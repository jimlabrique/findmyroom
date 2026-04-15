"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { env } from "@/lib/env";

export async function signInWithGoogle(formData: FormData) {
  const nextPath = `${formData.get("next") ?? "/"}`;
  const safeNextPath = nextPath.startsWith("/") ? nextPath : "/";
  const requestHeaders = await headers();
  const origin = requestHeaders.get("origin") ?? env.NEXT_PUBLIC_SITE_URL;
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

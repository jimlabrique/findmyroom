"use server";

import { createClient } from "@supabase/supabase-js";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import type { Database } from "@/lib/database.types";
import { env } from "@/lib/env";
import { DEFAULT_LOCALE, LOCALE_HEADER, normalizeLocale } from "@/lib/i18n/locales";
import { withLocalePath } from "@/lib/i18n/pathname";
import { assertTrustedFormRequest } from "@/lib/security/request";
import { deleteListingPhotoUrls } from "@/app/mes-annonces/actions/shared";

export async function deleteAccountAction() {
  await assertTrustedFormRequest();
  const requestHeaders = await headers();
  const locale = normalizeLocale(requestHeaders.get(LOCALE_HEADER) ?? DEFAULT_LOCALE);
  const myListingsPath = withLocalePath("/mes-annonces", locale);
  const connexionPath = withLocalePath("/connexion", locale);

  const { supabase, user } = await requireUser(myListingsPath);

  const { data: listings, error: listingsError } = await supabase
    .from("listings")
    .select("photo_urls")
    .eq("user_id", user.id);

  if (listingsError) {
    redirect(`${myListingsPath}?error=${encodeURIComponent(listingsError.message)}`);
  }

  const allPhotoUrls = (listings ?? []).flatMap((listing) =>
    Array.isArray(listing.photo_urls)
      ? listing.photo_urls.filter((url): url is string => typeof url === "string" && url.trim().length > 0)
      : [],
  );

  if (allPhotoUrls.length) {
    try {
      await deleteListingPhotoUrls({
        supabase,
        userId: user.id,
        urls: allPhotoUrls,
      });
    } catch {
      // Continue: account deletion should not fail due to storage cleanup.
    }
  }

  // Preferred path: self-delete through SECURITY DEFINER RPC (works without service role in app env).
  const rpcResult = await supabase.rpc("delete_current_user_account" as never);
  if (!rpcResult.error) {
    try {
      await supabase.auth.signOut();
    } catch {
      // Ignore sign-out failure after account deletion.
    }
    redirect(`${connexionPath}?account_deleted=1`);
  }

  const rpcMessage = `${rpcResult.error?.message ?? ""}`;
  const rpcFunctionMissing =
    /function .*delete_current_user_account/i.test(rpcMessage) ||
    /could not find the function/i.test(rpcMessage) ||
    /does not exist/i.test(rpcMessage);

  const serviceRoleKey = `${process.env.SUPABASE_SERVICE_ROLE_KEY ?? ""}`.trim();
  if (!serviceRoleKey) {
    if (rpcFunctionMissing) {
      redirect(`${myListingsPath}?error=account_delete_rpc_missing`);
    }
    redirect(`${myListingsPath}?error=account_delete_not_configured`);
  }

  const adminSupabase = createClient<Database>(env.NEXT_PUBLIC_SUPABASE_URL, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  const { error: deleteUserError } = await adminSupabase.auth.admin.deleteUser(user.id);
  if (deleteUserError) {
    redirect(`${myListingsPath}?error=${encodeURIComponent(deleteUserError.message)}`);
  }

  try {
    await supabase.auth.signOut();
  } catch {
    // Ignore sign-out failure after account deletion.
  }

  redirect(`${connexionPath}?account_deleted=1`);
}

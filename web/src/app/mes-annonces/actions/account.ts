"use server";

import { createClient } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import type { Database } from "@/lib/database.types";
import { env } from "@/lib/env";
import { assertTrustedFormRequest } from "@/lib/security/request";
import { deleteListingPhotoUrls } from "@/app/mes-annonces/actions/shared";

export async function deleteAccountAction() {
  await assertTrustedFormRequest();
  const { supabase, user } = await requireUser("/mes-annonces");

  const { data: listings, error: listingsError } = await supabase
    .from("listings")
    .select("photo_urls")
    .eq("user_id", user.id);

  if (listingsError) {
    redirect(`/mes-annonces?error=${encodeURIComponent(listingsError.message)}`);
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

  const serviceRoleKey = `${process.env.SUPABASE_SERVICE_ROLE_KEY ?? ""}`.trim();
  if (!serviceRoleKey) {
    redirect("/mes-annonces?error=account_delete_not_configured");
  }

  const adminSupabase = createClient<Database>(env.NEXT_PUBLIC_SUPABASE_URL, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  const { error: deleteUserError } = await adminSupabase.auth.admin.deleteUser(user.id);
  if (deleteUserError) {
    redirect(`/mes-annonces?error=${encodeURIComponent(deleteUserError.message)}`);
  }

  try {
    await supabase.auth.signOut();
  } catch {
    // Ignore sign-out failure after account deletion.
  }

  redirect("/connexion?account_deleted=1");
}

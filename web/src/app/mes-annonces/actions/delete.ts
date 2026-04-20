"use server";

import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { assertTrustedFormRequest } from "@/lib/security/request";
import { deleteListingPhotoUrls } from "@/app/mes-annonces/actions/shared";
import { getRequestLocale } from "@/lib/i18n/request-locale";
import { withLocalePath } from "@/lib/i18n/pathname";

export async function deleteListingAction(formData: FormData) {
  await assertTrustedFormRequest();
  const locale = await getRequestLocale();
  const myListingsPath = withLocalePath("/mes-annonces", locale);
  const listingId = `${formData.get("listing_id") ?? ""}`.trim();
  if (!listingId) {
    redirect(`${myListingsPath}?error=missing_listing_id`);
  }

  const { supabase, user } = await requireUser(myListingsPath);
  const { data: listing, error: listingError } = await supabase
    .from("listings")
    .select("photo_urls")
    .eq("id", listingId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (listingError) {
    redirect(`${myListingsPath}?error=${encodeURIComponent(listingError.message)}`);
  }

  if (!listing) {
    redirect(`${myListingsPath}?error=listing_not_found`);
  }

  const photoUrls = Array.isArray(listing.photo_urls)
    ? listing.photo_urls.filter((url): url is string => typeof url === "string" && url.trim().length > 0)
    : [];

  const { error: deleteError } = await supabase.from("listings").delete().eq("id", listingId).eq("user_id", user.id);
  if (deleteError) {
    redirect(`${myListingsPath}?error=${encodeURIComponent(deleteError.message)}`);
  }

  if (photoUrls.length) {
    try {
      await deleteListingPhotoUrls({
        supabase,
        userId: user.id,
        urls: photoUrls,
      });
    } catch {
      // Listing stays deleted even if storage cleanup fails.
    }
  }

  redirect(`${myListingsPath}?deleted=1`);
}

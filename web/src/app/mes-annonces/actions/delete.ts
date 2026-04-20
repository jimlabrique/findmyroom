"use server";

import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { assertTrustedFormRequest } from "@/lib/security/request";
import { deleteListingPhotoUrls } from "@/app/mes-annonces/actions/shared";

export async function deleteListingAction(formData: FormData) {
  await assertTrustedFormRequest();
  const listingId = `${formData.get("listing_id") ?? ""}`.trim();
  if (!listingId) {
    redirect("/mes-annonces?error=missing_listing_id");
  }

  const { supabase, user } = await requireUser("/mes-annonces");
  const { data: listing, error: listingError } = await supabase
    .from("listings")
    .select("photo_urls")
    .eq("id", listingId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (listingError) {
    redirect(`/mes-annonces?error=${encodeURIComponent(listingError.message)}`);
  }

  if (!listing) {
    redirect("/mes-annonces?error=listing_not_found");
  }

  const photoUrls = Array.isArray(listing.photo_urls)
    ? listing.photo_urls.filter((url): url is string => typeof url === "string" && url.trim().length > 0)
    : [];

  const { error: deleteError } = await supabase.from("listings").delete().eq("id", listingId).eq("user_id", user.id);
  if (deleteError) {
    redirect(`/mes-annonces?error=${encodeURIComponent(deleteError.message)}`);
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

  redirect("/mes-annonces?deleted=1");
}

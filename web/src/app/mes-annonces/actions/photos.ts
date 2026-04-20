"use server";

import { requireUser } from "@/lib/auth";
import { assertTrustedFormRequest } from "@/lib/security/request";
import {
  deleteListingPhotoUrls,
  isMissingPhotoCaptionsColumn,
  loadListingPhotosForOwner,
  normalizePhotoUrlForMatch,
} from "@/app/mes-annonces/actions/shared";

export async function deleteListingPhotoAction(formData: FormData) {
  await assertTrustedFormRequest();
  const listingId = `${formData.get("listing_id") ?? ""}`.trim();
  const targetPhotoUrl = `${formData.get("delete_photo_url") ?? ""}`.trim();

  if (!listingId || !targetPhotoUrl) {
    return { ok: false as const, error: "invalid_delete_photo_request" };
  }

  const { supabase, user } = await requireUser(`/mes-annonces/${listingId}/editer`);
  const listing = await loadListingPhotosForOwner({
    supabase,
    listingId,
    userId: user.id,
  });
  if (listing.error) {
    return { ok: false as const, error: listing.error };
  }

  const currentPhotoUrls = listing.photoUrls;
  const currentPhotoCaptions = listing.photoCaptions;

  const normalizedTarget = normalizePhotoUrlForMatch(targetPhotoUrl);
  const photoPairs = currentPhotoUrls.map((url, index) => ({
    url,
    caption: currentPhotoCaptions[index] ?? "",
  }));
  const nextPhotoPairs = photoPairs.filter((photo) => normalizePhotoUrlForMatch(photo.url) !== normalizedTarget);
  if (nextPhotoPairs.length === photoPairs.length) {
    return { ok: true as const };
  }

  const nextPhotoUrls = nextPhotoPairs.map((photo) => photo.url);
  const nextPhotoCaptions = nextPhotoPairs.map((photo) => photo.caption);

  const { error: updateError } = await supabase
    .from("listings")
    .update({
      photo_urls: nextPhotoUrls,
      photo_captions: nextPhotoCaptions,
    })
    .eq("id", listingId)
    .eq("user_id", user.id);

  if (updateError && isMissingPhotoCaptionsColumn(updateError.message)) {
    return { ok: false as const, error: "schema_missing_photo_captions" };
  }

  if (updateError) {
    return { ok: false as const, error: updateError.message };
  }

  try {
    await deleteListingPhotoUrls({
      supabase,
      userId: user.id,
      urls: [targetPhotoUrl],
    });
  } catch {
    // Storage cleanup failure should not block listing update.
  }

  return { ok: true as const };
}

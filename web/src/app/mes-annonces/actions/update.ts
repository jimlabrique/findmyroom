"use server";

import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { assertTrustedFormRequest } from "@/lib/security/request";
import { deleteListingPhotoUrls, isMissingPhotoCaptionsColumn, isMissingStructuredListingColumns } from "@/app/mes-annonces/actions/shared";
import { buildListingUpdatePayload } from "@/app/mes-annonces/actions/shared";
import { getRequestLocale } from "@/lib/i18n/request-locale";
import { withLocalePath } from "@/lib/i18n/pathname";

export async function updateListingAction(formData: FormData) {
  await assertTrustedFormRequest();
  const locale = await getRequestLocale();
  const myListingsPath = withLocalePath("/mes-annonces", locale);
  const listingId = `${formData.get("listing_id") ?? ""}`.trim();
  const editListingPath = withLocalePath(`/mes-annonces/${listingId}/editer`, locale);
  if (!listingId) {
    redirect(`${myListingsPath}?error=missing_listing_id`);
  }

  const { supabase, user } = await requireUser(editListingPath);

  try {
    const payload = await buildListingUpdatePayload({
      formData,
      listingId,
      userId: user.id,
      email: user.email ?? null,
      supabase,
    });

    const { error } = await supabase
      .from("listings")
      .update(payload.updatePayload)
      .eq("id", payload.listingId)
      .eq("user_id", user.id);

    if (error && isMissingPhotoCaptionsColumn(error.message)) {
      redirect(`${editListingPath}?error=schema_missing_photo_captions`);
    }
    if (error && isMissingStructuredListingColumns(error.message)) {
      redirect(`${editListingPath}?error=schema_missing_listing_fields`);
    }
    if (error) {
      redirect(`${editListingPath}?error=${encodeURIComponent(error.message)}`);
    }

    if (payload.removedPhotoUrls.length) {
      try {
        await deleteListingPhotoUrls({
          supabase,
          userId: user.id,
          urls: payload.removedPhotoUrls,
        });
      } catch {
        // Listing stays updated even if storage cleanup fails.
      }
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown_error";
    redirect(`${editListingPath}?error=${encodeURIComponent(message)}`);
  }

  redirect(`${myListingsPath}?updated=1`);
}

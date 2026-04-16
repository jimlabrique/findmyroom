"use server";

import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import {
  cleanOptionalText,
  type ListingPhoto,
  normalizeWhatsapp,
  parseOptionalInt,
  parseRequiredInt,
} from "@/lib/listing";
import {
  deleteListingPhotoUrls,
  extractExistingListingPhotos,
  extractNewListingPhotoDrafts,
  splitPhotosForStorage,
  uploadListingPhotoFiles,
} from "@/lib/storage/listing-photos";

const allowedStatuses = new Set(["active", "paused", "archived"]);

function isMissingPhotoCaptionsColumn(message: string) {
  return /photo_captions/i.test(message) && /column/i.test(message);
}

function isMissingExpiresAtColumn(message: string) {
  return /expires_at/i.test(message) && /column/i.test(message);
}

function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

function plusDaysIsoDate(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

function normalizePhotoUrlForMatch(url: string) {
  return url.trim().replace(/\/+$/, "");
}

function alignCaptionsToUrls(urls: string[], captions: string[]) {
  return urls.map((_, index) => captions[index] ?? "");
}

function readContactMethodSelection(formData: FormData) {
  const rawSelectedMethods = formData
    .getAll("contact_methods")
    .map((value) => `${value}`.trim())
    .filter(Boolean);

  const rawPhone = normalizeWhatsapp(formData.get("contact_whatsapp"));
  const rawEmail = cleanOptionalText(formData.get("contact_email"));
  let hasPhone = rawSelectedMethods.includes("phone");
  let hasEmail = rawSelectedMethods.includes("email");

  // Backward compatibility if old forms submit without contact_methods.
  if (!hasPhone && !hasEmail) {
    hasPhone = Boolean(rawPhone);
    hasEmail = Boolean(rawEmail);
  }

  return {
    hasPhone,
    hasEmail,
    phoneValue: hasPhone ? rawPhone : null,
    emailValue: hasEmail ? rawEmail : null,
  };
}

async function loadListingPhotosForOwner({
  supabase,
  listingId,
  userId,
}: {
  supabase: Awaited<ReturnType<typeof requireUser>>["supabase"];
  listingId: string;
  userId: string;
}) {
  const withCaptions = await supabase
    .from("listings")
    .select("photo_urls, photo_captions")
    .eq("id", listingId)
    .eq("user_id", userId)
    .single();

  if (!withCaptions.error && withCaptions.data) {
    const photoUrls = Array.isArray(withCaptions.data.photo_urls) ? withCaptions.data.photo_urls : [];
    const rawCaptions = Array.isArray(withCaptions.data.photo_captions) ? withCaptions.data.photo_captions : [];
    return {
      photoUrls,
      photoCaptions: alignCaptionsToUrls(photoUrls, rawCaptions),
      hasPhotoCaptionsColumn: true,
      error: null as string | null,
    };
  }

  if (withCaptions.error && !isMissingPhotoCaptionsColumn(withCaptions.error.message)) {
    return {
      photoUrls: [] as string[],
      photoCaptions: [] as string[],
      hasPhotoCaptionsColumn: false,
      error: withCaptions.error.message,
    };
  }

  const withoutCaptions = await supabase
    .from("listings")
    .select("photo_urls")
    .eq("id", listingId)
    .eq("user_id", userId)
    .single();

  if (withoutCaptions.error || !withoutCaptions.data) {
    return {
      photoUrls: [] as string[],
      photoCaptions: [] as string[],
      hasPhotoCaptionsColumn: false,
      error: withoutCaptions.error?.message ?? "listing_not_found",
    };
  }

  const photoUrls = Array.isArray(withoutCaptions.data.photo_urls) ? withoutCaptions.data.photo_urls : [];
  return {
    photoUrls,
    photoCaptions: alignCaptionsToUrls(photoUrls, []),
    hasPhotoCaptionsColumn: false,
    error: null as string | null,
  };
}

export async function updateListingStatusAction(formData: FormData) {
  const listingId = `${formData.get("listing_id") ?? ""}`.trim();
  const status = `${formData.get("status") ?? ""}`.trim();

  if (!listingId || !allowedStatuses.has(status)) {
    redirect("/mes-annonces?error=invalid_status_request");
  }

  const { supabase, user } = await requireUser("/mes-annonces");
  const statusValue = status as "active" | "paused" | "archived";

  const updatePayload: { status: "active" | "paused" | "archived"; expires_at?: string } = {
    status: statusValue,
  };

  if (statusValue === "active") {
    const { data: listingData, error: listingError } = await supabase
      .from("listings")
      .select("expires_at")
      .eq("id", listingId)
      .eq("user_id", user.id)
      .single();

    if (listingError && !isMissingExpiresAtColumn(listingError.message)) {
      redirect(`/mes-annonces?error=${encodeURIComponent(listingError.message)}`);
    }

    if (!listingError && listingData && listingData.expires_at < todayIsoDate()) {
      updatePayload.expires_at = plusDaysIsoDate(30);
    }
  }

  let { error } = await supabase
    .from("listings")
    .update(updatePayload)
    .eq("id", listingId)
    .eq("user_id", user.id);

  if (error && isMissingExpiresAtColumn(error.message)) {
    const retry = await supabase
      .from("listings")
      .update({ status: statusValue })
      .eq("id", listingId)
      .eq("user_id", user.id);
    error = retry.error;
  }

  if (error) {
    redirect(`/mes-annonces?error=${encodeURIComponent(error.message)}`);
  }

  redirect("/mes-annonces?updated=1");
}

export async function deleteListingAction(formData: FormData) {
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

export async function updateListingAction(formData: FormData) {
  const listingId = `${formData.get("listing_id") ?? ""}`.trim();
  if (!listingId) {
    redirect("/mes-annonces?error=missing_listing_id");
  }

  const { supabase, user } = await requireUser(`/mes-annonces/${listingId}/editer`);
  const title = `${formData.get("title") ?? ""}`.trim();
  const city = `${formData.get("city") ?? ""}`.trim();
  const availableFrom = `${formData.get("available_from") ?? ""}`.trim();
  const housingDescription = `${formData.get("housing_description") ?? ""}`.trim();
  const flatshareVibe = `${formData.get("flatshare_vibe") ?? ""}`.trim();

  if (!title || !city || !availableFrom || !housingDescription || !flatshareVibe) {
    redirect(`/mes-annonces/${listingId}/editer?error=missing_required_fields`);
  }

  const rent = parseRequiredInt(formData.get("rent_eur"), "rent_eur");
  const availableRooms = parseRequiredInt(formData.get("available_rooms"), "available_rooms");
  const charges = parseOptionalInt(formData.get("charges_eur"));
  const minDurationMonths = parseOptionalInt(formData.get("min_duration_months"));
  const leaseType = cleanOptionalText(formData.get("lease_type"));
  const contactSelection = readContactMethodSelection(formData);
  const contactPhone = contactSelection.phoneValue;
  const contactEmail = contactSelection.emailValue;
  const currentListing = await loadListingPhotosForOwner({
    supabase,
    listingId,
    userId: user.id,
  });
  if (currentListing.error) {
    redirect(`/mes-annonces/${listingId}/editer?error=${encodeURIComponent(currentListing.error)}`);
  }
  if (!currentListing.hasPhotoCaptionsColumn) {
    redirect(`/mes-annonces/${listingId}/editer?error=schema_missing_photo_captions`);
  }

  let allPhotos: ListingPhoto[] = [];
  try {
    const parsedExistingPhotos = extractExistingListingPhotos(formData);
    const currentPhotoUrls = currentListing.photoUrls;
    const currentPhotoCaptions = currentListing.photoCaptions;

    allPhotos = parsedExistingPhotos.length
      ? parsedExistingPhotos
      : currentPhotoUrls.map((url, index) => ({
          url,
          caption: currentPhotoCaptions[index] ?? "",
        }));

    const newPhotoDrafts = extractNewListingPhotoDrafts(formData);
    if (newPhotoDrafts.length) {
      const uploadedPhotos = await uploadListingPhotoFiles({
        supabase,
        userId: user.id,
        drafts: newPhotoDrafts,
      });
      allPhotos = [...allPhotos, ...uploadedPhotos];
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "photo_upload_failed";
    redirect(`/mes-annonces/${listingId}/editer?error=${encodeURIComponent(message)}`);
  }

  if (!contactSelection.hasPhone && !contactSelection.hasEmail) {
    redirect(`/mes-annonces/${listingId}/editer?error=contact_method_required`);
  }

  if (contactSelection.hasPhone && !contactPhone) {
    redirect(`/mes-annonces/${listingId}/editer?error=contact_phone_required`);
  }

  if (contactSelection.hasEmail && !contactEmail) {
    redirect(`/mes-annonces/${listingId}/editer?error=contact_email_required`);
  }

  if (!allPhotos.length) {
    redirect(`/mes-annonces/${listingId}/editer?error=photo_required`);
  }

  const { urls: photoUrls, captions: photoCaptions } = splitPhotosForStorage(allPhotos);
  const previousPhotoUrls = currentListing.photoUrls;
  const removedPhotoUrls = previousPhotoUrls.filter((url) => !photoUrls.includes(url));

  const baseUpdatePayload = {
    title,
    city,
    rent_eur: rent,
    available_rooms: availableRooms,
    available_from: availableFrom,
    housing_description: housingDescription,
    flatshare_vibe: flatshareVibe,
    photo_urls: photoUrls,
    contact_whatsapp: contactPhone,
    contact_email: contactEmail,
    charges_eur: charges,
    lease_type: leaseType,
    min_duration_months: minDurationMonths,
  };

  const { error } = await supabase
    .from("listings")
    .update({
      ...baseUpdatePayload,
      photo_captions: photoCaptions,
    })
    .eq("id", listingId)
    .eq("user_id", user.id);

  if (error && isMissingPhotoCaptionsColumn(error.message)) {
    redirect(`/mes-annonces/${listingId}/editer?error=schema_missing_photo_captions`);
  }

  if (error) {
    redirect(`/mes-annonces/${listingId}/editer?error=${encodeURIComponent(error.message)}`);
  }

  if (removedPhotoUrls.length) {
    try {
      await deleteListingPhotoUrls({
        supabase,
        userId: user.id,
        urls: removedPhotoUrls,
      });
    } catch {
      // Listing stays updated even if storage cleanup fails.
    }
  }

  redirect("/mes-annonces?updated=1");
}

export async function deleteListingPhotoAction(formData: FormData) {
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

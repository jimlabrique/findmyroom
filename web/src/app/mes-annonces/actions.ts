"use server";

import { createClient } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import type { Database } from "@/lib/database.types";
import { env } from "@/lib/env";
import {
  type AnimalsPolicy,
  cleanOptionalText,
  type ListingRoomDetail,
  type ListingPhoto,
  normalizeWhatsapp,
  parseOptionalInt,
} from "@/lib/listing";
import {
  buildAutoListingTitle,
  buildStructuredFlatshareVibe,
  buildStructuredHousingDescription,
  sanitizeOptionValues,
} from "@/lib/listing-composer";
import {
  ANIMALS_POLICY_OPTIONS,
  AREA_CONTEXT_OPTIONS,
  CANDIDATE_GENDER_PREFERENCE_OPTIONS,
  COMMON_SPACES_COLOCATION_OPTIONS,
  COMMON_SPACES_STUDIO_OPTIONS,
  CURRENT_FLATMATES_OPTIONS,
  isOtherNeighborhoodValue,
  LISTING_TYPE_OPTIONS,
  OTHER_NEIGHBORHOOD_VALUE,
  ROOM_BATHROOM_OPTIONS,
  ROOM_FURNISHING_OPTIONS,
  ROOM_OUTDOOR_OPTIONS,
  ROOM_VIEW_OPTIONS,
  TRANSPORT_MODE_OPTIONS,
  VIBE_TAG_OPTIONS,
} from "@/lib/listing-form-options";
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

function isMissingStructuredListingColumns(message: string) {
  const lower = message.toLowerCase();
  return (
    (lower.includes("total_rooms") && lower.includes("column")) ||
    (lower.includes("room_details") && lower.includes("column")) ||
    (lower.includes("animals_policy") && lower.includes("column")) ||
    (lower.includes("current_flatmates") && lower.includes("column")) ||
    (lower.includes("lgbtq_friendly") && lower.includes("column")) ||
    (lower.includes("listing_type") && lower.includes("column"))
  );
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

function parsePositiveIntArray(formData: FormData, key: string, expectedSize: number, errorCode: string) {
  const rawValues = formData
    .getAll(key)
    .map((value) => `${value ?? ""}`.trim())
    .filter((value) => value.length > 0);

  if (rawValues.length !== expectedSize) {
    throw new Error(errorCode);
  }

  const parsed = rawValues.map((value) => Number.parseInt(value, 10));
  if (parsed.some((value) => !Number.isFinite(value) || value <= 0)) {
    throw new Error(errorCode);
  }

  return parsed;
}

function parseEnumArray(
  formData: FormData,
  key: string,
  expectedSize: number,
  allowedValues: Set<string>,
  errorCode: string,
) {
  const rawValues = formData
    .getAll(key)
    .map((value) => `${value ?? ""}`.trim())
    .filter((value) => value.length > 0);

  if (rawValues.length !== expectedSize) {
    throw new Error(errorCode);
  }

  if (rawValues.some((value) => !allowedValues.has(value))) {
    throw new Error(errorCode);
  }

  return rawValues;
}

function parseOptionalEnumValue<T extends string>(rawValue: string, allowedValues: readonly T[]) {
  return allowedValues.includes(rawValue as T) ? (rawValue as T) : null;
}

function parseRoomDetails(formData: FormData, availableRooms: number): ListingRoomDetail[] {
  const sizes = parsePositiveIntArray(formData, "room_size_sqm", availableRooms, "room_details_invalid");
  const prices = parsePositiveIntArray(formData, "room_price_eur", availableRooms, "room_details_invalid");
  const furnishing = parseEnumArray(
    formData,
    "room_furnishing",
    availableRooms,
    new Set(ROOM_FURNISHING_OPTIONS.map((option) => option.value)),
    "room_details_invalid",
  );
  const bathrooms = parseEnumArray(
    formData,
    "room_bathroom",
    availableRooms,
    new Set(ROOM_BATHROOM_OPTIONS.map((option) => option.value)),
    "room_details_invalid",
  );
  const outdoors = parseEnumArray(
    formData,
    "room_outdoor",
    availableRooms,
    new Set(ROOM_OUTDOOR_OPTIONS.map((option) => option.value)),
    "room_details_invalid",
  );
  const views = parseEnumArray(
    formData,
    "room_view",
    availableRooms,
    new Set(ROOM_VIEW_OPTIONS.map((option) => option.value)),
    "room_details_invalid",
  );

  return Array.from({ length: availableRooms }, (_, index) => ({
    index: index + 1,
    size_sqm: sizes[index],
    price_eur: prices[index],
    furnishing: furnishing[index] as ListingRoomDetail["furnishing"],
    bathroom: bathrooms[index] as ListingRoomDetail["bathroom"],
    outdoor: outdoors[index] as ListingRoomDetail["outdoor"],
    view: views[index] as ListingRoomDetail["view"],
  }));
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

export async function deleteAccountAction() {
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

export async function updateListingAction(formData: FormData) {
  const listingId = `${formData.get("listing_id") ?? ""}`.trim();
  if (!listingId) {
    redirect("/mes-annonces?error=missing_listing_id");
  }

  const { supabase, user } = await requireUser(`/mes-annonces/${listingId}/editer`);
  const listingTypeRaw = `${formData.get("listing_type") ?? ""}`.trim();
  const listingType = parseOptionalEnumValue(
    listingTypeRaw,
    LISTING_TYPE_OPTIONS.map((option) => option.value),
  );
  const city = `${formData.get("city") ?? ""}`.trim();
  const neighborhoodSelection = `${formData.get("neighborhood") ?? ""}`.trim();
  const neighborhoodCustom = `${formData.get("neighborhood_custom") ?? ""}`.trim();
  const isOtherNeighborhood = isOtherNeighborhoodValue(neighborhoodSelection);
  const neighborhood = isOtherNeighborhood ? neighborhoodCustom : neighborhoodSelection;
  const availableFrom = `${formData.get("available_from") ?? ""}`.trim();
  const availableRoomsRaw = Number.parseInt(`${formData.get("available_rooms") ?? ""}`.trim(), 10);
  const totalRoomsRaw = Number.parseInt(`${formData.get("total_rooms") ?? ""}`.trim(), 10);
  const isStudio = listingType === "studio";
  const availableRooms = isStudio ? 1 : availableRoomsRaw;
  const totalRooms = isStudio ? 1 : totalRoomsRaw;

  if (!listingType) {
    redirect(`/mes-annonces/${listingId}/editer?error=listing_type_required`);
  }
  if (
    !Number.isFinite(availableRooms) ||
    availableRooms <= 0 ||
    !Number.isFinite(totalRooms) ||
    totalRooms <= 0 ||
    totalRooms < availableRooms
  ) {
    redirect(`/mes-annonces/${listingId}/editer?error=total_rooms_invalid`);
  }
  if (
    isOtherNeighborhood &&
    (!neighborhoodCustom || isOtherNeighborhoodValue(neighborhoodCustom) || neighborhoodCustom === OTHER_NEIGHBORHOOD_VALUE)
  ) {
    redirect(`/mes-annonces/${listingId}/editer?error=neighborhood_custom_required`);
  }

  let roomDetails: ListingRoomDetail[] = [];
  try {
    roomDetails = parseRoomDetails(formData, availableRooms);
  } catch (error) {
    const message = error instanceof Error ? error.message : "room_details_invalid";
    redirect(`/mes-annonces/${listingId}/editer?error=${encodeURIComponent(message)}`);
  }

  const currentFlatmatesRaw = cleanOptionalText(formData.get("current_flatmates"));
  const currentFlatmates = currentFlatmatesRaw
    ? parseOptionalEnumValue(
        currentFlatmatesRaw,
        CURRENT_FLATMATES_OPTIONS.map((option) => option.value),
      )
    : null;
  const animalsPolicyRaw = `${formData.get("animals_policy") ?? ""}`.trim();
  const animalsPolicy = (parseOptionalEnumValue(
    animalsPolicyRaw,
    ANIMALS_POLICY_OPTIONS.map((option) => option.value),
  ) ?? "negotiable") as AnimalsPolicy;
  const candidateGenderPreferenceRaw = cleanOptionalText(formData.get("candidate_gender_preference"));
  const candidateGenderPreference = candidateGenderPreferenceRaw
    ? parseOptionalEnumValue(
        candidateGenderPreferenceRaw,
        CANDIDATE_GENDER_PREFERENCE_OPTIONS.map((option) => option.value),
      )
    : null;

  const selectedTransportModes = sanitizeOptionValues(
    formData.getAll("transport_modes").map((value) => `${value ?? ""}`),
    TRANSPORT_MODE_OPTIONS.map((option) => option.value),
  );
  const selectedAreaContexts = sanitizeOptionValues(
    formData.getAll("area_contexts").map((value) => `${value ?? ""}`),
    AREA_CONTEXT_OPTIONS.map((option) => option.value),
  );
  const selectedCommonSpaces = sanitizeOptionValues(
    formData.getAll("common_spaces").map((value) => `${value ?? ""}`),
    (isStudio ? COMMON_SPACES_STUDIO_OPTIONS : COMMON_SPACES_COLOCATION_OPTIONS).map((option) => option.value),
  );
  const selectedVibeTags = sanitizeOptionValues(
    formData.getAll("vibe_tags").map((value) => `${value ?? ""}`),
    VIBE_TAG_OPTIONS.map((option) => option.value),
  );
  const transportLines = cleanOptionalText(formData.get("transport_lines"));
  const commonSpacesOther = cleanOptionalText(formData.get("common_spaces_other"));
  const housingDescriptionExtra = cleanOptionalText(formData.get("housing_description_extra"));
  const flatshareVibeOther = cleanOptionalText(formData.get("flatshare_vibe_other"));
  const title = buildAutoListingTitle({
    listingType: isStudio ? "studio" : "colocation",
    commune: city,
    roomCount: availableRooms,
    roomSizesSqm: roomDetails.map((room) => room.size_sqm),
    neighborhood,
  });
  const housingDescription = buildStructuredHousingDescription({
    listingType: isStudio ? "studio" : "colocation",
    neighborhood,
    roomDetails,
    transportModes: selectedTransportModes,
    transportLines,
    areaContexts: selectedAreaContexts,
    commonSpaces: selectedCommonSpaces,
    commonSpacesOther,
    extraDetails: housingDescriptionExtra,
  });
  const flatshareVibe = isStudio
    ? ["Type: Studio", flatshareVibeOther ? `Autre: ${flatshareVibeOther}` : ""].filter(Boolean).join("\n")
    : buildStructuredFlatshareVibe({
        vibeTags: selectedVibeTags,
        vibeOther: flatshareVibeOther,
        currentFlatmates,
        candidateGenderPreference,
        animalsPolicy,
      });

  if (!city || !neighborhood || !availableFrom || !title || !housingDescription || !flatshareVibe) {
    redirect(`/mes-annonces/${listingId}/editer?error=missing_required_fields`);
  }

  if (!isStudio && !flatshareVibe) {
    redirect(`/mes-annonces/${listingId}/editer?error=vibe_required`);
  }

  const charges = parseOptionalInt(formData.get("charges_eur"));
  const minDurationMonths = parseOptionalInt(formData.get("min_duration_months"));
  const leaseType = cleanOptionalText(formData.get("lease_type"));
  const rawWhatsapp = `${formData.get("contact_whatsapp") ?? ""}`.trim();
  const contactPhone = normalizeWhatsapp(rawWhatsapp);
  const contactEmail = cleanOptionalText(user.email ?? null);
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

  if (rawWhatsapp && !contactPhone) {
    redirect(`/mes-annonces/${listingId}/editer?error=contact_phone_required`);
  }

  if (!contactEmail) {
    redirect(`/mes-annonces/${listingId}/editer?error=account_email_required`);
  }

  if (!allPhotos.length) {
    redirect(`/mes-annonces/${listingId}/editer?error=photo_required`);
  }

  const { urls: photoUrls, captions: photoCaptions } = splitPhotosForStorage(allPhotos);
  const previousPhotoUrls = currentListing.photoUrls;
  const removedPhotoUrls = previousPhotoUrls.filter((url) => !photoUrls.includes(url));

  const baseUpdatePayload = {
    title,
    listing_type: listingType,
    rent_eur: Math.min(...roomDetails.map((room) => room.price_eur)),
    city,
    available_rooms: availableRooms,
    total_rooms: totalRooms,
    room_details: roomDetails,
    animals_policy: animalsPolicy,
    current_flatmates: currentFlatmates,
    lgbtq_friendly: true,
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
  if (error && isMissingStructuredListingColumns(error.message)) {
    redirect(`/mes-annonces/${listingId}/editer?error=schema_missing_listing_fields`);
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

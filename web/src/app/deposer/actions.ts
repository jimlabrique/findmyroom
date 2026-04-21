"use server";

import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import {
  type AnimalsPolicy,
  cleanOptionalText,
  type ListingRoomDetail,
  normalizeWhatsapp,
  parseOptionalInt,
  slugifyListingTitle,
  type ListingPhoto,
} from "@/lib/listing";
import { generateUniqueSlug } from "@/lib/data/listings";
import {
  extractNewListingPhotoDrafts,
  type PhotoDraft,
  splitPhotosForStorage,
  uploadListingPhotoFiles,
} from "@/lib/storage/listing-photos";
import {
  buildAutoListingTitle,
  buildStructuredFlatshareVibe,
  buildStructuredHousingDescription,
  sanitizeOptionValues,
} from "@/lib/listing-composer";
import {
  ANIMALS_POLICY_OPTIONS,
  AREA_CONTEXT_OPTIONS,
  BRUSSELS_COMMUNES,
  CANDIDATE_GENDER_PREFERENCE_OPTIONS,
  COMMON_SPACES_COLOCATION_OPTIONS,
  COMMON_SPACES_STUDIO_OPTIONS,
  CURRENT_FLATMATES_OPTIONS,
  isValidNeighborhoodForCommune,
  LISTING_TYPE_OPTIONS,
  isOtherNeighborhoodValue,
  OTHER_NEIGHBORHOOD_VALUE,
  ROOM_BATHROOM_OPTIONS,
  ROOM_FURNISHING_OPTIONS,
  ROOM_OUTDOOR_OPTIONS,
  ROOM_VIEW_OPTIONS,
  TRANSPORT_MODE_OPTIONS,
  VIBE_TAG_OPTIONS,
} from "@/lib/listing-form-options";
import { getRequestLocale } from "@/lib/i18n/request-locale";
import { withLocalePath } from "@/lib/i18n/pathname";
import { assertTrustedFormRequest } from "@/lib/security/request";

function isMissingPhotoCaptionsColumn(message: string) {
  return /photo_captions/i.test(message) && /column/i.test(message);
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

export async function createListingAction(formData: FormData) {
  const locale = await getRequestLocale();
  const deposerPath = withLocalePath("/deposer", locale);
  const redirectDeposerError = (errorCode: string): never =>
    redirect(`${deposerPath}?error=${encodeURIComponent(errorCode)}`);
  const redirectDeposerMissingFields = (fields: string[]): never => {
    const uniqueFields = Array.from(new Set(fields.filter((field) => field.trim().length > 0)));
    const params = new URLSearchParams();
    params.set("error", "missing_required_fields");
    params.set("missing", uniqueFields.join(","));
    redirect(`${deposerPath}?${params.toString()}`);
  };

  try {
    await assertTrustedFormRequest();
  } catch {
    redirectDeposerError("untrusted_origin");
  }

  const { supabase, user } = await requireUser(deposerPath);

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
  const currentFlatmatesRaw = cleanOptionalText(formData.get("current_flatmates"));
  const currentFlatmates = currentFlatmatesRaw
    ? parseOptionalEnumValue(
        currentFlatmatesRaw,
        CURRENT_FLATMATES_OPTIONS.map((option) => option.value),
      )
    : null;
  const candidateGenderPreferenceRaw = cleanOptionalText(formData.get("candidate_gender_preference"));
  const candidateGenderPreference = candidateGenderPreferenceRaw
    ? parseOptionalEnumValue(
        candidateGenderPreferenceRaw,
        CANDIDATE_GENDER_PREFERENCE_OPTIONS.map((option) => option.value),
      )
    : null;
  const animalsPolicyRaw = `${formData.get("animals_policy") ?? ""}`.trim();
  const animalsPolicy = (parseOptionalEnumValue(
    animalsPolicyRaw,
    ANIMALS_POLICY_OPTIONS.map((option) => option.value),
  ) ?? "negotiable") as AnimalsPolicy;
  const missingFields = new Set<string>();

  if (!listingType) {
    missingFields.add("listing_type");
  }
  if (!BRUSSELS_COMMUNES.includes(city as (typeof BRUSSELS_COMMUNES)[number])) {
    missingFields.add("city");
  }
  if (
    isOtherNeighborhood &&
    (!neighborhoodCustom || isOtherNeighborhoodValue(neighborhoodCustom) || neighborhoodCustom === OTHER_NEIGHBORHOOD_VALUE)
  ) {
    missingFields.add("neighborhood_custom");
  }
  if (!isOtherNeighborhood && !isValidNeighborhoodForCommune(city, neighborhood)) {
    missingFields.add("neighborhood");
  }
  if (!availableFrom) {
    missingFields.add("available_from");
  }

  if (listingType === "colocation") {
    const hasValidAvailableRooms = Number.isFinite(availableRooms) && availableRooms > 0;
    const hasValidTotalRooms = Number.isFinite(totalRooms) && totalRooms > 0;

    if (!hasValidAvailableRooms) {
      missingFields.add("available_rooms");
    }
    if (!hasValidTotalRooms) {
      missingFields.add("total_rooms");
    }
    if (hasValidAvailableRooms && hasValidTotalRooms && totalRooms < availableRooms) {
      redirectDeposerError("total_rooms_invalid");
    }
  }

  let roomDetails: ListingRoomDetail[] = [];
  if (listingType && Number.isFinite(availableRooms) && availableRooms > 0) {
    try {
      roomDetails = parseRoomDetails(formData, availableRooms);
    } catch {
      missingFields.add("room_details");
    }
  }

  const charges = parseOptionalInt(formData.get("charges_eur"));
  const minDurationMonths = parseOptionalInt(formData.get("min_duration_months"));
  const leaseType = cleanOptionalText(formData.get("lease_type"));
  const selectedTransportModes = sanitizeOptionValues(
    formData.getAll("transport_modes").map((value) => `${value ?? ""}`),
    TRANSPORT_MODE_OPTIONS.map((option) => option.value),
  );
  const selectedAreaContexts = sanitizeOptionValues(
    formData.getAll("area_contexts").map((value) => `${value ?? ""}`),
    AREA_CONTEXT_OPTIONS.map((option) => option.value),
  );
  const selectedVibeTags = sanitizeOptionValues(
    formData.getAll("vibe_tags").map((value) => `${value ?? ""}`),
    VIBE_TAG_OPTIONS.map((option) => option.value),
  );
  const selectedCommonSpaces = sanitizeOptionValues(
    formData.getAll("common_spaces").map((value) => `${value ?? ""}`),
    (isStudio ? COMMON_SPACES_STUDIO_OPTIONS : COMMON_SPACES_COLOCATION_OPTIONS).map((option) => option.value),
  );
  const transportLines = cleanOptionalText(formData.get("transport_lines"));
  const commonSpacesOther = cleanOptionalText(formData.get("common_spaces_other"));
  const housingDescriptionExtra = cleanOptionalText(formData.get("housing_description_extra"));
  const flatshareVibeOther = cleanOptionalText(formData.get("flatshare_vibe_other"));
  const rawWhatsapp = `${formData.get("contact_whatsapp") ?? ""}`.trim();
  const contactPhone = normalizeWhatsapp(rawWhatsapp);
  const contactEmail = cleanOptionalText(user.email ?? null);
  let photoDrafts: PhotoDraft[] = [];
  let uploadedPhotos: ListingPhoto[] = [];

  if (rawWhatsapp && !contactPhone) {
    redirectDeposerError("contact_phone_required");
  }

  if (!contactEmail) {
    missingFields.add("account_email");
  }

  try {
    photoDrafts = extractNewListingPhotoDrafts(formData);
    if (!photoDrafts.length) {
      missingFields.add("photos");
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "photo_upload_failed";
    if (message === "photo_caption_required") {
      missingFields.add("photo_captions");
    } else {
      redirectDeposerError(message);
    }
  }

  if (missingFields.size) {
    redirectDeposerMissingFields(Array.from(missingFields));
  }

  const resolvedListingType = listingType ?? redirectDeposerMissingFields(["listing_type"]);
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

  if (!isStudio && !flatshareVibe) {
    redirectDeposerError("vibe_required");
  }

  try {
    uploadedPhotos = await uploadListingPhotoFiles({
      supabase,
      userId: user.id,
      drafts: photoDrafts,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "photo_upload_failed";
    redirectDeposerError(message);
  }

  if (!uploadedPhotos.length) {
    redirectDeposerMissingFields(["photos"]);
  }

  const { urls: photoUrls, captions: photoCaptions } = splitPhotosForStorage(uploadedPhotos);

  const baseSlug = slugifyListingTitle(title, city);
  const slug = await generateUniqueSlug(supabase, baseSlug);

  const baseInsertPayload = {
    user_id: user.id,
    slug,
    title,
    listing_type: resolvedListingType,
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

  const { error } = await supabase.from("listings").insert({
    ...baseInsertPayload,
    photo_captions: photoCaptions,
  });

  if (error && isMissingPhotoCaptionsColumn(error.message)) {
    redirectDeposerError("schema_missing_photo_captions");
  }
  if (error && isMissingStructuredListingColumns(error.message)) {
    redirectDeposerError("schema_missing_listing_fields");
  }

  if (error) {
    redirectDeposerError(error.message);
  }

  redirect(`${withLocalePath(`/annonces/${slug}`, locale)}?created=1`);
}

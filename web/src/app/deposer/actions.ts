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
  const { supabase, user } = await requireUser("/deposer");

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

  if (!Number.isFinite(availableRooms) || availableRooms <= 0) {
    redirect("/deposer?error=missing_required_fields");
  }
  if (!Number.isFinite(totalRooms) || totalRooms <= 0 || totalRooms < availableRooms) {
    redirect("/deposer?error=total_rooms_invalid");
  }

  let roomDetails: ListingRoomDetail[] = [];
  try {
    roomDetails = parseRoomDetails(formData, availableRooms);
  } catch (error) {
    const message = error instanceof Error ? error.message : "room_details_invalid";
    redirect(`/deposer?error=${encodeURIComponent(message)}`);
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
  const rawWhatsapp = `${formData.get("contact_whatsapp") ?? ""}`.trim();
  const contactPhone = normalizeWhatsapp(rawWhatsapp);
  const contactEmail = cleanOptionalText(user.email ?? null);
  let uploadedPhotos: ListingPhoto[] = [];

  if (!listingType) {
    redirect("/deposer?error=listing_type_required");
  }
  if (!BRUSSELS_COMMUNES.includes(city as (typeof BRUSSELS_COMMUNES)[number])) {
    redirect("/deposer?error=commune_required");
  }
  if (
    isOtherNeighborhood &&
    (!neighborhoodCustom || isOtherNeighborhoodValue(neighborhoodCustom) || neighborhoodCustom === OTHER_NEIGHBORHOOD_VALUE)
  ) {
    redirect("/deposer?error=neighborhood_custom_required");
  }
  if (!isOtherNeighborhood && !isValidNeighborhoodForCommune(city, neighborhood)) {
    redirect("/deposer?error=neighborhood_required");
  }

  if (!neighborhood || !availableFrom || !title) {
    redirect("/deposer?error=missing_required_fields");
  }

  if (!isStudio && !flatshareVibe) {
    redirect("/deposer?error=vibe_required");
  }

  if (rawWhatsapp && !contactPhone) {
    redirect("/deposer?error=contact_phone_required");
  }

  if (!contactEmail) {
    redirect("/deposer?error=account_email_required");
  }

  try {
    const photoDrafts = extractNewListingPhotoDrafts(formData);
    if (!photoDrafts.length) {
      redirect("/deposer?error=photo_required");
    }
    uploadedPhotos = await uploadListingPhotoFiles({
      supabase,
      userId: user.id,
      drafts: photoDrafts,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "photo_upload_failed";
    redirect(`/deposer?error=${encodeURIComponent(message)}`);
  }

  if (!uploadedPhotos.length) {
    redirect("/deposer?error=photo_required");
  }

  const { urls: photoUrls, captions: photoCaptions } = splitPhotosForStorage(uploadedPhotos);

  const baseSlug = slugifyListingTitle(title, city);
  const slug = await generateUniqueSlug(supabase, baseSlug);

  const baseInsertPayload = {
    user_id: user.id,
    slug,
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

  const { error } = await supabase.from("listings").insert({
    ...baseInsertPayload,
    photo_captions: photoCaptions,
  });

  if (error && isMissingPhotoCaptionsColumn(error.message)) {
    redirect("/deposer?error=schema_missing_photo_captions");
  }
  if (error && isMissingStructuredListingColumns(error.message)) {
    redirect("/deposer?error=schema_missing_listing_fields");
  }

  if (error) {
    redirect(`/deposer?error=${encodeURIComponent(error.message)}`);
  }

  redirect(`/annonces/${slug}?created=1`);
}

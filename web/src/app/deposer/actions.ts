"use server";

import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import {
  cleanOptionalText,
  normalizeWhatsapp,
  parseOptionalInt,
  parseRequiredInt,
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
  AREA_CONTEXT_OPTIONS,
  BRUSSELS_COMMUNES,
  TRANSPORT_MODE_OPTIONS,
  VIBE_TAG_OPTIONS,
} from "@/lib/listing-form-options";

function isMissingPhotoCaptionsColumn(message: string) {
  return /photo_captions/i.test(message) && /column/i.test(message);
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

  // Backward compatibility if the form is submitted without contact_methods.
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

function parseRoomSizesSqm(formData: FormData, availableRooms: number) {
  const rawSizes = formData
    .getAll("room_sizes_sqm")
    .map((value) => `${value ?? ""}`.trim())
    .filter((value) => value.length > 0);

  if (rawSizes.length !== availableRooms) {
    throw new Error("room_sizes_count_mismatch");
  }

  const parsed = rawSizes.map((value) => Number.parseInt(value, 10));
  if (parsed.some((value) => !Number.isFinite(value) || value <= 0)) {
    throw new Error("room_sizes_invalid");
  }

  return parsed;
}

export async function createListingAction(formData: FormData) {
  const { supabase, user } = await requireUser("/deposer");

  const titleInput = `${formData.get("title") ?? ""}`.trim();
  const city = `${formData.get("city") ?? ""}`.trim();
  const neighborhood = `${formData.get("neighborhood") ?? ""}`.trim();
  const availableFrom = `${formData.get("available_from") ?? ""}`.trim();

  const rent = parseRequiredInt(formData.get("rent_eur"), "rent_eur");
  const availableRooms = parseRequiredInt(formData.get("available_rooms"), "available_rooms");
  let roomSizesSqm: number[] = [];
  try {
    roomSizesSqm = parseRoomSizesSqm(formData, availableRooms);
  } catch (error) {
    const message = error instanceof Error ? error.message : "room_sizes_invalid";
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
  const transportLines = cleanOptionalText(formData.get("transport_lines"));
  const housingDescriptionExtra = cleanOptionalText(formData.get("housing_description_extra"));
  const flatshareVibeOther = cleanOptionalText(formData.get("flatshare_vibe_other"));
  const title = titleInput || buildAutoListingTitle({ commune: city, roomCount: availableRooms, roomSizesSqm, neighborhood });
  const housingDescription = buildStructuredHousingDescription({
    neighborhood,
    roomSizesSqm,
    transportModes: selectedTransportModes,
    transportLines,
    areaContexts: selectedAreaContexts,
    extraDetails: housingDescriptionExtra,
  });
  const flatshareVibe = buildStructuredFlatshareVibe({
    vibeTags: selectedVibeTags,
    vibeOther: flatshareVibeOther,
  });
  const contactSelection = readContactMethodSelection(formData);
  const contactPhone = contactSelection.phoneValue;
  const contactEmail = contactSelection.emailValue;
  let uploadedPhotos: ListingPhoto[] = [];

  if (!BRUSSELS_COMMUNES.includes(city as (typeof BRUSSELS_COMMUNES)[number])) {
    redirect("/deposer?error=commune_required");
  }

  if (!neighborhood || !availableFrom || !title) {
    redirect("/deposer?error=missing_required_fields");
  }

  if (!flatshareVibe) {
    redirect("/deposer?error=vibe_required");
  }

  if (!contactSelection.hasPhone && !contactSelection.hasEmail) {
    redirect("/deposer?error=contact_method_required");
  }

  if (contactSelection.hasPhone && !contactPhone) {
    redirect("/deposer?error=contact_phone_required");
  }

  if (contactSelection.hasEmail && !contactEmail) {
    redirect("/deposer?error=contact_email_required");
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
    rent_eur: rent,
    city,
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

  const { error } = await supabase.from("listings").insert({
    ...baseInsertPayload,
    photo_captions: photoCaptions,
  });

  if (error && isMissingPhotoCaptionsColumn(error.message)) {
    redirect("/deposer?error=schema_missing_photo_captions");
  }

  if (error) {
    redirect(`/deposer?error=${encodeURIComponent(error.message)}`);
  }

  redirect(`/annonces/${slug}?created=1`);
}

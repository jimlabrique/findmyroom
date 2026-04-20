"use client";

import { useMemo, useState } from "react";
import { useLocale } from "next-intl";
import { buildAutoListingTitle } from "@/lib/listing-composer";
import {
  BRUSSELS_COMMUNES,
  COMMON_SPACES_COLOCATION_OPTIONS,
  COMMON_SPACES_STUDIO_OPTIONS,
  getCanonicalCommuneLabel,
  getCanonicalNeighborhoodLabel,
  getLocalizedCommuneLabel,
  getLocalizedNeighborhoodLabel,
  getNeighborhoodsForCommune,
  isValidNeighborhoodForCommune,
  OTHER_NEIGHBORHOOD_VALUE,
} from "@/lib/listing-form-options";
import { CoreFields } from "@/components/create-listing-basics/core-fields";
import { RoomDetailsFields } from "@/components/create-listing-basics/room-details-fields";
import { CommonSpacesFields } from "@/components/create-listing-basics/common-spaces-fields";
import type { RoomDraft } from "@/components/create-listing-basics/types";
import type { AppLocale } from "@/lib/i18n/locales";

const MIN_ROOMS = 1;
const MAX_ROOMS = 10;

export type CreateListingBasicsInitialValues = {
  listingType?: "colocation" | "studio";
  commune?: string;
  neighborhood?: string;
  availableRooms?: number;
  totalRooms?: number;
  availableFrom?: string;
  roomDrafts?: RoomDraft[];
  commonSpaces?: string[];
  commonSpacesOther?: string;
};

type CreateListingBasicsProps = {
  initialValues?: CreateListingBasicsInitialValues;
};

const ROOM_DRAFT_DEFAULT: RoomDraft = {
  size_sqm: "",
  price_eur: "",
  furnishing: "furnished",
  bathroom: "shared",
  outdoor: "none",
  view: "street",
};

function normalizeRoomCount(value: string) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed < MIN_ROOMS) return MIN_ROOMS;
  if (parsed > MAX_ROOMS) return MAX_ROOMS;
  return parsed;
}

function ensureRoomDraftCount(roomDrafts: RoomDraft[], expectedCount: number) {
  if (roomDrafts.length === expectedCount) return roomDrafts;
  if (roomDrafts.length > expectedCount) return roomDrafts.slice(0, expectedCount);
  return [...roomDrafts, ...Array.from({ length: expectedCount - roomDrafts.length }, () => ({ ...ROOM_DRAFT_DEFAULT }))];
}

function normalizeRoomDraft(input: RoomDraft | undefined): RoomDraft {
  return {
    size_sqm: `${input?.size_sqm ?? ""}`.trim(),
    price_eur: `${input?.price_eur ?? ""}`.trim(),
    furnishing: `${input?.furnishing ?? ROOM_DRAFT_DEFAULT.furnishing}`.trim() || ROOM_DRAFT_DEFAULT.furnishing,
    bathroom: `${input?.bathroom ?? ROOM_DRAFT_DEFAULT.bathroom}`.trim() || ROOM_DRAFT_DEFAULT.bathroom,
    outdoor: `${input?.outdoor ?? ROOM_DRAFT_DEFAULT.outdoor}`.trim() || ROOM_DRAFT_DEFAULT.outdoor,
    view: `${input?.view ?? ROOM_DRAFT_DEFAULT.view}`.trim() || ROOM_DRAFT_DEFAULT.view,
  };
}

function getAllowedCommonSpaceValues(type: "colocation" | "studio"): Set<string> {
  const options = type === "studio" ? COMMON_SPACES_STUDIO_OPTIONS : COMMON_SPACES_COLOCATION_OPTIONS;
  return new Set(options.map((option) => option.value));
}

export function CreateListingBasics({ initialValues }: CreateListingBasicsProps) {
  const locale = useLocale() as AppLocale;
  const canonicalInitialCommune = getCanonicalCommuneLabel(initialValues?.commune ?? "");
  const initialListingType = initialValues?.listingType === "studio" ? "studio" : "colocation";
  const initialCommune =
    canonicalInitialCommune && BRUSSELS_COMMUNES.includes(canonicalInitialCommune as (typeof BRUSSELS_COMMUNES)[number])
      ? canonicalInitialCommune
      : "Bruxelles-Ville";
  const initialCommuneNeighborhoods = getNeighborhoodsForCommune(initialCommune);
  const initialNeighborhoodRaw = getCanonicalNeighborhoodLabel(initialCommune, `${initialValues?.neighborhood ?? ""}`.trim());
  const initialHasCustomNeighborhood = Boolean(initialNeighborhoodRaw) && !isValidNeighborhoodForCommune(initialCommune, initialNeighborhoodRaw);
  const initialNeighborhood = initialHasCustomNeighborhood ? OTHER_NEIGHBORHOOD_VALUE : initialNeighborhoodRaw || initialCommuneNeighborhoods[0] || "";
  const initialCustomNeighborhood = initialHasCustomNeighborhood ? initialNeighborhoodRaw : "";
  const initialRoomDraftsRaw = (initialValues?.roomDrafts?.length ? initialValues.roomDrafts : [{ ...ROOM_DRAFT_DEFAULT }]).map(
    (room) => normalizeRoomDraft(room),
  );
  const initialAvailableRoomsSeed = (initialValues?.availableRooms ?? initialRoomDraftsRaw.length) || MIN_ROOMS;
  const initialAvailableRooms = initialListingType === "studio" ? 1 : normalizeRoomCount(`${initialAvailableRoomsSeed}`);
  const initialTotalRooms =
    initialListingType === "studio"
      ? 1
      : Math.max(normalizeRoomCount(`${initialValues?.totalRooms ?? initialValues?.availableRooms ?? initialAvailableRooms}`), initialAvailableRooms);
  const initialRoomDrafts = ensureRoomDraftCount(initialRoomDraftsRaw, initialAvailableRooms);
  const initialAllowedCommonSpaces = getAllowedCommonSpaceValues(initialListingType);
  const initialSelectedCommonSpaces = initialValues?.commonSpaces?.filter((value) => initialAllowedCommonSpaces.has(value)) ?? [];
  const initialCommonSpacesOther = `${initialValues?.commonSpacesOther ?? ""}`.trim();
  const initialAvailableFrom = `${initialValues?.availableFrom ?? ""}`.trim();

  const [listingType, setListingType] = useState<"colocation" | "studio">(initialListingType);
  const [commune, setCommune] = useState(initialCommune);
  const [neighborhood, setNeighborhood] = useState(initialNeighborhood);
  const [customNeighborhood, setCustomNeighborhood] = useState(initialCustomNeighborhood);
  const [availableRooms, setAvailableRooms] = useState(initialAvailableRooms);
  const [totalRooms, setTotalRooms] = useState(initialTotalRooms);
  const [roomDrafts, setRoomDrafts] = useState<RoomDraft[]>(initialRoomDrafts);
  const [selectedCommonSpaces, setSelectedCommonSpaces] = useState<string[]>(initialSelectedCommonSpaces);
  const [commonSpacesOther, setCommonSpacesOther] = useState(initialCommonSpacesOther);

  const neighborhoodOptions = useMemo(() => getNeighborhoodsForCommune(commune), [commune]);
  const commonSpacesOptions = listingType === "studio" ? COMMON_SPACES_STUDIO_OPTIONS : COMMON_SPACES_COLOCATION_OPTIONS;
  const effectiveNeighborhood = neighborhood === OTHER_NEIGHBORHOOD_VALUE ? customNeighborhood : neighborhood;

  const autoTitle = useMemo(
    () =>
      buildAutoListingTitle({
        listingType,
        commune: getLocalizedCommuneLabel(commune, locale),
        roomCount: availableRooms,
        roomSizesSqm: roomDrafts.map((room) => room.size_sqm),
        neighborhood: getLocalizedNeighborhoodLabel(commune, effectiveNeighborhood, locale),
        locale,
      }),
    [listingType, commune, availableRooms, roomDrafts, effectiveNeighborhood, locale],
  );

  function updateRoomDraft(index: number, key: keyof RoomDraft, value: string) {
    setRoomDrafts((prev) => prev.map((room, roomIndex) => (roomIndex === index ? { ...room, [key]: value } : room)));
  }

  function handleRoomCountChange(rawValue: string) {
    const nextRoomCount = normalizeRoomCount(rawValue);
    setAvailableRooms(nextRoomCount);
    setTotalRooms((prev) => Math.max(prev, nextRoomCount));
    setRoomDrafts((prev) => ensureRoomDraftCount(prev, nextRoomCount));
  }

  function handleTotalRoomsChange(rawValue: string) {
    const parsed = normalizeRoomCount(rawValue);
    setTotalRooms(Math.max(parsed, availableRooms));
  }

  function handleCommuneChange(nextCommune: string) {
    setCommune(nextCommune);
    const nextNeighborhoods = getNeighborhoodsForCommune(nextCommune);
    setNeighborhood(nextNeighborhoods[0] ?? "");
    setCustomNeighborhood("");
  }

  function handleListingTypeChange(nextType: "colocation" | "studio") {
    setListingType(nextType);
    const allowedCommonSpaces = getAllowedCommonSpaceValues(nextType);
    setSelectedCommonSpaces((prev) => prev.filter((value) => allowedCommonSpaces.has(value)));
    if (nextType === "studio") {
      setAvailableRooms(1);
      setTotalRooms(1);
      setRoomDrafts((prev) => [prev[0] ?? { ...ROOM_DRAFT_DEFAULT }]);
    }
  }

  function handleNeighborhoodChange(nextNeighborhood: string) {
    setNeighborhood(nextNeighborhood);
    if (nextNeighborhood !== OTHER_NEIGHBORHOOD_VALUE) {
      setCustomNeighborhood("");
    }
  }

  function toggleCommonSpace(value: string, checked: boolean) {
    setSelectedCommonSpaces((prev) => {
      if (checked) return prev.includes(value) ? prev : [...prev, value];
      return prev.filter((item) => item !== value);
    });
  }

  return (
    <div className="space-y-4">
      <CoreFields
        listingType={listingType}
        autoTitle={autoTitle}
        commune={commune}
        neighborhood={neighborhood}
        customNeighborhood={customNeighborhood}
        neighborhoodOptions={neighborhoodOptions}
        availableRooms={availableRooms}
        totalRooms={totalRooms}
        initialAvailableFrom={initialAvailableFrom}
        minRooms={MIN_ROOMS}
        maxRooms={MAX_ROOMS}
        onListingTypeChange={handleListingTypeChange}
        onCommuneChange={handleCommuneChange}
        onNeighborhoodChange={handleNeighborhoodChange}
        onCustomNeighborhoodChange={setCustomNeighborhood}
        onAvailableRoomsChange={handleRoomCountChange}
        onTotalRoomsChange={handleTotalRoomsChange}
      />

      <RoomDetailsFields listingType={listingType} roomDrafts={roomDrafts} onUpdateRoomDraft={updateRoomDraft} />

      <CommonSpacesFields
        listingType={listingType}
        options={commonSpacesOptions}
        selectedValues={selectedCommonSpaces}
        otherValue={commonSpacesOther}
        onToggle={toggleCommonSpace}
        onOtherChange={setCommonSpacesOther}
      />
    </div>
  );
}

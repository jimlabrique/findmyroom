"use client";

import { useMemo, useState } from "react";
import { buildAutoListingTitle } from "@/lib/listing-composer";
import {
  BRUSSELS_COMMUNES,
  COMMON_SPACES_COLOCATION_OPTIONS,
  COMMON_SPACES_STUDIO_OPTIONS,
  getNeighborhoodsForCommune,
  isValidNeighborhoodForCommune,
  LISTING_TYPE_OPTIONS,
  OTHER_NEIGHBORHOOD_LABEL,
  OTHER_NEIGHBORHOOD_VALUE,
  ROOM_BATHROOM_OPTIONS,
  ROOM_FURNISHING_OPTIONS,
  ROOM_OUTDOOR_OPTIONS,
  ROOM_VIEW_OPTIONS,
} from "@/lib/listing-form-options";

const MIN_ROOMS = 1;
const MAX_ROOMS = 10;

type RoomDraft = {
  size_sqm: string;
  price_eur: string;
  furnishing: string;
  bathroom: string;
  outdoor: string;
  view: string;
};

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
  const initialListingType = initialValues?.listingType === "studio" ? "studio" : "colocation";
  const initialCommune =
    initialValues?.commune && BRUSSELS_COMMUNES.includes(initialValues.commune as (typeof BRUSSELS_COMMUNES)[number])
      ? initialValues.commune
      : "Bruxelles-Ville";
  const initialCommuneNeighborhoods = getNeighborhoodsForCommune(initialCommune);
  const initialNeighborhoodRaw = `${initialValues?.neighborhood ?? ""}`.trim();
  const initialHasCustomNeighborhood = Boolean(initialNeighborhoodRaw) && !isValidNeighborhoodForCommune(initialCommune, initialNeighborhoodRaw);
  const initialNeighborhood = initialHasCustomNeighborhood
    ? OTHER_NEIGHBORHOOD_VALUE
    : initialNeighborhoodRaw || initialCommuneNeighborhoods[0] || "";
  const initialCustomNeighborhood = initialHasCustomNeighborhood ? initialNeighborhoodRaw : "";
  const initialRoomDraftsRaw = (initialValues?.roomDrafts?.length ? initialValues.roomDrafts : [{ ...ROOM_DRAFT_DEFAULT }]).map(
    (room) => normalizeRoomDraft(room),
  );
  const initialAvailableRoomsSeed = (initialValues?.availableRooms ?? initialRoomDraftsRaw.length) || MIN_ROOMS;
  const initialAvailableRooms =
    initialListingType === "studio"
      ? 1
      : normalizeRoomCount(`${initialAvailableRoomsSeed}`);
  const initialTotalRooms =
    initialListingType === "studio"
      ? 1
      : Math.max(
          normalizeRoomCount(`${initialValues?.totalRooms ?? initialValues?.availableRooms ?? initialAvailableRooms}`),
          initialAvailableRooms,
        );
  const initialRoomDrafts = ensureRoomDraftCount(initialRoomDraftsRaw, initialAvailableRooms);
  const initialAllowedCommonSpaces = getAllowedCommonSpaceValues(initialListingType);
  const initialSelectedCommonSpaces =
    initialValues?.commonSpaces?.filter((value) => initialAllowedCommonSpaces.has(value)) ?? [];
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
        commune,
        roomCount: availableRooms,
        roomSizesSqm: roomDrafts.map((room) => room.size_sqm),
        neighborhood: effectiveNeighborhood,
      }),
    [listingType, commune, availableRooms, roomDrafts, effectiveNeighborhood],
  );

  function updateRoomDraft(index: number, key: keyof RoomDraft, value: string) {
    setRoomDrafts((prev) =>
      prev.map((room, roomIndex) => (roomIndex === index ? { ...room, [key]: value } : room)),
    );
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
      if (checked) {
        return prev.includes(value) ? prev : [...prev, value];
      }
      return prev.filter((item) => item !== value);
    });
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="label" htmlFor="listing_type">
          Type d&apos;annonce
        </label>
        <select
          id="listing_type"
          name="listing_type"
          required
          className="input"
          value={listingType}
          onChange={(event) => handleListingTypeChange(event.currentTarget.value as "colocation" | "studio")}
        >
          {LISTING_TYPE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <label className="label" htmlFor="generated-title">
          Titre généré automatiquement
        </label>
        <output id="generated-title" aria-live="polite" className="input block bg-stone-50 text-stone-700">
          {autoTitle}
        </output>
        <p className="text-xs text-stone-500">
          Il se met à jour automatiquement selon la commune, les chambres, les tailles et le quartier.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="city">
            Commune
          </label>
          <select
            id="city"
            name="city"
            required
            className="input"
            value={commune}
            onChange={(event) => handleCommuneChange(event.currentTarget.value)}
          >
            {BRUSSELS_COMMUNES.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="label" htmlFor="neighborhood">
            Quartier
          </label>
          <select
            id="neighborhood"
            name="neighborhood"
            required
            className="input"
            value={neighborhood}
            onChange={(event) => handleNeighborhoodChange(event.currentTarget.value)}
          >
            {!neighborhoodOptions.length ? <option value="">Aucun quartier configuré</option> : null}
            {neighborhoodOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
            {neighborhoodOptions.length ? <option value={OTHER_NEIGHBORHOOD_VALUE}>{OTHER_NEIGHBORHOOD_LABEL}</option> : null}
          </select>
        </div>

        {neighborhood === OTHER_NEIGHBORHOOD_VALUE ? (
          <div className="sm:col-span-2">
            <label className="label" htmlFor="neighborhood_custom">
              Précise le quartier
            </label>
            <input
              id="neighborhood_custom"
              name="neighborhood_custom"
              required
              className="input"
              placeholder="Nom du quartier"
              value={customNeighborhood}
              onChange={(event) => setCustomNeighborhood(event.currentTarget.value)}
            />
          </div>
        ) : null}

        {listingType === "colocation" ? (
          <>
            <div>
              <label className="label" htmlFor="available_rooms">
                Chambres disponibles
              </label>
              <input
                id="available_rooms"
                name="available_rooms"
                type="number"
                min={MIN_ROOMS}
                max={MAX_ROOMS}
                required
                className="input"
                value={availableRooms}
                onChange={(event) => handleRoomCountChange(event.currentTarget.value)}
              />
            </div>

            <div>
              <label className="label" htmlFor="total_rooms">
                Total chambres dans la coloc
              </label>
              <input
                id="total_rooms"
                name="total_rooms"
                type="number"
                min={MIN_ROOMS}
                max={MAX_ROOMS}
                required
                className="input"
                value={totalRooms}
                onChange={(event) => handleTotalRoomsChange(event.currentTarget.value)}
              />
            </div>
          </>
        ) : (
          <>
            <input type="hidden" name="available_rooms" value={1} />
            <input type="hidden" name="total_rooms" value={1} />
            <div className="sm:col-span-2">
              <p className="rounded-lg border border-stone-200 bg-stone-50 px-3 py-2 text-sm text-stone-700">
                Studio: 1 pièce principale, pour 1 personne.
              </p>
            </div>
          </>
        )}

        <div>
          <label className="label" htmlFor="available_from">
            Disponibilité
          </label>
          <input
            id="available_from"
            name="available_from"
            type="date"
            required
            className="input"
            defaultValue={initialAvailableFrom}
          />
        </div>
      </div>

      <div className="space-y-3">
        <p className="label m-0">{listingType === "studio" ? "Détails du studio" : "Détails par chambre disponible"}</p>
        <div className="space-y-3">
          {roomDrafts.map((room, index) => (
            <div key={`room-${index}`} className="rounded-xl border border-stone-200 bg-stone-50 p-3">
              <p className="mb-3 text-sm font-semibold text-stone-800">{listingType === "studio" ? "Studio" : `Chambre ${index + 1}`}</p>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="label" htmlFor={`room-size-${index}`}>
                    Taille (m2)
                  </label>
                  <input
                    id={`room-size-${index}`}
                    name="room_size_sqm"
                    type="number"
                    min={1}
                    required
                    className="input"
                    value={room.size_sqm}
                    onChange={(event) => updateRoomDraft(index, "size_sqm", event.currentTarget.value)}
                  />
                </div>
                <div>
                  <label className="label" htmlFor={`room-price-${index}`}>
                    Prix (EUR/mois)
                  </label>
                  <input
                    id={`room-price-${index}`}
                    name="room_price_eur"
                    type="number"
                    min={1}
                    required
                    className="input"
                    value={room.price_eur}
                    onChange={(event) => updateRoomDraft(index, "price_eur", event.currentTarget.value)}
                  />
                </div>
                <div>
                  <label className="label" htmlFor={`room-furnishing-${index}`}>
                    Meublé
                  </label>
                  <select
                    id={`room-furnishing-${index}`}
                    name="room_furnishing"
                    required
                    className="input"
                    value={room.furnishing}
                    onChange={(event) => updateRoomDraft(index, "furnishing", event.currentTarget.value)}
                  >
                    {ROOM_FURNISHING_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label" htmlFor={`room-bathroom-${index}`}>
                    Salle de bain
                  </label>
                  <select
                    id={`room-bathroom-${index}`}
                    name="room_bathroom"
                    required
                    className="input"
                    value={room.bathroom}
                    onChange={(event) => updateRoomDraft(index, "bathroom", event.currentTarget.value)}
                  >
                    {ROOM_BATHROOM_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label" htmlFor={`room-outdoor-${index}`}>
                    Extérieur
                  </label>
                  <select
                    id={`room-outdoor-${index}`}
                    name="room_outdoor"
                    required
                    className="input"
                    value={room.outdoor}
                    onChange={(event) => updateRoomDraft(index, "outdoor", event.currentTarget.value)}
                  >
                    {ROOM_OUTDOOR_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label" htmlFor={`room-view-${index}`}>
                    Vue
                  </label>
                  <select
                    id={`room-view-${index}`}
                    name="room_view"
                    required
                    className="input"
                    value={room.view}
                    onChange={(event) => updateRoomDraft(index, "view", event.currentTarget.value)}
                  >
                    {ROOM_VIEW_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <p className="label m-0">{listingType === "studio" ? "Équipements du studio" : "Parties communes"}</p>
        <div className="grid gap-2 sm:grid-cols-2 text-sm text-stone-700">
          {commonSpacesOptions.map((option) => (
            <label key={option.value} className="inline-flex items-center gap-2">
              <input
                type="checkbox"
                name="common_spaces"
                value={option.value}
                checked={selectedCommonSpaces.includes(option.value)}
                onChange={(event) => toggleCommonSpace(option.value, event.currentTarget.checked)}
              />
              {option.label}
            </label>
          ))}
        </div>
        <div>
          <label className="label" htmlFor="common_spaces_other">
            Autre
          </label>
          <input
            id="common_spaces_other"
            name="common_spaces_other"
            className="input"
            placeholder="Précise un équipement ou espace supplémentaire"
            value={commonSpacesOther}
            onChange={(event) => setCommonSpacesOther(event.currentTarget.value)}
          />
        </div>
      </div>
    </div>
  );
}

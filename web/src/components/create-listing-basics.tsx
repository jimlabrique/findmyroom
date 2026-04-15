"use client";

import { useMemo, useState } from "react";
import { buildAutoListingTitle } from "@/lib/listing-composer";
import {
  BRUSSELS_COMMUNES,
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

export function CreateListingBasics() {
  const [commune, setCommune] = useState("Bruxelles");
  const [neighborhood, setNeighborhood] = useState("");
  const [availableRooms, setAvailableRooms] = useState(1);
  const [totalRooms, setTotalRooms] = useState(1);
  const [roomDrafts, setRoomDrafts] = useState<RoomDraft[]>([{ ...ROOM_DRAFT_DEFAULT }]);
  const [customTitle, setCustomTitle] = useState("");
  const [isTitleCustomized, setIsTitleCustomized] = useState(false);

  const autoTitle = useMemo(
    () =>
      buildAutoListingTitle({
        commune,
        roomCount: availableRooms,
        roomSizesSqm: roomDrafts.map((room) => room.size_sqm),
        neighborhood,
      }),
    [commune, availableRooms, roomDrafts, neighborhood],
  );

  const titleValue = isTitleCustomized ? customTitle : autoTitle;

  function updateRoomDraft(index: number, key: keyof RoomDraft, value: string) {
    setRoomDrafts((prev) =>
      prev.map((room, roomIndex) => (roomIndex === index ? { ...room, [key]: value } : room)),
    );
  }

  function handleRoomCountChange(rawValue: string) {
    const nextRoomCount = normalizeRoomCount(rawValue);
    setAvailableRooms(nextRoomCount);
    setTotalRooms((prev) => Math.max(prev, nextRoomCount));
    setRoomDrafts((prev) => {
      if (prev.length === nextRoomCount) return prev;
      if (prev.length > nextRoomCount) return prev.slice(0, nextRoomCount);
      return [...prev, ...Array.from({ length: nextRoomCount - prev.length }, () => ({ ...ROOM_DRAFT_DEFAULT }))];
    });
  }

  function handleTotalRoomsChange(rawValue: string) {
    const parsed = normalizeRoomCount(rawValue);
    setTotalRooms(Math.max(parsed, availableRooms));
  }

  function handleTitleChange(value: string) {
    setCustomTitle(value);
    setIsTitleCustomized(value.trim() !== autoTitle.trim());
  }

  function regenerateTitle() {
    setCustomTitle(autoTitle);
    setIsTitleCustomized(false);
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="label" htmlFor="title">
          Titre (auto, modifiable)
        </label>
        <div className="flex flex-wrap gap-2">
          <input
            id="title"
            name="title"
            required
            className="input min-w-[280px] flex-1"
            value={titleValue}
            onChange={(event) => handleTitleChange(event.currentTarget.value)}
          />
          <button type="button" className="btn btn-ghost" onClick={regenerateTitle}>
            Regenerer
          </button>
        </div>
        <p className="text-xs text-stone-500">Format: Commune - chambres - tailles - quartier.</p>
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
            onChange={(event) => setCommune(event.currentTarget.value)}
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
          <input
            id="neighborhood"
            name="neighborhood"
            required
            className="input"
            placeholder="Flagey, Chatelain, ... "
            value={neighborhood}
            onChange={(event) => setNeighborhood(event.currentTarget.value)}
          />
        </div>

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

        <div>
          <label className="label" htmlFor="available_from">
            Disponibilite
          </label>
          <input id="available_from" name="available_from" type="date" required className="input" />
        </div>
      </div>

      <div className="space-y-3">
        <p className="label m-0">Details par chambre disponible</p>
        <div className="space-y-3">
          {roomDrafts.map((room, index) => (
            <div key={`room-${index}`} className="rounded-xl border border-stone-200 bg-stone-50 p-3">
              <p className="mb-3 text-sm font-semibold text-stone-800">Chambre {index + 1}</p>
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
                    Meublee
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
                    Exterieur
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
    </div>
  );
}

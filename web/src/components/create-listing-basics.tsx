"use client";

import { useMemo, useState } from "react";
import { buildAutoListingTitle } from "@/lib/listing-composer";
import { BRUSSELS_COMMUNES } from "@/lib/listing-form-options";

const MIN_ROOMS = 1;
const MAX_ROOMS = 10;

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
  const [roomSizes, setRoomSizes] = useState<string[]>([""]);
  const [customTitle, setCustomTitle] = useState("");
  const [isTitleCustomized, setIsTitleCustomized] = useState(false);

  const autoTitle = useMemo(
    () =>
      buildAutoListingTitle({
        commune,
        roomCount: availableRooms,
        roomSizesSqm: roomSizes,
        neighborhood,
      }),
    [commune, availableRooms, roomSizes, neighborhood],
  );

  const titleValue = isTitleCustomized ? customTitle : autoTitle;

  function updateRoomSize(index: number, value: string) {
    setRoomSizes((prev) => prev.map((entry, entryIndex) => (entryIndex === index ? value : entry)));
  }

  function handleRoomCountChange(rawValue: string) {
    const nextRoomCount = normalizeRoomCount(rawValue);
    setAvailableRooms(nextRoomCount);
    setRoomSizes((prev) => {
      if (prev.length === nextRoomCount) return prev;
      if (prev.length > nextRoomCount) return prev.slice(0, nextRoomCount);
      return [...prev, ...Array.from({ length: nextRoomCount - prev.length }, () => "")];
    });
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
          <label className="label" htmlFor="available_from">
            Disponibilite
          </label>
          <input id="available_from" name="available_from" type="date" required className="input" />
        </div>
      </div>

      <div className="space-y-3">
        <p className="label m-0">Taille des chambres (m2)</p>
        <div className="grid gap-3 sm:grid-cols-2">
          {roomSizes.map((size, index) => (
            <div key={`room-size-${index}`}>
              <label className="label" htmlFor={`room-size-${index}`}>
                Chambre {index + 1}
              </label>
              <input
                id={`room-size-${index}`}
                name="room_sizes_sqm"
                type="number"
                min={1}
                required
                className="input"
                placeholder="10"
                value={size}
                onChange={(event) => updateRoomSize(index, event.currentTarget.value)}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

"use client";

import { useTranslations } from "next-intl";
import { ROOM_BATHROOM_OPTIONS, ROOM_FURNISHING_OPTIONS, ROOM_OUTDOOR_OPTIONS, ROOM_VIEW_OPTIONS } from "@/lib/listing-form-options";
import type { RoomDraft } from "@/components/create-listing-basics/types";

type RoomDetailsFieldsProps = {
  listingType: "colocation" | "studio";
  roomDrafts: RoomDraft[];
  onUpdateRoomDraft: (index: number, key: keyof RoomDraft, value: string) => void;
};

export function RoomDetailsFields({ listingType, roomDrafts, onUpdateRoomDraft }: RoomDetailsFieldsProps) {
  const t = useTranslations("createBasics");

  return (
    <div className="space-y-3">
      <p className="label m-0">{listingType === "studio" ? t("roomDetailsStudio") : t("roomDetailsByRoom")}</p>
      <div className="space-y-3">
        {roomDrafts.map((room, index) => (
          <div key={`room-${index}`} className="rounded-xl border border-stone-200 bg-stone-50 p-3">
            <p className="mb-3 text-sm font-semibold text-stone-800">
              {listingType === "studio" ? t("studioLabel") : t("roomLabel", { index: index + 1 })}
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="label" htmlFor={`room-size-${index}`}>
                  {t("sizeSqm")}
                </label>
                <input
                  id={`room-size-${index}`}
                  name="room_size_sqm"
                  type="number"
                  min={1}
                  required
                  className="input"
                  value={room.size_sqm}
                  onChange={(event) => onUpdateRoomDraft(index, "size_sqm", event.currentTarget.value)}
                />
              </div>
              <div>
                <label className="label" htmlFor={`room-price-${index}`}>
                  {t("pricePerMonth")}
                </label>
                <input
                  id={`room-price-${index}`}
                  name="room_price_eur"
                  type="number"
                  min={1}
                  required
                  className="input"
                  value={room.price_eur}
                  onChange={(event) => onUpdateRoomDraft(index, "price_eur", event.currentTarget.value)}
                />
              </div>
              <div>
                <label className="label" htmlFor={`room-furnishing-${index}`}>
                  {t("furnishing")}
                </label>
                <select
                  id={`room-furnishing-${index}`}
                  name="room_furnishing"
                  required
                  className="input"
                  value={room.furnishing}
                  onChange={(event) => onUpdateRoomDraft(index, "furnishing", event.currentTarget.value)}
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
                  {t("bathroom")}
                </label>
                <select
                  id={`room-bathroom-${index}`}
                  name="room_bathroom"
                  required
                  className="input"
                  value={room.bathroom}
                  onChange={(event) => onUpdateRoomDraft(index, "bathroom", event.currentTarget.value)}
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
                  {t("outdoor")}
                </label>
                <select
                  id={`room-outdoor-${index}`}
                  name="room_outdoor"
                  required
                  className="input"
                  value={room.outdoor}
                  onChange={(event) => onUpdateRoomDraft(index, "outdoor", event.currentTarget.value)}
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
                  {t("view")}
                </label>
                <select
                  id={`room-view-${index}`}
                  name="room_view"
                  required
                  className="input"
                  value={room.view}
                  onChange={(event) => onUpdateRoomDraft(index, "view", event.currentTarget.value)}
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
  );
}

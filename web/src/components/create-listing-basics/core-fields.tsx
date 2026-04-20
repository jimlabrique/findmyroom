"use client";

import { useTranslations } from "next-intl";
import {
  BRUSSELS_COMMUNES,
  LISTING_TYPE_OPTIONS,
  OTHER_NEIGHBORHOOD_VALUE,
} from "@/lib/listing-form-options";

type CoreFieldsProps = {
  listingType: "colocation" | "studio";
  autoTitle: string;
  commune: string;
  neighborhood: string;
  customNeighborhood: string;
  neighborhoodOptions: readonly string[];
  availableRooms: number;
  totalRooms: number;
  initialAvailableFrom: string;
  minRooms: number;
  maxRooms: number;
  onListingTypeChange: (nextType: "colocation" | "studio") => void;
  onCommuneChange: (nextCommune: string) => void;
  onNeighborhoodChange: (nextNeighborhood: string) => void;
  onCustomNeighborhoodChange: (value: string) => void;
  onAvailableRoomsChange: (value: string) => void;
  onTotalRoomsChange: (value: string) => void;
};

export function CoreFields({
  listingType,
  autoTitle,
  commune,
  neighborhood,
  customNeighborhood,
  neighborhoodOptions,
  availableRooms,
  totalRooms,
  initialAvailableFrom,
  minRooms,
  maxRooms,
  onListingTypeChange,
  onCommuneChange,
  onNeighborhoodChange,
  onCustomNeighborhoodChange,
  onAvailableRoomsChange,
  onTotalRoomsChange,
}: CoreFieldsProps) {
  const t = useTranslations("createBasics");
  const tSearch = useTranslations("listings.search");

  return (
    <>
      <div>
        <label className="label" htmlFor="listing_type">
          {t("listingType")}
        </label>
        <select
          id="listing_type"
          name="listing_type"
          required
          className="input"
          value={listingType}
          onChange={(event) => onListingTypeChange(event.currentTarget.value as "colocation" | "studio")}
        >
          {LISTING_TYPE_OPTIONS.map((option) => {
            const optionLabel = option.value === "studio" ? tSearch("studio") : tSearch("colocation");
            return (
              <option key={option.value} value={option.value}>
                {optionLabel}
              </option>
            );
          })}
        </select>
      </div>

      <div className="space-y-2">
        <label className="label" htmlFor="generated-title">
          {t("autoTitle")}
        </label>
        <output id="generated-title" aria-live="polite" className="input block bg-stone-50 text-stone-700">
          {autoTitle}
        </output>
        <p className="text-xs text-stone-500">{t("autoTitleHelp")}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="city">
            {t("commune")}
          </label>
          <select id="city" name="city" required className="input" value={commune} onChange={(event) => onCommuneChange(event.currentTarget.value)}>
            {BRUSSELS_COMMUNES.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="label" htmlFor="neighborhood">
            {t("neighborhood")}
          </label>
          <select
            id="neighborhood"
            name="neighborhood"
            required
            className="input"
            value={neighborhood}
            onChange={(event) => onNeighborhoodChange(event.currentTarget.value)}
          >
            {!neighborhoodOptions.length ? <option value="">{t("noNeighborhoodConfigured")}</option> : null}
            {neighborhoodOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
            {neighborhoodOptions.length ? <option value={OTHER_NEIGHBORHOOD_VALUE}>{t("otherNeighborhood")}</option> : null}
          </select>
        </div>

        {neighborhood === OTHER_NEIGHBORHOOD_VALUE ? (
          <div className="sm:col-span-2">
            <label className="label" htmlFor="neighborhood_custom">
              {t("customNeighborhood")}
            </label>
            <input
              id="neighborhood_custom"
              name="neighborhood_custom"
              required
              className="input"
              placeholder={t("customNeighborhoodPlaceholder")}
              value={customNeighborhood}
              onChange={(event) => onCustomNeighborhoodChange(event.currentTarget.value)}
            />
          </div>
        ) : null}

        {listingType === "colocation" ? (
          <>
            <div>
              <label className="label" htmlFor="available_rooms">
                {t("availableRooms")}
              </label>
              <input
                id="available_rooms"
                name="available_rooms"
                type="number"
                min={minRooms}
                max={maxRooms}
                required
                className="input"
                value={availableRooms}
                onChange={(event) => onAvailableRoomsChange(event.currentTarget.value)}
              />
            </div>

            <div>
              <label className="label" htmlFor="total_rooms">
                {t("totalRooms")}
              </label>
              <input
                id="total_rooms"
                name="total_rooms"
                type="number"
                min={minRooms}
                max={maxRooms}
                required
                className="input"
                value={totalRooms}
                onChange={(event) => onTotalRoomsChange(event.currentTarget.value)}
              />
            </div>
          </>
        ) : (
          <>
            <input type="hidden" name="available_rooms" value={1} />
            <input type="hidden" name="total_rooms" value={1} />
            <div className="sm:col-span-2">
              <p className="rounded-lg border border-stone-200 bg-stone-50 px-3 py-2 text-sm text-stone-700">
                {t("studioHint")}
              </p>
            </div>
          </>
        )}

        <div>
          <label className="label" htmlFor="available_from">
            {t("availability")}
          </label>
          <input id="available_from" name="available_from" type="date" required className="input" defaultValue={initialAvailableFrom} />
        </div>
      </div>
    </>
  );
}

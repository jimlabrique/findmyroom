"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import {
  BRUSSELS_COMMUNES,
  getNeighborhoodsForCommune,
  OTHER_NEIGHBORHOOD_LABEL,
  OTHER_NEIGHBORHOOD_VALUE,
} from "@/lib/listing-form-options";

type SearchCommuneNeighborhoodFieldsProps = {
  initialCity: string;
  initialNeighborhood: string;
  customCity: string | null;
};

const ALL_BRUSSELS_VALUE = "Bruxelles";

export function SearchCommuneNeighborhoodFields({
  initialCity,
  initialNeighborhood,
  customCity,
}: SearchCommuneNeighborhoodFieldsProps) {
  const t = useTranslations("listings.search");
  const [city, setCity] = useState(initialCity || ALL_BRUSSELS_VALUE);
  const [neighborhood, setNeighborhood] = useState(initialNeighborhood);

  const neighborhoodOptions = useMemo(
    () => (city === ALL_BRUSSELS_VALUE ? [] : getNeighborhoodsForCommune(city)),
    [city],
  );

  function handleCityChange(nextCity: string) {
    setCity(nextCity);
    setNeighborhood("");
  }

  return (
    <>
      <div className="sm:col-span-2 xl:col-span-2">
        <label htmlFor="city" className="label">
          {t("commune")}
        </label>
        <select id="city" name="city" className="input" value={city} onChange={(event) => handleCityChange(event.currentTarget.value)}>
          <option value={ALL_BRUSSELS_VALUE}>{t("allBrusselsCommunes")}</option>
          {customCity ? <option value={customCity}>{customCity}</option> : null}
          {BRUSSELS_COMMUNES.map((commune) => (
            <option key={commune} value={commune}>
              {commune}
            </option>
          ))}
        </select>
      </div>

      <div className="sm:col-span-2 xl:col-span-2">
        <label htmlFor="neighborhood" className="label">
          {t("neighborhood")}
        </label>
        <select
          id="neighborhood"
          name="neighborhood"
          className="input"
          value={neighborhood}
          onChange={(event) => setNeighborhood(event.currentTarget.value)}
          disabled={!neighborhoodOptions.length}
        >
          <option value="">{neighborhoodOptions.length ? t("allNeighborhoods") : t("chooseCommuneFirst")}</option>
          {!neighborhoodOptions.includes(neighborhood) &&
          neighborhood &&
          neighborhood !== OTHER_NEIGHBORHOOD_VALUE ? (
            <option value={neighborhood}>{neighborhood}</option>
          ) : null}
          {neighborhoodOptions.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
          {neighborhoodOptions.length ? <option value={OTHER_NEIGHBORHOOD_VALUE}>{OTHER_NEIGHBORHOOD_LABEL}</option> : null}
        </select>
      </div>
    </>
  );
}

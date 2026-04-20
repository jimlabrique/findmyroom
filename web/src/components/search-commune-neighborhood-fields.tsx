"use client";

import { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  getLocalizedCommuneLabel,
  getLocalizedCommuneOptions,
  getLocalizedNeighborhoodLabel,
  getNeighborhoodsForCommune,
  OTHER_NEIGHBORHOOD_VALUE,
} from "@/lib/listing-form-options";
import type { AppLocale } from "@/lib/i18n/locales";

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
  const tBasics = useTranslations("createBasics");
  const locale = useLocale() as AppLocale;
  const [city, setCity] = useState(initialCity || ALL_BRUSSELS_VALUE);
  const [neighborhood, setNeighborhood] = useState(initialNeighborhood);
  const communeOptions = getLocalizedCommuneOptions(locale);

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
          {customCity ? <option value={customCity}>{getLocalizedCommuneLabel(customCity, locale)}</option> : null}
          {communeOptions.map((commune) => (
            <option key={commune.value} value={commune.value}>
              {commune.label}
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
            <option value={neighborhood}>{getLocalizedNeighborhoodLabel(city, neighborhood, locale)}</option>
          ) : null}
          {neighborhoodOptions.map((option) => (
            <option key={option} value={option}>
              {getLocalizedNeighborhoodLabel(city, option, locale)}
            </option>
          ))}
          {neighborhoodOptions.length ? <option value={OTHER_NEIGHBORHOOD_VALUE}>{tBasics("otherNeighborhood")}</option> : null}
        </select>
      </div>
    </>
  );
}

"use client";

import { useTranslations } from "next-intl";

type Option = {
  value: string;
  label: string;
};

type CommonSpacesFieldsProps = {
  listingType: "colocation" | "studio";
  options: readonly Option[];
  selectedValues: string[];
  otherValue: string;
  onToggle: (value: string, checked: boolean) => void;
  onOtherChange: (value: string) => void;
};

export function CommonSpacesFields({
  listingType,
  options,
  selectedValues,
  otherValue,
  onToggle,
  onOtherChange,
}: CommonSpacesFieldsProps) {
  const t = useTranslations("createBasics");

  return (
    <div className="space-y-3">
      <p className="label m-0">{listingType === "studio" ? t("commonSpacesStudio") : t("commonSpacesColocation")}</p>
      <div className="grid gap-2 sm:grid-cols-2 text-sm text-stone-700">
        {options.map((option) => (
          <label key={option.value} className="inline-flex items-center gap-2">
            <input
              type="checkbox"
              name="common_spaces"
              value={option.value}
              checked={selectedValues.includes(option.value)}
              onChange={(event) => onToggle(option.value, event.currentTarget.checked)}
            />
            {option.label}
          </label>
        ))}
      </div>
      <div>
        <label className="label" htmlFor="common_spaces_other">
          {t("commonSpacesOther")}
        </label>
        <input
          id="common_spaces_other"
          name="common_spaces_other"
          className="input"
          placeholder={t("commonSpacesOtherPlaceholder")}
          value={otherValue}
          onChange={(event) => onOtherChange(event.currentTarget.value)}
        />
      </div>
    </div>
  );
}

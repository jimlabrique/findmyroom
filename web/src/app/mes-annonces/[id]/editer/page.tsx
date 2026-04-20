import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { deleteListingPhotoAction, updateListingAction } from "@/app/mes-annonces/actions";
import { requireUser } from "@/lib/auth";
import { getListingByIdForOwner } from "@/lib/data/listings";
import {
  listingCandidatePreferenceFromFlatshareVibe,
  listingNeighborhoodFromHousingDescription,
  listingPhotosFromRow,
  listingRoomDetailsFromRow,
} from "@/lib/listing";
import { PhotoFields } from "@/components/photo-fields";
import { humanizeAppError } from "@/lib/errors";
import { CreateListingBasics } from "@/components/create-listing-basics";
import type { AppLocale } from "@/lib/i18n/locales";
import { withLocalePath } from "@/lib/i18n/pathname";
import {
  ANIMALS_POLICY_OPTIONS,
  AREA_CONTEXT_OPTIONS,
  CANDIDATE_GENDER_PREFERENCE_OPTIONS,
  COMMON_SPACES_COLOCATION_OPTIONS,
  COMMON_SPACES_STUDIO_OPTIONS,
  CURRENT_FLATMATES_OPTIONS,
  TRANSPORT_MODE_OPTIONS,
  VIBE_TAG_OPTIONS,
} from "@/lib/listing-form-options";

type EditListingPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function normalizeText(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function readLineValue(source: string, linePattern: RegExp, prefixPattern: RegExp) {
  const line = source.split(/\r?\n/).find((item) => linePattern.test(item));
  if (!line) return null;
  const value = line.replace(prefixPattern, "").trim();
  if (!value || normalizeText(value) === "non precise") return null;
  return value;
}

function labelsToOptionValues(csvLabels: string | null, options: readonly { value: string; label: string }[]) {
  if (!csvLabels) return [];
  const labels = csvLabels
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  const normalizedOptionMap = new Map(options.map((option) => [normalizeText(option.label), option.value] as const));
  const values = labels
    .map((label) => normalizedOptionMap.get(normalizeText(label)))
    .filter((value): value is string => Boolean(value));
  return Array.from(new Set(values));
}

function labelToOptionValue(
  label: string | null,
  options: readonly { value: string; label: string }[],
  fallback: string,
) {
  if (!label) return fallback;
  const found = options.find((option) => normalizeText(option.label) === normalizeText(label));
  return found?.value ?? fallback;
}

function extractExtraHousingDetails(source: string) {
  const lines = source.split(/\r?\n/);
  const startIndex = lines.findIndex((line) => /^\s*infos compl[ée]mentaires\s*:/i.test(line));
  if (startIndex < 0) return "";
  return lines
    .slice(startIndex + 1)
    .join("\n")
    .trim();
}

export const dynamic = "force-dynamic";

export default async function EditListingPage({ params, searchParams }: EditListingPageProps) {
  const locale = (await getLocale()) as AppLocale;
  const tEdit = await getTranslations("edit");
  const tForm = await getTranslations("listingForm");
  const tMyListings = await getTranslations("myListings");
  const { id } = await params;
  const { user } = await requireUser(withLocalePath(`/mes-annonces/${id}/editer`, locale));
  const listing = await getListingByIdForOwner(id, user.id);
  const query = await searchParams;
  const errorCode = typeof query.error === "string" ? query.error : null;
  const error = humanizeAppError(errorCode, locale);

  if (!listing) {
    notFound();
  }

  const existingPhotos = listingPhotosFromRow(listing);
  const accountEmail = user.email ?? "—";

  const roomDetails = listingRoomDetailsFromRow(listing);
  const roomDrafts =
    roomDetails.length > 0
      ? roomDetails.map((room) => ({
          size_sqm: `${room.size_sqm}`,
          price_eur: `${room.price_eur}`,
          furnishing: room.furnishing,
          bathroom: room.bathroom,
          outdoor: room.outdoor,
          view: room.view,
        }))
      : [
          {
            size_sqm: "",
            price_eur: `${listing.rent_eur}`,
            furnishing: "furnished",
            bathroom: "shared",
            outdoor: "none",
            view: "street",
          },
        ];

  const housingDescription = listing.housing_description ?? "";
  const flatshareVibe = listing.flatshare_vibe ?? "";
  const listingType = listing.listing_type ?? "colocation";
  const neighborhood = listingNeighborhoodFromHousingDescription(housingDescription) ?? "";
  const transportModes = labelsToOptionValues(
    readLineValue(
      housingDescription,
      /^\s*proche des transports en commun\s*:/i,
      /^\s*proche des transports en commun\s*:\s*/i,
    ),
    TRANSPORT_MODE_OPTIONS,
  );
  const transportLines =
    readLineValue(housingDescription, /^\s*lignes\s*:/i, /^\s*lignes\s*:\s*/i) ?? "";
  const areaContexts = labelsToOptionValues(
    readLineValue(housingDescription, /^\s*environnement\s*:/i, /^\s*environnement\s*:\s*/i),
    AREA_CONTEXT_OPTIONS,
  );
  const commonSpacesLine =
    readLineValue(
      housingDescription,
      /^\s*(parties communes|[ée]quipements\s*\/\s*parties communes)\s*:/i,
      /^\s*(parties communes|[ée]quipements\s*\/\s*parties communes)\s*:\s*/i,
    ) ?? "";
  const commonSpaces = labelsToOptionValues(
    commonSpacesLine,
    listingType === "studio" ? COMMON_SPACES_STUDIO_OPTIONS : COMMON_SPACES_COLOCATION_OPTIONS,
  );
  const commonSpacesOther =
    readLineValue(housingDescription, /^\s*autre\s*\(parties communes\)\s*:/i, /^\s*autre\s*\(parties communes\)\s*:\s*/i) ??
    "";
  const housingDescriptionExtra = extractExtraHousingDetails(housingDescription);
  const vibeTags = labelsToOptionValues(
    readLineValue(flatshareVibe, /^\s*ambiance\s*:/i, /^\s*ambiance\s*:\s*/i),
    VIBE_TAG_OPTIONS,
  );
  const flatshareVibeOther =
    readLineValue(flatshareVibe, /^\s*autre\s*:/i, /^\s*autre\s*:\s*/i) ?? "";
  const candidateGenderPreference = labelToOptionValue(
    listingCandidatePreferenceFromFlatshareVibe(flatshareVibe),
    CANDIDATE_GENDER_PREFERENCE_OPTIONS,
    "non_precise",
  );

  return (
    <div className="container-page max-w-3xl space-y-6">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-widest text-stone-500">{tEdit("tag")}</p>
        <h1 className="font-serif text-4xl text-stone-900">{tEdit("title")}</h1>
      </header>

      {error ? (
        <p className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {tMyListings("errorPrefix")}: {error}
        </p>
      ) : null}

      <form action={updateListingAction} className="panel space-y-6 p-6">
        <input type="hidden" name="listing_id" value={listing.id} />

        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-stone-900">{tForm("mainInfo")}</h2>
          <CreateListingBasics
            initialValues={{
              listingType,
              commune: listing.city,
              neighborhood,
              availableRooms: listing.available_rooms,
              totalRooms: listing.total_rooms,
              availableFrom: listing.available_from,
              roomDrafts,
              commonSpaces,
              commonSpacesOther,
            }}
          />
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-stone-900">{tForm("conditions")}</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="label" htmlFor="charges_eur">
                {tForm("charges")}
              </label>
              <input id="charges_eur" name="charges_eur" type="number" min={0} className="input" defaultValue={listing.charges_eur ?? ""} />
            </div>
            <div>
              <label className="label" htmlFor="lease_type">
                {tForm("leaseType")}
              </label>
              <input
                id="lease_type"
                name="lease_type"
                className="input"
                placeholder={tForm("leaseTypePlaceholder")}
                defaultValue={listing.lease_type ?? ""}
              />
            </div>
            <div>
              <label className="label" htmlFor="min_duration_months">
                {tForm("minimumDuration")}
              </label>
              <input
                id="min_duration_months"
                name="min_duration_months"
                type="number"
                min={0}
                className="input"
                defaultValue={listing.min_duration_months ?? ""}
              />
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-stone-900">{tForm("housingDescription")}</h2>
          <div className="space-y-4">
            <div>
              <p className="label m-0">{tForm("transportNearby")}</p>
              <div className="mt-2 flex flex-wrap gap-4 text-sm text-stone-700">
                {TRANSPORT_MODE_OPTIONS.map((option) => (
                  <label key={option.value} className="inline-flex items-center gap-2">
                    <input type="checkbox" name="transport_modes" value={option.value} defaultChecked={transportModes.includes(option.value)} />
                    {option.label}
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="label" htmlFor="transport_lines">
                {tForm("transportLines")}
              </label>
              <input
                id="transport_lines"
                name="transport_lines"
                className="input"
                placeholder={tForm("transportLinesPlaceholder")}
                defaultValue={transportLines}
              />
            </div>

            <div>
              <p className="label m-0">{tForm("environment")}</p>
              <div className="mt-2 grid gap-2 sm:grid-cols-2 text-sm text-stone-700">
                {AREA_CONTEXT_OPTIONS.map((option) => (
                  <label key={option.value} className="inline-flex items-center gap-2">
                    <input type="checkbox" name="area_contexts" value={option.value} defaultChecked={areaContexts.includes(option.value)} />
                    {option.label}
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="label" htmlFor="housing_description_extra">
                {tForm("extraInfo")}
              </label>
              <textarea
                id="housing_description_extra"
                name="housing_description_extra"
                rows={4}
                className="input"
                placeholder={tForm("extraInfoPlaceholder")}
                defaultValue={housingDescriptionExtra}
              />
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-stone-900">{tForm("vibeAndProfile")}</h2>
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label" htmlFor="animals_policy">
                  {tForm("animalsAllowed")}
                </label>
                <select
                  id="animals_policy"
                  name="animals_policy"
                  required
                  className="input"
                  defaultValue={listing.animals_policy ?? "negotiable"}
                >
                  {ANIMALS_POLICY_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label" htmlFor="current_flatmates">
                  {tForm("flatshareType")}
                </label>
                <select id="current_flatmates" name="current_flatmates" className="input" defaultValue={listing.current_flatmates ?? "mixte"}>
                  {CURRENT_FLATMATES_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label" htmlFor="candidate_gender_preference">
                  {tForm("profileSearched")}
                </label>
                <select
                  id="candidate_gender_preference"
                  name="candidate_gender_preference"
                  className="input"
                  defaultValue={candidateGenderPreference}
                >
                  {CANDIDATE_GENDER_PREFERENCE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid gap-2 sm:grid-cols-2 text-sm text-stone-700">
              {VIBE_TAG_OPTIONS.map((option) => (
                <label key={option.value} className="inline-flex items-center gap-2">
                  <input type="checkbox" name="vibe_tags" value={option.value} defaultChecked={vibeTags.includes(option.value)} />
                  {option.label}
                </label>
              ))}
            </div>
            <div>
              <label className="label" htmlFor="flatshare_vibe_other">
                {tForm("other")}
              </label>
              <textarea
                id="flatshare_vibe_other"
                name="flatshare_vibe_other"
                rows={3}
                className="input"
                placeholder={tForm("otherPlaceholder")}
                defaultValue={flatshareVibeOther}
              />
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-stone-900">{tForm("photosAndContact")}</h2>
          <div className="space-y-4">
            <PhotoFields
              mode="edit"
              existingPhotos={existingPhotos}
              listingId={listing.id}
              deletePhotoAction={deleteListingPhotoAction}
            />
            <div className="space-y-2">
              <p className="label m-0">{tForm("contactEmailAuto")}</p>
              <p className="rounded-lg border border-stone-200 bg-stone-50 px-3 py-2 text-sm text-stone-700">
                {accountEmail}
              </p>
              <p className="text-xs text-stone-500">{tForm("contactEmailHelp")}</p>
            </div>
            <div>
              <label className="label" htmlFor="contact_whatsapp">
                {tForm("whatsappOptional")}
              </label>
              <input id="contact_whatsapp" name="contact_whatsapp" className="input" defaultValue={listing.contact_whatsapp ?? ""} />
              <p className="mt-1 text-xs text-stone-500">{tForm("whatsappHelp")}</p>
            </div>
          </div>
        </section>

        <div className="flex justify-end">
          <button type="submit" className="btn btn-primary">
            {tEdit("save")}
          </button>
        </div>
      </form>
    </div>
  );
}

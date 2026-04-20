import { createListingAction } from "@/app/deposer/actions";
import { getLocale, getTranslations } from "next-intl/server";
import { requireUser } from "@/lib/auth";
import { PhotoFields } from "@/components/photo-fields";
import { humanizeAppError } from "@/lib/errors";
import { CreateListingBasics } from "@/components/create-listing-basics";
import type { AppLocale } from "@/lib/i18n/locales";
import { withLocalePath } from "@/lib/i18n/pathname";
import {
  ANIMALS_POLICY_OPTIONS,
  AREA_CONTEXT_OPTIONS,
  CANDIDATE_GENDER_PREFERENCE_OPTIONS,
  CURRENT_FLATMATES_OPTIONS,
  TRANSPORT_MODE_OPTIONS,
  VIBE_TAG_OPTIONS,
} from "@/lib/listing-form-options";

type DeposerPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export const dynamic = "force-dynamic";

export default async function DeposerPage({ searchParams }: DeposerPageProps) {
  const locale = (await getLocale()) as AppLocale;
  const tCreate = await getTranslations("create");
  const tForm = await getTranslations("listingForm");
  const tMyListings = await getTranslations("myListings");
  const { user } = await requireUser(withLocalePath("/deposer", locale));
  const query = await searchParams;
  const errorCode = typeof query.error === "string" ? query.error : null;
  const error = humanizeAppError(errorCode, locale);
  const accountEmail = user.email ?? "—";

  return (
    <div className="container-page max-w-3xl space-y-6">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-widest text-stone-500">{tCreate("tag")}</p>
        <h1 className="font-serif text-4xl text-stone-900">{tCreate("title")}</h1>
        <p className="text-stone-700">{tCreate("subtitle")}</p>
      </header>

      {error ? (
        <p className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {tMyListings("errorPrefix")}: {error}
        </p>
      ) : null}

      <form action={createListingAction} className="panel space-y-6 p-6">
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-stone-900">{tForm("mainInfo")}</h2>
          <CreateListingBasics />
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-stone-900">{tForm("conditions")}</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="label" htmlFor="charges_eur">
                {tForm("charges")}
              </label>
              <input id="charges_eur" name="charges_eur" type="number" min={0} className="input" />
            </div>
            <div>
              <label className="label" htmlFor="lease_type">
                {tForm("leaseType")}
              </label>
              <input id="lease_type" name="lease_type" className="input" placeholder={tForm("leaseTypePlaceholder")} />
            </div>
            <div>
              <label className="label" htmlFor="min_duration_months">
                {tForm("minimumDuration")}
              </label>
              <input id="min_duration_months" name="min_duration_months" type="number" min={0} className="input" />
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
                    <input type="checkbox" name="transport_modes" value={option.value} />
                    {option.label}
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="label" htmlFor="transport_lines">
                {tForm("transportLines")}
              </label>
              <input id="transport_lines" name="transport_lines" className="input" placeholder={tForm("transportLinesPlaceholder")} />
            </div>

            <div>
              <p className="label m-0">{tForm("environment")}</p>
              <div className="mt-2 grid gap-2 sm:grid-cols-2 text-sm text-stone-700">
                {AREA_CONTEXT_OPTIONS.map((option) => (
                  <label key={option.value} className="inline-flex items-center gap-2">
                    <input type="checkbox" name="area_contexts" value={option.value} />
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
                <select id="animals_policy" name="animals_policy" required className="input" defaultValue="negotiable">
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
                <select id="current_flatmates" name="current_flatmates" className="input" defaultValue="mixte">
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
                  defaultValue="non_precise"
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
                  <input type="checkbox" name="vibe_tags" value={option.value} />
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
              />
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-stone-900">{tForm("photosAndContact")}</h2>
          <div className="space-y-4">
            <PhotoFields mode="create" />
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
              <input id="contact_whatsapp" name="contact_whatsapp" className="input" placeholder={tForm("whatsappPlaceholder")} />
              <p className="mt-1 text-xs text-stone-500">{tForm("whatsappHelp")}</p>
            </div>
          </div>
        </section>

        <div className="flex items-center justify-end gap-3">
          <button type="submit" className="btn btn-primary">
            {tCreate("publish")}
          </button>
        </div>
      </form>
    </div>
  );
}

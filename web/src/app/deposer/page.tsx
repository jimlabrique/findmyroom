import { createListingAction } from "@/app/deposer/actions";
import { requireUser } from "@/lib/auth";
import { PhotoFields } from "@/components/photo-fields";
import { humanizeAppError } from "@/lib/errors";
import { CreateListingBasics } from "@/components/create-listing-basics";
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
  const { user } = await requireUser("/deposer");
  const query = await searchParams;
  const errorCode = typeof query.error === "string" ? query.error : null;
  const error = humanizeAppError(errorCode);
  const accountEmail = user.email ?? "Email du compte indisponible";

  return (
    <div className="container-page max-w-3xl space-y-6">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-widest text-stone-500">Dépôt d&apos;annonce</p>
        <h1 className="font-serif text-4xl text-stone-900">Publier une chambre en quelques minutes</h1>
        <p className="text-stone-700">Renseigne l&apos;essentiel d&apos;abord, puis ajoute les options si tu veux.</p>
      </header>

      {error ? (
        <p className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Erreur: {error}
        </p>
      ) : null}

      <form action={createListingAction} className="panel space-y-6 p-6">
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-stone-900">Infos principales</h2>
          <CreateListingBasics />
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-stone-900">Conditions</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="label" htmlFor="charges_eur">
                Charges
              </label>
              <input id="charges_eur" name="charges_eur" type="number" min={0} className="input" />
            </div>
            <div>
              <label className="label" htmlFor="lease_type">
                Type de bail
              </label>
              <input id="lease_type" name="lease_type" className="input" placeholder="Bail 1 an" />
            </div>
            <div>
              <label className="label" htmlFor="min_duration_months">
                Durée min (mois)
              </label>
              <input id="min_duration_months" name="min_duration_months" type="number" min={0} className="input" />
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-stone-900">Description du logement</h2>
          <div className="space-y-4">
            <div>
              <p className="label m-0">Proche des transports en commun</p>
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
                Lignes (bus, tram, métro)
              </label>
              <input id="transport_lines" name="transport_lines" className="input" placeholder="Ex: 2, 6, 81, 95" />
            </div>

            <div>
              <p className="label m-0">Environnement</p>
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
                Infos complémentaires
              </label>
              <textarea
                id="housing_description_extra"
                name="housing_description_extra"
                rows={4}
                className="input"
                placeholder="Ce que les candidats doivent savoir sur le bien"
              />
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-stone-900">Ambiance et profil du bien</h2>
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label" htmlFor="animals_policy">
                  Animaux autorisés
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
                  Type de coloc
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
                  Profil recherché
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
                Autre
              </label>
              <textarea
                id="flatshare_vibe_other"
                name="flatshare_vibe_other"
                rows={3}
                className="input"
                placeholder="Ajoute des détails libres si besoin"
              />
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-stone-900">Photos et contact</h2>
          <div className="space-y-4">
            <PhotoFields mode="create" />
            <div className="space-y-2">
              <p className="label m-0">Email de contact (automatique)</p>
              <p className="rounded-lg border border-stone-200 bg-stone-50 px-3 py-2 text-sm text-stone-700">
                {accountEmail}
              </p>
              <p className="text-xs text-stone-500">Les candidats peuvent toujours te contacter par email sur cette adresse.</p>
            </div>
            <div>
              <label className="label" htmlFor="contact_whatsapp">
                Numéro WhatsApp (optionnel)
              </label>
              <input id="contact_whatsapp" name="contact_whatsapp" className="input" placeholder="+324..." />
              <p className="mt-1 text-xs text-stone-500">Laisse vide si tu ne veux pas être contacté sur WhatsApp.</p>
            </div>
          </div>
        </section>

        <div className="flex items-center justify-end gap-3">
          <button type="submit" className="btn btn-primary">
            Publier l&apos;annonce
          </button>
        </div>
      </form>
    </div>
  );
}

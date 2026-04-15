import { notFound } from "next/navigation";
import { deleteListingPhotoAction, updateListingAction } from "@/app/mes-annonces/actions";
import { requireUser } from "@/lib/auth";
import { getListingByIdForOwner } from "@/lib/data/listings";
import { listingPhotosFromRow } from "@/lib/listing";
import { PhotoFields } from "@/components/photo-fields";
import { humanizeAppError } from "@/lib/errors";

type EditListingPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export const dynamic = "force-dynamic";

export default async function EditListingPage({ params, searchParams }: EditListingPageProps) {
  const { id } = await params;
  const { user } = await requireUser(`/mes-annonces/${id}/editer`);
  const listing = await getListingByIdForOwner(id, user.id);
  const query = await searchParams;
  const errorCode = typeof query.error === "string" ? query.error : null;
  const error = humanizeAppError(errorCode);

  if (!listing) {
    notFound();
  }

  const existingPhotos = listingPhotosFromRow(listing);
  const hasPhoneContact = Boolean(listing.contact_whatsapp);
  const hasEmailContact = Boolean(listing.contact_email);

  return (
    <div className="container-page max-w-3xl space-y-6">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-widest text-stone-500">Edition</p>
        <h1 className="font-serif text-4xl text-stone-900">Modifier l&apos;annonce</h1>
      </header>

      {error ? (
        <p className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Erreur: {error}
        </p>
      ) : null}

      <form action={updateListingAction} className="panel space-y-6 p-6">
        <input type="hidden" name="listing_id" value={listing.id} />

        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-stone-900">Infos principales</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="label" htmlFor="title">
                Titre
              </label>
              <input id="title" name="title" required className="input" defaultValue={listing.title} />
            </div>
            <div>
              <label className="label" htmlFor="city">
                Commune
              </label>
              <input id="city" name="city" required className="input" defaultValue={listing.city} />
            </div>
            <div>
              <label className="label" htmlFor="available_from">
                Disponibilite
              </label>
              <input
                id="available_from"
                name="available_from"
                type="date"
                required
                className="input"
                defaultValue={listing.available_from}
              />
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-stone-900">Prix et capacite</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="label" htmlFor="rent_eur">
                Loyer (EUR)
              </label>
              <input
                id="rent_eur"
                name="rent_eur"
                type="number"
                min={1}
                required
                className="input"
                defaultValue={listing.rent_eur}
              />
            </div>
            <div>
              <label className="label" htmlFor="charges_eur">
                Charges (optionnel)
              </label>
              <input
                id="charges_eur"
                name="charges_eur"
                type="number"
                min={0}
                className="input"
                defaultValue={listing.charges_eur ?? ""}
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
                min={1}
                required
                className="input"
                defaultValue={listing.available_rooms}
              />
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-stone-900">Description</h2>
          <div className="space-y-4">
            <div>
              <label className="label" htmlFor="housing_description">
                Description du logement
              </label>
              <textarea
                id="housing_description"
                name="housing_description"
                required
                rows={5}
                className="input"
                defaultValue={listing.housing_description}
              />
            </div>
            <div>
              <label className="label" htmlFor="flatshare_vibe">
                Ambiance de la coloc
              </label>
              <textarea
                id="flatshare_vibe"
                name="flatshare_vibe"
                required
                rows={4}
                className="input"
                defaultValue={listing.flatshare_vibe}
              />
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-stone-900">Photos et contact</h2>
          <div className="space-y-4">
            <PhotoFields
              mode="edit"
              existingPhotos={existingPhotos}
              listingId={listing.id}
              deletePhotoAction={deleteListingPhotoAction}
            />
            <div className="space-y-2">
              <p className="label m-0">Moyens de contact</p>
              <div className="flex flex-wrap gap-4 text-sm text-stone-700">
                <label className="inline-flex items-center gap-2">
                  <input
                    type="checkbox"
                    name="contact_methods"
                    value="email"
                    defaultChecked={hasEmailContact || !hasPhoneContact}
                  />
                  Email
                </label>
                <label className="inline-flex items-center gap-2">
                  <input type="checkbox" name="contact_methods" value="phone" defaultChecked={hasPhoneContact} />
                  Telephone (WhatsApp)
                </label>
              </div>
              <p className="text-xs text-stone-500">Choisis au moins un moyen de contact.</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label" htmlFor="contact_whatsapp">
                  Numero WhatsApp (si coche)
                </label>
                <input
                  id="contact_whatsapp"
                  name="contact_whatsapp"
                  className="input"
                  defaultValue={listing.contact_whatsapp ?? ""}
                />
              </div>
              <div>
                <label className="label" htmlFor="contact_email">
                  Email (si coche)
                </label>
                <input
                  id="contact_email"
                  name="contact_email"
                  type="email"
                  className="input"
                  defaultValue={listing.contact_email ?? ""}
                />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label" htmlFor="lease_type">
                  Type de bail (optionnel)
                </label>
                <input id="lease_type" name="lease_type" className="input" defaultValue={listing.lease_type ?? ""} />
              </div>
              <div>
                <label className="label" htmlFor="min_duration_months">
                  Duree min (mois, optionnel)
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
          </div>
        </section>

        <div className="flex justify-end">
          <button type="submit" className="btn btn-primary">
            Sauvegarder
          </button>
        </div>
      </form>
    </div>
  );
}

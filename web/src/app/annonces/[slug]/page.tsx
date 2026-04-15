import Link from "next/link";
import { notFound } from "next/navigation";
import { getListingBySlug, searchListings } from "@/lib/data/listings";
import { trackListingEvent } from "@/lib/data/listing-events";
import { getListingContactOptions, listingPhotosFromRow } from "@/lib/listing";
import { ListingCard } from "@/components/listing-card";

type ListingDetailPageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export const dynamic = "force-dynamic";

export default async function ListingDetailPage({ params, searchParams }: ListingDetailPageProps) {
  const { slug } = await params;
  const query = await searchParams;
  const listing = await getListingBySlug(slug);

  if (!listing) {
    notFound();
  }

  const created = query.created === "1";
  const emailSent = query.email_sent === "1";
  const errorCode = typeof query.error === "string" ? query.error : null;
  const retryAfterRaw = typeof query.retry_after === "string" ? Number.parseInt(query.retry_after, 10) : NaN;
  const retryAfterSeconds = Number.isFinite(retryAfterRaw) ? Math.max(1, retryAfterRaw) : 30;
  const errorMessage =
    errorCode === "contact_missing"
      ? "Ce logement n'a pas encore de contact configure."
      : errorCode === "contact_method_invalid"
        ? "Ce moyen de contact n'est pas disponible pour cette annonce."
        : errorCode === "email_form_missing"
          ? "Complete tous les champs du formulaire email."
        : errorCode === "email_form_invalid"
          ? "Adresse email invalide."
          : errorCode === "email_form_invalid_method"
            ? "Le formulaire email doit etre envoye depuis le bouton."
            : errorCode === "email_service_unavailable"
              ? "Envoi email non configure cote serveur. Ajoute les variables SMTP."
              : errorCode === "email_auth_failed"
                ? "Connexion SMTP refusee. Verifie SMTP_USER/SMTP_PASS (mot de passe d'application)."
                : errorCode === "email_rate_limited"
                  ? `Attends ${retryAfterSeconds}s avant de renvoyer un email.`
              : errorCode === "email_send_failed"
                ? "Impossible d'envoyer l'email pour le moment."
        : null;
  const contactOptions = getListingContactOptions(listing);
  const phoneContactOption = contactOptions.find((option) => option.method === "phone");
  const hasEmailContact = contactOptions.some((option) => option.method === "email");
  const photos = listingPhotosFromRow(listing);
  const similarListings = (await searchListings({ city: listing.city, sort: "latest" }))
    .filter((item) => item.id !== listing.id)
    .slice(0, 3);

  await trackListingEvent({
    listingId: listing.id,
    eventType: "view_listing",
    source: "listing_detail_page",
  });

  return (
    <div className="container-page space-y-6">
      {created ? (
        <p className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          Annonce publiee. Elle est maintenant visible dans la recherche.
        </p>
      ) : null}
      {emailSent ? (
        <p className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          Demande envoyee a l&apos;annonceur.
        </p>
      ) : null}
      {errorMessage ? (
        <p className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">Erreur: {errorMessage}</p>
      ) : null}

      <section className="grid gap-6 lg:grid-cols-[1.4fr_0.8fr]">
        <div className="space-y-4">
          <div className="panel overflow-hidden">
            <div className="grid gap-2 p-2 sm:grid-cols-2">
              {photos.map((photo, index) => (
                <figure key={`${photo.url}-${index}`} className={index === 0 ? "sm:col-span-2" : ""}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={photo.url}
                    alt={photo.caption || `${listing.title} - photo ${index + 1}`}
                    className={`h-full w-full rounded-lg object-cover ${
                      index === 0 ? "aspect-[16/10]" : "aspect-[4/3]"
                    }`}
                  />
                  {photo.caption ? (
                    <figcaption className="mt-1 text-xs text-stone-600">{photo.caption}</figcaption>
                  ) : null}
                </figure>
              ))}
            </div>
          </div>

          <article className="panel space-y-4 p-5">
            <h1 className="font-serif text-3xl text-stone-900">{listing.title}</h1>
            <div className="grid gap-3 text-sm text-stone-700 sm:grid-cols-2">
              <p>
                <span className="font-semibold">Commune:</span> {listing.city}
              </p>
              <p>
                <span className="font-semibold">Loyer:</span> {listing.rent_eur} EUR / mois
              </p>
              <p>
                <span className="font-semibold">Chambres dispo:</span> {listing.available_rooms}
              </p>
              <p>
                <span className="font-semibold">Disponibilite:</span> {listing.available_from}
              </p>
              {listing.charges_eur !== null ? (
                <p>
                  <span className="font-semibold">Charges:</span> {listing.charges_eur} EUR
                </p>
              ) : null}
              {listing.min_duration_months !== null ? (
                <p>
                  <span className="font-semibold">Duree min:</span> {listing.min_duration_months} mois
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <h2 className="text-lg font-semibold text-stone-900">Description du logement</h2>
              <p className="whitespace-pre-line text-stone-700">{listing.housing_description}</p>
            </div>

            <div className="space-y-2">
              <h2 className="text-lg font-semibold text-stone-900">Ambiance de la coloc</h2>
              <p className="whitespace-pre-line text-stone-700">{listing.flatshare_vibe}</p>
            </div>
          </article>
        </div>

        <aside className="panel h-fit space-y-4 p-5 lg:sticky lg:top-8">
          <p className="text-xs font-semibold uppercase tracking-widest text-stone-500">Contact</p>
          <p className="text-sm text-stone-700">
            Contacte directement l&apos;annonceur pour organiser un echange ou une visite.
          </p>
          <div className="space-y-3">
            {phoneContactOption ? (
              <a
                href={`/annonces/${listing.slug}/contacter?method=phone`}
                target="_blank"
                rel="noreferrer"
                className="btn btn-primary w-full"
              >
                {phoneContactOption.label}
              </a>
            ) : null}

            {hasEmailContact ? (
              <form
                action={`/annonces/${listing.slug}/contacter/email`}
                method="post"
                className="space-y-2 rounded-xl border border-stone-200 bg-stone-50 p-3"
              >
                <p className="text-sm font-semibold text-stone-900">Envoyer un email</p>
                <div className="grid gap-2 sm:grid-cols-2">
                  <input
                    name="first_name"
                    className="input"
                    placeholder="Prenom"
                    required
                    maxLength={80}
                  />
                  <input
                    name="last_name"
                    className="input"
                    placeholder="Nom"
                    required
                    maxLength={80}
                  />
                </div>
                <input
                  type="email"
                  name="sender_email"
                  className="input"
                  placeholder="Ton email"
                  required
                  maxLength={200}
                />
                <textarea
                  name="message"
                  className="input"
                  placeholder="Ton message"
                  rows={4}
                  required
                  maxLength={2000}
                />
                <div
                  aria-hidden="true"
                  style={{
                    position: "absolute",
                    left: "-9999px",
                    width: 0,
                    height: 0,
                    overflow: "hidden",
                  }}
                >
                  <label htmlFor={`website-${listing.id}`}>Website</label>
                  <input
                    id={`website-${listing.id}`}
                    name="website"
                    type="text"
                    tabIndex={-1}
                    autoComplete="off"
                    defaultValue=""
                  />
                </div>
                <button type="submit" className="btn btn-ghost w-full">
                  Envoyer par email
                </button>
              </form>
            ) : null}
          </div>
          <p className="text-xs text-stone-500">
            Moyens disponibles: {contactOptions.map((option) => option.channelLabel).join(", ") || "Aucun"}
          </p>
          <Link href="/annonces" className="btn btn-ghost w-full">
            Retour a la recherche
          </Link>
        </aside>
      </section>

      {similarListings.length ? (
        <section className="space-y-4">
          <h2 className="font-serif text-2xl text-stone-900">Annonces similaires a {listing.city}</h2>
          <div className="grid-listings">
            {similarListings.map((item) => (
              <ListingCard key={item.id} listing={item} />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}

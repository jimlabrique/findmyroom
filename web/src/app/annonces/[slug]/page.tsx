import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { getListingBySlug, searchListings } from "@/lib/data/listings";
import { trackListingEvent } from "@/lib/data/listing-events";
import {
  getListingContactOptions,
  listingDisplayTitle,
  listingAnimalsPolicyLabel,
  listingCandidatePreferenceFromFlatshareVibe,
  listingCurrentFlatmatesLabel,
  localizeFlatshareVibeText,
  localizeHousingDescriptionText,
  listingPhotosFromRow,
  listingPriceRangeLabel,
  listingRoomDetailsFromRow,
  listingRoomsSummary,
  listingTypeLabel,
} from "@/lib/listing";
import type { AppLocale } from "@/lib/i18n/locales";
import { withLocalePath } from "@/lib/i18n/pathname";
import { ListingCard } from "@/components/listing-card";
import { getLocalizedCommuneLabel } from "@/lib/listing-form-options";

type ListingDetailPageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export const dynamic = "force-dynamic";

export default async function ListingDetailPage({ params, searchParams }: ListingDetailPageProps) {
  const locale = (await getLocale()) as AppLocale;
  const t = await getTranslations("detail");
  const tErrors = await getTranslations("errors");
  const tCommon = await getTranslations("common.actions");
  const tAuth = await getTranslations("auth");
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
      ? tErrors("contact_missing")
      : errorCode === "contact_method_invalid"
        ? tErrors("contact_method_invalid")
        : errorCode === "email_form_missing"
          ? tErrors("email_form_missing")
        : errorCode === "email_form_invalid"
          ? tErrors("email_form_invalid")
          : errorCode === "email_form_invalid_method"
            ? tErrors("email_form_invalid_method")
            : errorCode === "untrusted_origin"
              ? tErrors("untrusted_origin")
            : errorCode === "email_service_unavailable"
              ? tErrors("email_service_unavailable")
              : errorCode === "email_auth_failed"
                ? tErrors("email_auth_failed")
                : errorCode === "email_rate_limited"
                  ? tErrors("email_rate_limited", { seconds: retryAfterSeconds })
              : errorCode === "email_send_failed"
                ? tErrors("email_send_failed")
        : null;
  const contactOptions = getListingContactOptions(listing, locale);
  const phoneContactOption = contactOptions.find((option) => option.method === "phone");
  const hasEmailContact = contactOptions.some((option) => option.method === "email");
  const photos = listingPhotosFromRow(listing);
  const roomDetails = listingRoomDetailsFromRow(listing);
  const animalsPolicy = listingAnimalsPolicyLabel(listing.animals_policy, locale);
  const flatmatesLabel = listingCurrentFlatmatesLabel(listing.current_flatmates, locale);
  const candidatePreferenceLabel = listingCandidatePreferenceFromFlatshareVibe(listing.flatshare_vibe, locale);
  const furnishingLabels =
    locale === "en"
      ? new Map([
          ["furnished", "Furnished"],
          ["unfurnished", "Unfurnished"],
          ["partially_furnished", "Partially furnished"],
        ])
      : locale === "nl"
        ? new Map([
            ["furnished", "Gemeubileerd"],
            ["unfurnished", "Niet gemeubileerd"],
            ["partially_furnished", "Deels gemeubileerd"],
          ])
        : new Map([
            ["furnished", "Meublé"],
            ["unfurnished", "Non meublé"],
            ["partially_furnished", "Partiellement meublé"],
          ]);
  const bathroomLabels =
    locale === "en"
      ? new Map([
          ["private", "Private"],
          ["shared", "Shared"],
        ])
      : locale === "nl"
        ? new Map([
            ["private", "Privé"],
            ["shared", "Gedeeld"],
          ])
        : new Map([
            ["private", "Privative"],
            ["shared", "Partagée"],
          ]);
  const outdoorLabels =
    locale === "en"
      ? new Map([
          ["none", "None"],
          ["balcony", "Balcony"],
          ["terrace", "Terrace"],
          ["garden", "Garden"],
        ])
      : locale === "nl"
        ? new Map([
            ["none", "Geen"],
            ["balcony", "Balkon"],
            ["terrace", "Terras"],
            ["garden", "Tuin"],
          ])
        : new Map([
            ["none", "Aucun"],
            ["balcony", "Balcon"],
            ["terrace", "Terrasse"],
            ["garden", "Jardin"],
          ]);
  const viewLabels =
    locale === "en"
      ? new Map([
          ["garden", "Garden"],
          ["courtyard", "Courtyard"],
          ["street", "Street"],
          ["other", "Other"],
        ])
      : locale === "nl"
        ? new Map([
            ["garden", "Tuin"],
            ["courtyard", "Binnenplaats"],
            ["street", "Straat"],
            ["other", "Andere"],
          ])
        : new Map([
            ["garden", "Jardin"],
            ["courtyard", "Cour"],
            ["street", "Rue"],
            ["other", "Autre"],
          ]);
  const similarListings = (await searchListings({ city: listing.city, sort: "latest" }))
    .filter((item) => item.id !== listing.id)
    .slice(0, 3);
  const displayTitle = listingDisplayTitle(listing, locale);
  const displayCity = getLocalizedCommuneLabel(listing.city, locale);
  const localizedHousingDescription = localizeHousingDescriptionText(listing.housing_description, locale, listing.city);
  const localizedFlatshareVibe = localizeFlatshareVibeText(listing.flatshare_vibe, locale);

  await trackListingEvent({
    listingId: listing.id,
    eventType: "view_listing",
    source: "listing_detail_page",
  });

  return (
    <div className="container-page space-y-6">
      {created ? (
        <p className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {t("created")}
        </p>
      ) : null}
      {emailSent ? (
        <p className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {t("emailSent")}
        </p>
      ) : null}
      {errorMessage ? (
        <p className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {tAuth("errorPrefix")}: {errorMessage}
        </p>
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
                    alt={photo.caption || `${displayTitle} - photo ${index + 1}`}
                    className={`aspect-[16/9] h-full w-full rounded-lg object-cover ${
                      index === 0 ? "sm:aspect-[16/10]" : "sm:aspect-[4/3]"
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
              <h1 className="break-words font-serif text-3xl text-stone-900">{displayTitle}</h1>
              <div className="grid gap-3 text-sm text-stone-700 sm:grid-cols-2">
                <p>
                  <span className="font-semibold">{t("labels.commune")}:</span> {displayCity}
                </p>
                <p>
                  <span className="font-semibold">{t("labels.type")}:</span> {listingTypeLabel(listing.listing_type, locale)}
                </p>
                <p>
                  <span className="font-semibold">{t("labels.rent")}:</span> {listingPriceRangeLabel(listing, locale)}
                </p>
                <p>
                  <span className="font-semibold">{t("labels.rooms")}:</span> {listingRoomsSummary(listing, locale)}
                </p>
                <p>
                  <span className="font-semibold">{t("labels.availability")}:</span> {listing.available_from}
                </p>
                {animalsPolicy ? (
                  <p>
                    <span className="font-semibold">{t("labels.animals")}:</span> {animalsPolicy}
                  </p>
                ) : null}
                {flatmatesLabel ? (
                  <p>
                    <span className="font-semibold">{t("labels.flatshareType")}:</span> {flatmatesLabel}
                  </p>
                ) : null}
                {candidatePreferenceLabel ? (
                  <p>
                    <span className="font-semibold">{t("labels.profile")}:</span> {candidatePreferenceLabel}
                  </p>
                ) : null}
                {listing.charges_eur !== null ? (
                  <p>
                    <span className="font-semibold">{t("labels.charges")}:</span> {listing.charges_eur} EUR
                  </p>
                ) : null}
                {listing.min_duration_months !== null ? (
                  <p>
                    <span className="font-semibold">{t("labels.minimumDuration")}:</span>{" "}
                    {t("monthsSuffix", { count: listing.min_duration_months })}
                  </p>
                ) : null}
              </div>

            {roomDetails.length ? (
              <div className="space-y-2">
                <h2 className="text-lg font-semibold text-stone-900">{t("roomTableTitle")}</h2>
                <div className="space-y-2 md:hidden">
                  {roomDetails.map((room) => (
                    <article key={`room-mobile-${room.index}`} className="rounded-xl border border-stone-200 bg-stone-50 p-3">
                      <p className="text-sm font-semibold text-stone-900">{t("roomLabel", { index: room.index })}</p>
                      <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-sm text-stone-700">
                        <dt className="font-medium text-stone-500">{t("roomHeaderSize")}</dt>
                        <dd className="text-right">{room.size_sqm}m2</dd>
                        <dt className="font-medium text-stone-500">{t("roomHeaderPrice")}</dt>
                        <dd className="text-right">{t("pricePerMonthSuffix", { value: room.price_eur })}</dd>
                        <dt className="font-medium text-stone-500">{t("roomHeaderFurnishing")}</dt>
                        <dd className="text-right">{furnishingLabels.get(room.furnishing) ?? room.furnishing}</dd>
                        <dt className="font-medium text-stone-500">{t("roomHeaderBathroom")}</dt>
                        <dd className="text-right">{bathroomLabels.get(room.bathroom) ?? room.bathroom}</dd>
                        <dt className="font-medium text-stone-500">{t("roomHeaderOutdoor")}</dt>
                        <dd className="text-right">{outdoorLabels.get(room.outdoor) ?? room.outdoor}</dd>
                        <dt className="font-medium text-stone-500">{t("roomHeaderView")}</dt>
                        <dd className="text-right">{viewLabels.get(room.view) ?? room.view}</dd>
                      </dl>
                    </article>
                  ))}
                </div>
                <div className="hidden overflow-x-auto rounded-xl border border-stone-200 md:block">
                  <table className="min-w-full text-sm">
                    <thead className="bg-stone-50 text-left text-stone-600">
                      <tr>
                        <th className="px-3 py-2 font-medium">{t("roomHeaderRoom")}</th>
                        <th className="px-3 py-2 font-medium">{t("roomHeaderSize")}</th>
                        <th className="px-3 py-2 font-medium">{t("roomHeaderPrice")}</th>
                        <th className="px-3 py-2 font-medium">{t("roomHeaderFurnishing")}</th>
                        <th className="px-3 py-2 font-medium">{t("roomHeaderBathroom")}</th>
                        <th className="px-3 py-2 font-medium">{t("roomHeaderOutdoor")}</th>
                        <th className="px-3 py-2 font-medium">{t("roomHeaderView")}</th>
                      </tr>
                    </thead>
                    <tbody className="text-stone-800">
                      {roomDetails.map((room) => (
                        <tr key={`room-${room.index}`} className="border-t border-stone-100">
                          <td className="px-3 py-2">{t("roomLabel", { index: room.index })}</td>
                          <td className="px-3 py-2">{room.size_sqm}m2</td>
                          <td className="px-3 py-2">{t("pricePerMonthSuffix", { value: room.price_eur })}</td>
                          <td className="px-3 py-2">{furnishingLabels.get(room.furnishing) ?? room.furnishing}</td>
                          <td className="px-3 py-2">{bathroomLabels.get(room.bathroom) ?? room.bathroom}</td>
                          <td className="px-3 py-2">{outdoorLabels.get(room.outdoor) ?? room.outdoor}</td>
                          <td className="px-3 py-2">{viewLabels.get(room.view) ?? room.view}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : null}

            <div className="space-y-2">
              <h2 className="text-lg font-semibold text-stone-900">{t("housingTitle")}</h2>
              <p className="whitespace-pre-line text-stone-700">{localizedHousingDescription}</p>
            </div>

            <div className="space-y-2">
              <h2 className="text-lg font-semibold text-stone-900">
                {listing.listing_type === "studio" ? t("studioInfoTitle") : t("flatshareInfoTitle")}
              </h2>
              <p className="whitespace-pre-line text-stone-700">{localizedFlatshareVibe}</p>
            </div>
          </article>
        </div>

        <aside className="panel h-fit space-y-4 p-5 lg:sticky lg:top-8">
          <p className="text-xs font-semibold uppercase tracking-widest text-stone-500">{t("contactTitle")}</p>
          <p className="text-sm text-stone-700">
            {t("contactDescription")}
          </p>
          <div className="space-y-3">
            {phoneContactOption ? (
              <a
                href={withLocalePath(`/annonces/${listing.slug}/contacter?method=phone`, locale)}
                target="_blank"
                rel="noreferrer"
                className="btn btn-primary w-full"
              >
                {phoneContactOption.label}
              </a>
            ) : null}

            {hasEmailContact ? (
              <form
                action={withLocalePath(`/annonces/${listing.slug}/contacter/email`, locale)}
                method="post"
                className="space-y-2 rounded-xl border border-stone-200 bg-stone-50 p-3"
              >
                <p className="text-sm font-semibold text-stone-900">{t("sendEmail")}</p>
                <div className="grid gap-2 sm:grid-cols-2">
                  <input
                    name="first_name"
                    className="input"
                    placeholder={t("firstName")}
                    required
                    maxLength={80}
                  />
                  <input
                    name="last_name"
                    className="input"
                    placeholder={t("lastName")}
                    required
                    maxLength={80}
                  />
                </div>
                <input
                  type="email"
                  name="sender_email"
                  className="input"
                  placeholder={t("yourEmail")}
                  required
                  maxLength={200}
                />
                <textarea
                  name="message"
                  className="input"
                  placeholder={t("yourMessage")}
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
                  {t("sendByEmail")}
                </button>
              </form>
            ) : null}
          </div>
          <p className="text-xs text-stone-500">
            {t("availableChannels", {
              channels: contactOptions.map((option) => option.channelLabel).join(", ") || t("noChannel"),
            })}
          </p>
          <Link href={withLocalePath("/annonces", locale)} className="btn btn-ghost w-full">
            {tCommon("retourRecherche")}
          </Link>
        </aside>
      </section>

      {similarListings.length ? (
        <section className="space-y-4">
          <h2 className="font-serif text-2xl text-stone-900">{t("similarListingsIn", { city: displayCity })}</h2>
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

"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";

type ListingCardCarouselProps = {
  photos: string[];
  title: string;
  href: string;
};

const FALLBACK_PHOTO = "/logo.png";

export function ListingCardCarousel({ photos, title, href }: ListingCardCarouselProps) {
  const t = useTranslations("listings.search");
  const normalizedPhotos = useMemo(() => {
    const clean = photos.map((photo) => photo.trim()).filter((photo) => photo.length > 0);
    return clean.length ? clean : [FALLBACK_PHOTO];
  }, [photos]);
  const [index, setIndex] = useState(0);

  const photoCount = normalizedPhotos.length;
  const activePhoto = normalizedPhotos[index] ?? normalizedPhotos[0];

  function showPreviousPhoto() {
    setIndex((current) => (current - 1 + photoCount) % photoCount);
  }

  function showNextPhoto() {
    setIndex((current) => (current + 1) % photoCount);
  }

  return (
    <div className="relative aspect-[16/9] w-full overflow-hidden bg-stone-100 sm:aspect-auto sm:min-h-[220px]">
      <Link href={href} className="block h-full">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={activePhoto} alt={title} className="h-full w-full object-cover" />
      </Link>

      {photoCount > 1 ? (
        <>
          <button
            type="button"
            onClick={showPreviousPhoto}
            className="absolute left-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-lg font-semibold text-stone-800 shadow-sm hover:bg-white"
            aria-label={t("previousPhoto")}
          >
            ‹
          </button>
          <button
            type="button"
            onClick={showNextPhoto}
            className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-lg font-semibold text-stone-800 shadow-sm hover:bg-white"
            aria-label={t("nextPhoto")}
          >
            ›
          </button>
          <div className="absolute bottom-2 right-2 rounded-full bg-stone-900/80 px-2 py-1 text-xs font-medium text-white">
            {index + 1}/{photoCount}
          </div>
        </>
      ) : null}
    </div>
  );
}

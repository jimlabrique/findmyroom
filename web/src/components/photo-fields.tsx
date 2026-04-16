"use client";

import { startTransition, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { ListingPhoto } from "@/lib/listing";

type PhotoFieldsProps = {
  mode: "create" | "edit";
  existingPhotos?: ListingPhoto[];
  listingId?: string;
  deletePhotoAction?: (
    formData: FormData,
  ) => Promise<{ ok: true } | { ok: false; error: string }>;
};

type SlotPhoto = {
  id: string;
  fileName: string;
  previewUrl: string;
  caption: string;
};

type UploadSlot = {
  id: string;
  photos: SlotPhoto[];
};

const MAX_NEW_PHOTOS = 10;

export function PhotoFields({ mode, existingPhotos = [], listingId, deletePhotoAction }: PhotoFieldsProps) {
  const router = useRouter();
  const slotCounterRef = useRef(1);
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const latestSlotsRef = useRef<UploadSlot[]>([{ id: "slot-0", photos: [] }]);
  const [uploadSlots, setUploadSlots] = useState<UploadSlot[]>([{ id: "slot-0", photos: [] }]);
  const [deletingPhotoUrl, setDeletingPhotoUrl] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);

  function nextSlotId() {
    const id = `slot-${slotCounterRef.current}`;
    slotCounterRef.current += 1;
    return id;
  }

  function totalSelectedPhotos(slots: UploadSlot[]) {
    return slots.reduce((sum, slot) => sum + slot.photos.length, 0);
  }

  function revokePhotoPreviews(photos: SlotPhoto[]) {
    for (const photo of photos) {
      URL.revokeObjectURL(photo.previewUrl);
    }
  }

  function normalizeSlots(slots: UploadSlot[]) {
    const nonEmptySlots = slots.filter((slot) => slot.photos.length > 0);
    const total = totalSelectedPhotos(nonEmptySlots);

    if (total >= MAX_NEW_PHOTOS) {
      return nonEmptySlots;
    }

    return [...nonEmptySlots, { id: nextSlotId(), photos: [] }];
  }

  function clearSlot(slotId: string) {
    const fileInput = fileInputRefs.current[slotId];
    if (fileInput) {
      fileInput.value = "";
    }
    const slotToClear = uploadSlots.find((slot) => slot.id === slotId);
    if (slotToClear?.photos.length) {
      revokePhotoPreviews(slotToClear.photos);
    }

    setPhotoError(null);
    setUploadSlots((prev) => normalizeSlots(prev.map((slot) => (slot.id === slotId ? { ...slot, photos: [] } : slot))));
  }

  function onSlotFilesChange(slotId: string, files: FileList | null) {
    const selectedFiles = Array.from(files ?? []).filter((file) => file.size > 0);
    const currentSlot = uploadSlots.find((slot) => slot.id === slotId);
    const selectedWithoutCurrent = totalSelectedPhotos(uploadSlots) - (currentSlot?.photos.length ?? 0);

    if (selectedWithoutCurrent + selectedFiles.length > MAX_NEW_PHOTOS) {
      const fileInput = fileInputRefs.current[slotId];
      if (fileInput) {
        fileInput.value = "";
      }
      setPhotoError(`Maximum ${MAX_NEW_PHOTOS} photos.`);
      return;
    }

    const nextPhotos = selectedFiles.map((file, index) => ({
      id: `${slotId}-${file.name}-${file.lastModified}-${index}`,
      fileName: file.name,
      previewUrl: URL.createObjectURL(file),
      caption: "",
    }));

    if (currentSlot?.photos.length) {
      revokePhotoPreviews(currentSlot.photos);
    }

    setPhotoError(null);
    setUploadSlots((prev) => normalizeSlots(prev.map((slot) => (slot.id === slotId ? { ...slot, photos: nextPhotos } : slot))));
  }

  function onCaptionChange(slotId: string, photoId: string, caption: string) {
    setUploadSlots((prev) =>
      prev.map((slot) =>
        slot.id === slotId
          ? {
              ...slot,
              photos: slot.photos.map((photo) => (photo.id === photoId ? { ...photo, caption } : photo)),
            }
          : slot,
      ),
    );
  }

  function handleDeletePhoto(photoUrl: string) {
    if (!deletePhotoAction || !listingId) return;

    const formData = new FormData();
    formData.set("listing_id", listingId);
    formData.set("delete_photo_url", photoUrl);
    setDeletingPhotoUrl(photoUrl);
    setDeleteError(null);

    startTransition(() => {
      void deletePhotoAction(formData)
        .then((result) => {
          if (!result.ok) {
            setDeleteError(result.error);
            return;
          }
          router.refresh();
        })
        .finally(() => {
          setDeletingPhotoUrl(null);
        });
    });
  }

  useEffect(() => {
    latestSlotsRef.current = uploadSlots;
  }, [uploadSlots]);

  useEffect(
    () => () => {
      for (const slot of latestSlotsRef.current) {
        if (slot.photos.length) {
          revokePhotoPreviews(slot.photos);
        }
      }
    },
    [],
  );

  return (
    <div className="space-y-5">
      {mode === "edit" ? (
        <div className="space-y-3">
          <p className="label">Photos actuelles</p>
          {existingPhotos.length ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {existingPhotos.map((photo, index) => (
                <div key={`${photo.url}-${index}`} className="rounded-xl border border-stone-200 bg-stone-50 p-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={photo.url}
                    alt={photo.caption || `Photo ${index + 1}`}
                    className="aspect-[4/3] w-full rounded-md object-cover"
                  />
                  <input type="hidden" name="existing_photo_urls" value={photo.url} />

                  <div className="mt-2 space-y-2">
                    <label className="label" htmlFor={`existing-caption-${index}`}>
                      Legende
                    </label>
                    <input
                      id={`existing-caption-${index}`}
                      name="existing_photo_captions"
                      className="input"
                      defaultValue={photo.caption}
                      placeholder="Chambre 1 - 10m2"
                      required
                    />

                    {deletePhotoAction && listingId ? (
                      <button
                        type="button"
                        className="btn btn-ghost"
                        onClick={() => handleDeletePhoto(photo.url)}
                        disabled={deletingPhotoUrl === photo.url}
                      >
                        {deletingPhotoUrl === photo.url ? "Suppression..." : "Supprimer cette photo"}
                      </button>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-stone-600">Aucune photo actuellement.</p>
          )}
        </div>
      ) : null}

      <div className="space-y-3">
        {deleteError ? (
          <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            Erreur suppression photo: {deleteError}
          </p>
        ) : null}

        {photoError ? (
          <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{photoError}</p>
        ) : null}

        <div className="space-y-1">
          <p className="label m-0">{mode === "create" ? "Ajouter les photos" : "Ajouter de nouvelles photos"}</p>
          <p className="text-xs text-stone-500">
            Clique sur un cadre pour ajouter des images. Tu peux aussi en sélectionner plusieurs d&apos;un coup.
          </p>
        </div>

        <div className="space-y-3">
          {uploadSlots.map((slot, slotIndex) => {
            const hasSelection = slot.photos.length > 0;
            const requiresAtLeastOne = (mode === "create" || existingPhotos.length === 0) && totalSelectedPhotos(uploadSlots) === 0;
            return (
              <div key={slot.id} className="rounded-xl border border-stone-200 bg-white p-3">
                <input
                  ref={(node) => {
                    fileInputRefs.current[slot.id] = node;
                  }}
                  id={`photo-file-${slot.id}`}
                  name="photos"
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  multiple
                  className="sr-only"
                  required={requiresAtLeastOne && slotIndex === 0}
                  onChange={(event) => onSlotFilesChange(slot.id, event.currentTarget.files)}
                />

                <label
                  htmlFor={`photo-file-${slot.id}`}
                  className="flex min-h-28 cursor-pointer items-center justify-center rounded-lg border border-dashed border-stone-300 bg-stone-50 px-3 py-4 text-center text-sm font-medium text-stone-700 hover:bg-stone-100"
                >
                  {hasSelection
                    ? `${slot.photos.length} photo(s) sélectionnée(s) - cliquer pour remplacer`
                    : "+ Ajouter une ou plusieurs photos"}
                </label>

                {hasSelection ? (
                  <div className="mt-3 space-y-3">
                    <div className="grid gap-3 sm:grid-cols-2">
                      {slot.photos.map((photo, photoIndex) => (
                        <div key={photo.id} className="rounded-lg border border-stone-200 bg-stone-50 p-2">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={photo.previewUrl} alt={photo.fileName} className="aspect-[4/3] w-full rounded-md object-cover" />
                          <p className="mt-2 truncate text-xs text-stone-600">{photo.fileName}</p>
                          <label className="label mt-2" htmlFor={`photo-caption-${slot.id}-${photo.id}`}>
                            Légende
                          </label>
                          <input
                            id={`photo-caption-${slot.id}-${photo.id}`}
                            name="photo_captions"
                            className="input"
                            placeholder={`Photo ${photoIndex + 1} - exemple: Chambre ${photoIndex + 1} - 10m2`}
                            value={photo.caption}
                            onChange={(event) => onCaptionChange(slot.id, photo.id, event.currentTarget.value)}
                            required
                          />
                        </div>
                      ))}
                    </div>

                    <button type="button" className="btn btn-ghost" onClick={() => clearSlot(slot.id)}>
                      Vider ce cadre
                    </button>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>

        <p className="text-xs text-stone-500">Formats acceptés: JPG, PNG, WEBP, GIF. 10 photos max.</p>
      </div>
    </div>
  );
}

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";
import type { ListingPhoto } from "@/lib/listing";

export const LISTING_PHOTO_BUCKET = "listing-photos";
const MAX_FILES = 10;
const MAX_FILE_BYTES = 8 * 1024 * 1024;
const ALLOWED_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

export type PhotoDraft = { file: File; caption: string };

function cleanCaption(input: FormDataEntryValue | null) {
  return `${input ?? ""}`.trim();
}

function validatePhotoFile(file: File) {
  if (!ALLOWED_MIME_TYPES.has(file.type)) {
    throw new Error("invalid_file_type");
  }
  if (file.size > MAX_FILE_BYTES) {
    throw new Error("file_too_large");
  }
}

export function extractNewListingPhotoDrafts(formData: FormData) {
  const fileEntries = formData.getAll("photos");
  const captionEntries = formData.getAll("photo_captions");
  const drafts: PhotoDraft[] = [];

  for (let index = 0; index < fileEntries.length; index += 1) {
    const entry = fileEntries[index];
    const caption = cleanCaption(captionEntries[index] ?? null);
    if (!(entry instanceof File) || entry.size === 0) {
      continue;
    }

    validatePhotoFile(entry);
    if (!caption) {
      throw new Error("photo_caption_required");
    }

    drafts.push({ file: entry, caption });
  }

  if (drafts.length > MAX_FILES) {
    throw new Error(`too_many_files_max_${MAX_FILES}`);
  }

  return drafts;
}

export function extractExistingListingPhotos(formData: FormData) {
  const urls = formData
    .getAll("existing_photo_urls")
    .map((value) => `${value ?? ""}`.trim())
    .filter((value) => /^https?:\/\//i.test(value));
  const captions = formData.getAll("existing_photo_captions");

  return urls.map((url, index) => {
    const caption = cleanCaption(captions[index] ?? null);
    if (!caption) {
      throw new Error("photo_caption_required");
    }
    return { url, caption };
  });
}

export function splitPhotosForStorage(photos: ListingPhoto[]) {
  const urls: string[] = [];
  const captions: string[] = [];

  for (const photo of photos) {
    urls.push(photo.url);
    captions.push(photo.caption.trim());
  }

  return { urls, captions };
}

function extractStoragePathFromPublicUrl(publicUrl: string) {
  const marker = `/storage/v1/object/public/${LISTING_PHOTO_BUCKET}/`;
  const markerIndex = publicUrl.indexOf(marker);
  if (markerIndex === -1) {
    return null;
  }

  const withPossibleQuery = publicUrl.slice(markerIndex + marker.length);
  const [rawPath] = withPossibleQuery.split("?");
  const decodedPath = decodeURIComponent(rawPath);
  return decodedPath || null;
}

export async function deleteListingPhotoUrls({
  supabase,
  userId,
  urls,
}: {
  supabase: SupabaseClient<Database>;
  userId: string;
  urls: string[];
}) {
  const storagePaths = urls
    .map((url) => extractStoragePathFromPublicUrl(url))
    .filter((path): path is string => Boolean(path))
    .filter((path) => path.split("/")[0] === userId);

  if (!storagePaths.length) {
    return;
  }

  const { error } = await supabase.storage.from(LISTING_PHOTO_BUCKET).remove(storagePaths);
  if (error) {
    throw new Error(`delete_failed_${error.message}`);
  }
}

function safeFileName(originalName: string) {
  const normalized = originalName
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9.-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");

  return normalized || "photo.jpg";
}

export async function uploadListingPhotoFiles({
  supabase,
  userId,
  drafts,
}: {
  supabase: SupabaseClient<Database>;
  userId: string;
  drafts: PhotoDraft[];
}) {
  const uploaded: ListingPhoto[] = [];

  for (const draft of drafts) {
    const { file, caption } = draft;
    const fileName = safeFileName(file.name);
    const path = `${userId}/${Date.now()}-${crypto.randomUUID()}-${fileName}`;

    const { error } = await supabase.storage.from(LISTING_PHOTO_BUCKET).upload(path, file, {
      upsert: false,
      contentType: file.type,
      cacheControl: "3600",
    });

    if (error) {
      const normalizedMessage = `${error.message ?? ""}`.trim().toLowerCase();
      if (normalizedMessage.includes("bucket") && normalizedMessage.includes("not found")) {
        throw new Error("bucket_not_found");
      }
      throw new Error(`upload_failed_${error.message}`);
    }

    const { data } = supabase.storage.from(LISTING_PHOTO_BUCKET).getPublicUrl(path);
    uploaded.push({ url: data.publicUrl, caption });
  }

  return uploaded;
}

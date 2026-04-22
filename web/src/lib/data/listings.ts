import type { SupabaseClient } from "@supabase/supabase-js";
import { unstable_cache } from "next/cache";
import type { Database } from "@/lib/database.types";
import { createServerSupabaseClient, createServerSupabasePublicClient } from "@/lib/supabase/server";
import { listingNeighborhoodFromHousingDescription, listingRoomDetailsFromRow, type Listing } from "@/lib/listing";
import {
  BRUSSELS_COMMUNES,
  isValidNeighborhoodForCommune,
  OTHER_NEIGHBORHOOD_VALUE,
} from "@/lib/listing-form-options";

type ListingFilters = {
  query?: string;
  city?: string;
  neighborhood?: string;
  listingType?: "colocation" | "studio";
  minRent?: number;
  maxRent?: number;
  availableFrom?: string;
  minRooms?: number;
  leaseType?: string;
  maxMinDuration?: number;
  contactMethod?: "phone" | "email";
  animalsPolicy?: "yes" | "no" | "negotiable";
  roomFurnishing?: "furnished" | "unfurnished" | "partially_furnished";
  roomBathroom?: "private" | "shared";
  sort?: "latest" | "price_asc" | "price_desc" | "available_asc";
};

const BRUSSELS_COMMUNES_NORMALIZED = new Set(BRUSSELS_COMMUNES.map((city) => normalizeText(city)));

function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

function isMissingExpiresAtColumn(message: string) {
  return /expires_at/i.test(message) && /column/i.test(message);
}

function isMissingListingTypeColumn(message: string) {
  return /listing_type/i.test(message) && /column/i.test(message);
}

function normalizeText(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function isBrusselsRegionQuery(value: string) {
  const normalized = normalizeText(value);
  return (
    normalized === "bruxelles" ||
    normalized === "brussels" ||
    normalized === "bruxelles ville" ||
    normalized === "region bruxelles"
  );
}

function escapeIlikeInput(value: string) {
  return value.replace(/[\\%_]/g, "\\$&");
}

function isBrusselsCommune(city: string) {
  const normalized = normalizeText(city);
  return BRUSSELS_COMMUNES_NORMALIZED.has(normalized) || normalized === "bruxelles";
}

function hasText(value: string | null | undefined) {
  return typeof value === "string" && value.trim().length > 0;
}

function buildLatestListingsQuery(supabase: SupabaseClient<Database>, limit: number, includeExpiresAt: boolean) {
  let query = supabase.from("listings").select("*").eq("status", "active");
  if (includeExpiresAt) {
    query = query.gte("expires_at", todayIsoDate());
  }
  return query.order("created_at", { ascending: false }).limit(limit);
}

function buildSearchListingsQuery(
  supabase: SupabaseClient<Database>,
  filters: ListingFilters,
  includeExpiresAt: boolean,
) {
  let query = supabase.from("listings").select("*").eq("status", "active");
  if (includeExpiresAt) {
    query = query.gte("expires_at", todayIsoDate());
  }

  if (filters.city && !isBrusselsRegionQuery(filters.city)) {
    query = query.ilike("city", `%${escapeIlikeInput(filters.city)}%`);
  }

  if (filters.listingType) {
    query = query.eq("listing_type", filters.listingType);
  }

  if (filters.minRent) {
    query = query.gte("rent_eur", filters.minRent);
  }

  if (filters.maxRent) {
    query = query.lte("rent_eur", filters.maxRent);
  }

  if (filters.availableFrom) {
    query = query.lte("available_from", filters.availableFrom);
  }

  if (filters.minRooms) {
    query = query.gte("available_rooms", filters.minRooms);
  }

  if (filters.sort === "price_asc") {
    query = query.order("rent_eur", { ascending: true }).order("created_at", { ascending: false });
  } else if (filters.sort === "price_desc") {
    query = query.order("rent_eur", { ascending: false }).order("created_at", { ascending: false });
  } else if (filters.sort === "available_asc") {
    query = query.order("available_from", { ascending: true }).order("created_at", { ascending: false });
  } else {
    query = query.order("created_at", { ascending: false });
  }

  return query.limit(200);
}

function applyPostFilters(rows: Listing[], filters: ListingFilters) {
  let filtered = rows;

  if (filters.city && isBrusselsRegionQuery(filters.city)) {
    filtered = filtered.filter((listing) => isBrusselsCommune(listing.city));
  }

  if (filters.query) {
    const needle = normalizeText(filters.query);
    filtered = filtered.filter((listing) => {
      const haystack = normalizeText(
        [listing.title, listing.city, listing.housing_description, listing.flatshare_vibe].join(" "),
      );
      return haystack.includes(needle);
    });
  }

  if (filters.neighborhood) {
    if (filters.neighborhood === OTHER_NEIGHBORHOOD_VALUE) {
      filtered = filtered.filter((listing) => {
        const listingNeighborhood = listingNeighborhoodFromHousingDescription(listing.housing_description);
        if (!listingNeighborhood) return false;
        return !isValidNeighborhoodForCommune(listing.city, listingNeighborhood);
      });
    } else {
      const normalizedNeighborhood = normalizeText(filters.neighborhood);
      filtered = filtered.filter((listing) => {
        const listingNeighborhood = listingNeighborhoodFromHousingDescription(listing.housing_description);
        return listingNeighborhood ? normalizeText(listingNeighborhood) === normalizedNeighborhood : false;
      });
    }
  }

  if (filters.leaseType) {
    const needle = normalizeText(filters.leaseType);
    filtered = filtered.filter((listing) => normalizeText(listing.lease_type ?? "").includes(needle));
  }

  if (filters.maxMinDuration) {
    const maxDuration = filters.maxMinDuration;
    filtered = filtered.filter(
      (listing) => listing.min_duration_months === null || listing.min_duration_months <= maxDuration,
    );
  }

  if (filters.contactMethod === "email") {
    filtered = filtered.filter((listing) => hasText(listing.contact_email));
  } else if (filters.contactMethod === "phone") {
    filtered = filtered.filter((listing) => hasText(listing.contact_whatsapp));
  }

  if (filters.animalsPolicy) {
    filtered = filtered.filter((listing) => listing.animals_policy === filters.animalsPolicy);
  }

  if (filters.roomFurnishing) {
    filtered = filtered.filter((listing) =>
      listingRoomDetailsFromRow(listing).some((room) => room.furnishing === filters.roomFurnishing),
    );
  }

  if (filters.roomBathroom) {
    filtered = filtered.filter((listing) =>
      listingRoomDetailsFromRow(listing).some((room) => room.bathroom === filters.roomBathroom),
    );
  }

  return filtered;
}

export async function getLatestListings(limit = 8) {
  const supabase = await createServerSupabaseClient();
  let { data, error } = await buildLatestListingsQuery(supabase, limit, true);

  if (error && isMissingExpiresAtColumn(error.message)) {
    const retry = await buildLatestListingsQuery(supabase, limit, false);
    data = retry.data;
    error = retry.error;
  }

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as Listing[];
}

type SearchListingsCacheInput = {
  query: string | null;
  city: string | null;
  neighborhood: string | null;
  listingType: "colocation" | "studio" | null;
  minRent: number | null;
  maxRent: number | null;
  availableFrom: string | null;
  minRooms: number | null;
  leaseType: string | null;
  maxMinDuration: number | null;
  contactMethod: "phone" | "email" | null;
  animalsPolicy: "yes" | "no" | "negotiable" | null;
  roomFurnishing: "furnished" | "unfurnished" | "partially_furnished" | null;
  roomBathroom: "private" | "shared" | null;
  sort: "latest" | "price_asc" | "price_desc" | "available_asc" | null;
};

function buildSearchListingsCacheInput(filters: ListingFilters): SearchListingsCacheInput {
  return {
    query: filters.query ?? null,
    city: filters.city ?? null,
    neighborhood: filters.neighborhood ?? null,
    listingType: filters.listingType ?? null,
    minRent: filters.minRent ?? null,
    maxRent: filters.maxRent ?? null,
    availableFrom: filters.availableFrom ?? null,
    minRooms: filters.minRooms ?? null,
    leaseType: filters.leaseType ?? null,
    maxMinDuration: filters.maxMinDuration ?? null,
    contactMethod: filters.contactMethod ?? null,
    animalsPolicy: filters.animalsPolicy ?? null,
    roomFurnishing: filters.roomFurnishing ?? null,
    roomBathroom: filters.roomBathroom ?? null,
    sort: filters.sort ?? null,
  };
}

function searchListingsFromCacheInput(input: SearchListingsCacheInput): ListingFilters {
  return {
    query: input.query ?? undefined,
    city: input.city ?? undefined,
    neighborhood: input.neighborhood ?? undefined,
    listingType: input.listingType ?? undefined,
    minRent: input.minRent ?? undefined,
    maxRent: input.maxRent ?? undefined,
    availableFrom: input.availableFrom ?? undefined,
    minRooms: input.minRooms ?? undefined,
    leaseType: input.leaseType ?? undefined,
    maxMinDuration: input.maxMinDuration ?? undefined,
    contactMethod: input.contactMethod ?? undefined,
    animalsPolicy: input.animalsPolicy ?? undefined,
    roomFurnishing: input.roomFurnishing ?? undefined,
    roomBathroom: input.roomBathroom ?? undefined,
    sort: input.sort ?? undefined,
  };
}

const searchListingsCached = unstable_cache(
  async (serializedFilters: string) => {
    const cacheInput = JSON.parse(serializedFilters) as SearchListingsCacheInput;
    const filters = searchListingsFromCacheInput(cacheInput);
    const supabase = createServerSupabasePublicClient();
    let { data, error } = await buildSearchListingsQuery(supabase, filters, true);

    if (error && isMissingExpiresAtColumn(error.message)) {
      const retry = await buildSearchListingsQuery(supabase, filters, false);
      data = retry.data;
      error = retry.error;
    }

    if (error && isMissingListingTypeColumn(error.message)) {
      const retry = await buildSearchListingsQuery(supabase, { ...filters, listingType: undefined }, true);
      data = retry.data;
      error = retry.error;

      if (error && isMissingExpiresAtColumn(error.message)) {
        const legacyRetry = await buildSearchListingsQuery(supabase, { ...filters, listingType: undefined }, false);
        data = legacyRetry.data;
        error = legacyRetry.error;
      }
    }

    if (error) {
      throw new Error(error.message);
    }

    return applyPostFilters((data ?? []) as Listing[], filters);
  },
  ["search_listings_v2"],
  { revalidate: 20 },
);

export async function searchListings(filters: ListingFilters) {
  const cacheInput = buildSearchListingsCacheInput(filters);
  return searchListingsCached(JSON.stringify(cacheInput));
}

export async function getListingBySlug(slug: string) {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.from("listings").select("*").eq("slug", slug).single();

  if (error) {
    return null;
  }

  const listing = data as Listing;
  const rawExpiresAt = (data as { expires_at?: unknown }).expires_at;
  const expiresAt = typeof rawExpiresAt === "string" ? rawExpiresAt : null;
  const isPubliclyVisible = listing.status === "active" && (!expiresAt || expiresAt >= todayIsoDate());
  if (isPubliclyVisible) {
    return listing;
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user && user.id === listing.user_id) {
    return listing;
  }

  return null;
}

export async function getListingByIdForOwner(id: string, userId: string) {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("listings")
    .select("*")
    .eq("id", id)
    .eq("user_id", userId)
    .single();

  if (error) {
    return null;
  }

  return data as Listing;
}

export async function getOwnerListings(userId: string): Promise<Listing[]> {
  const supabase = await createServerSupabaseClient();
  let { data, error } = await supabase
    .from("listings")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error && isMissingExpiresAtColumn(error.message)) {
    const retry = await supabase
      .from("listings")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    data = retry.data;
    error = retry.error;
  }

  if (error) {
    throw new Error(error.message);
  }

  const rows = (data ?? []) as Listing[];
  const today = todayIsoDate();
  const expiredActiveIds = rows
    .filter((listing) => listing.status === "active" && listing.expires_at < today)
    .map((listing) => listing.id);

  if (expiredActiveIds.length) {
    const { error: archiveError } = await supabase
      .from("listings")
      .update({ status: "archived" })
      .in("id", expiredActiveIds)
      .eq("user_id", userId)
      .eq("status", "active");

    if (!archiveError) {
      return rows.map((listing) =>
        expiredActiveIds.includes(listing.id)
          ? {
              ...listing,
              status: "archived" as const,
            }
          : listing,
      ) as Listing[];
    }
  }

  return rows;
}

export async function getAllListingsForAdmin(): Promise<Listing[]> {
  const supabase = await createServerSupabaseClient();
  let { data, error } = await supabase.from("listings").select("*").order("created_at", { ascending: false });

  if (error && isMissingExpiresAtColumn(error.message)) {
    const retry = await supabase.from("listings").select("*").order("created_at", { ascending: false });
    data = retry.data;
    error = retry.error;
  }

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as Listing[];
}

export async function generateUniqueSlug(
  supabase: SupabaseClient<Database>,
  baseSlug: string,
  maxAttempts = 50,
) {
  for (let i = 0; i < maxAttempts; i += 1) {
    const candidate = i === 0 ? baseSlug : `${baseSlug}-${i}`;
    const { data, error } = await supabase.from("listings").select("id").eq("slug", candidate).maybeSingle();
    if (error) {
      throw new Error(error.message);
    }
    if (!data) {
      return candidate;
    }
  }

  return `${baseSlug}-${Date.now()}`;
}

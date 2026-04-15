import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { Listing } from "@/lib/listing";
import { BRUSSELS_COMMUNES } from "@/lib/listing-form-options";

type ListingFilters = {
  query?: string;
  city?: string;
  minRent?: number;
  maxRent?: number;
  availableFrom?: string;
  minRooms?: number;
  leaseType?: string;
  maxMinDuration?: number;
  contactMethod?: "phone" | "email";
  sort?: "latest" | "price_asc" | "price_desc" | "available_asc";
};

const BRUSSELS_COMMUNES_NORMALIZED = new Set(BRUSSELS_COMMUNES.map((city) => normalizeText(city)));

function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

function isMissingExpiresAtColumn(message: string) {
  return /expires_at/i.test(message) && /column/i.test(message);
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
  return BRUSSELS_COMMUNES_NORMALIZED.has(normalizeText(city));
}

function hasText(value: string | null | undefined) {
  return typeof value === "string" && value.trim().length > 0;
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

  return filtered;
}

export async function getLatestListings(limit = 8) {
  const supabase = await createServerSupabaseClient();
  const today = todayIsoDate();
  let { data, error } = await supabase
    .from("listings")
    .select("*")
    .eq("status", "active")
    .gte("expires_at", today)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error && isMissingExpiresAtColumn(error.message)) {
    const retry = await supabase
      .from("listings")
      .select("*")
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(limit);
    data = retry.data;
    error = retry.error;
  }

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as Listing[];
}

export async function searchListings(filters: ListingFilters) {
  const supabase = await createServerSupabaseClient();
  const today = todayIsoDate();
  let query = supabase.from("listings").select("*").eq("status", "active").gte("expires_at", today);

  if (filters.city) {
    if (!isBrusselsRegionQuery(filters.city)) {
      query = query.ilike("city", `%${escapeIlikeInput(filters.city)}%`);
    }
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

  let { data, error } = await query;
  if (error && isMissingExpiresAtColumn(error.message)) {
    let legacyQuery = supabase.from("listings").select("*").eq("status", "active");

    if (filters.city) {
      if (!isBrusselsRegionQuery(filters.city)) {
        legacyQuery = legacyQuery.ilike("city", `%${escapeIlikeInput(filters.city)}%`);
      }
    }

    if (filters.minRent) {
      legacyQuery = legacyQuery.gte("rent_eur", filters.minRent);
    }

    if (filters.maxRent) {
      legacyQuery = legacyQuery.lte("rent_eur", filters.maxRent);
    }

    if (filters.availableFrom) {
      legacyQuery = legacyQuery.lte("available_from", filters.availableFrom);
    }

    if (filters.minRooms) {
      legacyQuery = legacyQuery.gte("available_rooms", filters.minRooms);
    }

    if (filters.sort === "price_asc") {
      legacyQuery = legacyQuery.order("rent_eur", { ascending: true }).order("created_at", { ascending: false });
    } else if (filters.sort === "price_desc") {
      legacyQuery = legacyQuery.order("rent_eur", { ascending: false }).order("created_at", { ascending: false });
    } else if (filters.sort === "available_asc") {
      legacyQuery = legacyQuery.order("available_from", { ascending: true }).order("created_at", { ascending: false });
    } else {
      legacyQuery = legacyQuery.order("created_at", { ascending: false });
    }

    const retry = await legacyQuery;
    data = retry.data;
    error = retry.error;
  }
  if (error) {
    throw new Error(error.message);
  }

  return applyPostFilters((data ?? []) as Listing[], filters);
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

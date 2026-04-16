import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/database.types";

export type AppUserRow = Database["public"]["Tables"]["app_users"]["Row"];

export type AdminClientListing = {
  id: string;
  user_id: string;
  slug: string;
  title: string;
  city: string;
  status: "active" | "paused" | "archived";
  expires_at: string;
  created_at: string;
  contact_email: string | null;
  contact_whatsapp: string | null;
};

export type AdminClient = {
  user: AppUserRow;
  listings: AdminClientListing[];
};

function isMissingAppUsersTable(message: string) {
  return /app_users/i.test(message) && (/relation/i.test(message) || /table/i.test(message));
}

export async function getAdminUsers() {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("app_users")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(isMissingAppUsersTable(error.message) ? "app_users_table_missing" : error.message);
  }

  return (data ?? []) as AppUserRow[];
}

export async function getAdminUsersByIds(ids: string[]) {
  if (!ids.length) {
    return [] as Pick<AppUserRow, "id" | "email" | "role">[];
  }

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("app_users")
    .select("id, email, role")
    .in("id", ids);

  if (error) {
    throw new Error(isMissingAppUsersTable(error.message) ? "app_users_table_missing" : error.message);
  }

  return (data ?? []) as Pick<AppUserRow, "id" | "email" | "role">[];
}

export async function getAdminClients() {
  const supabase = await createServerSupabaseClient();
  const [usersResponse, listingsResponse] = await Promise.all([
    supabase.from("app_users").select("*").order("created_at", { ascending: false }),
    supabase
      .from("listings")
      .select("id, user_id, slug, title, city, status, expires_at, created_at, contact_email, contact_whatsapp")
      .order("created_at", { ascending: false }),
  ]);

  if (usersResponse.error) {
    throw new Error(
      isMissingAppUsersTable(usersResponse.error.message) ? "app_users_table_missing" : usersResponse.error.message,
    );
  }
  if (listingsResponse.error) {
    throw new Error(listingsResponse.error.message);
  }

  const listingsByUserId = new Map<string, AdminClientListing[]>();
  for (const listing of (listingsResponse.data ?? []) as AdminClientListing[]) {
    const existing = listingsByUserId.get(listing.user_id) ?? [];
    existing.push(listing);
    listingsByUserId.set(listing.user_id, existing);
  }

  return ((usersResponse.data ?? []) as AppUserRow[]).map((user) => ({
    user,
    listings: listingsByUserId.get(user.id) ?? [],
  })) as AdminClient[];
}

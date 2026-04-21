import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";
import { env } from "@/lib/env";

let cachedAdminClient: SupabaseClient<Database> | null | undefined;

export function createAdminSupabaseClient() {
  if (cachedAdminClient !== undefined) {
    return cachedAdminClient;
  }

  const serviceRoleKey = `${process.env.SUPABASE_SERVICE_ROLE_KEY ?? ""}`.trim();
  if (!serviceRoleKey) {
    cachedAdminClient = null;
    return cachedAdminClient;
  }

  cachedAdminClient = createClient<Database>(env.NEXT_PUBLIC_SUPABASE_URL, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  return cachedAdminClient;
}

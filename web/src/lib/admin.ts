import type { SupabaseClient, User } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";

export type AppUserRole = "user" | "admin" | "super_admin";

const VALID_APP_USER_ROLES = new Set<AppUserRole>(["user", "admin", "super_admin"]);
const BOOTSTRAP_SUPER_ADMIN_EMAIL = "jim@la-brique.be";

function normalizeEmail(email: string | null | undefined) {
  const normalized = `${email ?? ""}`.trim().toLowerCase();
  return normalized.length ? normalized : null;
}

function isMissingAppUsersTable(message: string) {
  return /app_users/i.test(message) && (/relation/i.test(message) || /table/i.test(message));
}

function fallbackRoleFromEmail(email: string | null) {
  if (email === BOOTSTRAP_SUPER_ADMIN_EMAIL) {
    return "super_admin" as const;
  }
  return "user" as const;
}

export function isAdminRole(role: AppUserRole) {
  return role === "admin" || role === "super_admin";
}

export function isSuperAdminRole(role: AppUserRole) {
  return role === "super_admin";
}

export async function ensureAndGetCurrentUserRole(
  supabase: SupabaseClient<Database>,
  user: Pick<User, "id" | "email">,
) {
  const normalizedEmail = normalizeEmail(user.email);
  const fallbackRole = fallbackRoleFromEmail(normalizedEmail);

  const { error: upsertError } = await supabase.from("app_users").upsert(
    {
      id: user.id,
      email: normalizedEmail,
      role: fallbackRole,
    },
    {
      onConflict: "id",
      ignoreDuplicates: true,
    },
  );

  if (upsertError && !isMissingAppUsersTable(upsertError.message)) {
    console.error("[app_users.upsert]", upsertError.message);
  }

  const { data, error } = await supabase.from("app_users").select("role").eq("id", user.id).maybeSingle();

  if (error) {
    if (!isMissingAppUsersTable(error.message)) {
      console.error("[app_users.select_role]", error.message);
    }
    return fallbackRole;
  }

  if (!data?.role || !VALID_APP_USER_ROLES.has(data.role as AppUserRole)) {
    return fallbackRole;
  }

  return data.role as AppUserRole;
}

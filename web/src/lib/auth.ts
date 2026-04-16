import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { ensureAndGetCurrentUserRole, isAdminRole, isSuperAdminRole } from "@/lib/admin";

export async function requireUser(nextPath: string) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/connexion?next=${encodeURIComponent(nextPath)}`);
  }

  const role = await ensureAndGetCurrentUserRole(supabase, user);

  return {
    supabase,
    user,
    role,
    isAdmin: isAdminRole(role),
    isSuperAdmin: isSuperAdminRole(role),
  };
}

export async function requireAdmin(nextPath: string) {
  const context = await requireUser(nextPath);
  if (!context.isAdmin) {
    redirect("/annonces");
  }
  return context;
}

export async function requireSuperAdmin(nextPath: string) {
  const context = await requireUser(nextPath);
  if (!context.isSuperAdmin) {
    redirect("/annonces");
  }
  return context;
}

"use server";

import { redirect } from "next/navigation";
import { requireAdmin, requireSuperAdmin } from "@/lib/auth";
import { assertTrustedFormRequest } from "@/lib/security/request";

const allowedStatuses = new Set(["active", "paused", "archived"]);
const allowedManagedRoles = new Set(["user", "admin"]);

function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

function plusDaysIsoDate(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

function redirectWithError(code: string): never {
  redirect(`/clients?error=${encodeURIComponent(code)}`);
}

export async function adminModerateListingStatusAction(formData: FormData) {
  await assertTrustedFormRequest();
  const listingId = `${formData.get("listing_id") ?? ""}`.trim();
  const nextStatus = `${formData.get("status") ?? ""}`.trim();
  if (!listingId || !allowedStatuses.has(nextStatus)) {
    redirectWithError("invalid_moderation_request");
  }

  const { supabase } = await requireAdmin("/clients");
  const status = nextStatus as "active" | "paused" | "archived";

  const updatePayload: { status: "active" | "paused" | "archived"; expires_at?: string } = { status };
  if (status === "active") {
    const { data: listingData, error: listingError } = await supabase
      .from("listings")
      .select("expires_at")
      .eq("id", listingId)
      .maybeSingle();

    if (listingError) {
      redirectWithError(listingError.message);
    }

    if (listingData?.expires_at && listingData.expires_at < todayIsoDate()) {
      updatePayload.expires_at = plusDaysIsoDate(30);
    }
  }

  const { error } = await supabase.from("listings").update(updatePayload).eq("id", listingId);
  if (error) {
    redirectWithError(error.message);
  }

  redirect("/clients?updated=1");
}

export async function adminSetUserRoleAction(formData: FormData) {
  await assertTrustedFormRequest();
  const targetUserId = `${formData.get("target_user_id") ?? ""}`.trim();
  const nextRoleRaw = `${formData.get("role") ?? ""}`.trim();
  if (!targetUserId || !allowedManagedRoles.has(nextRoleRaw)) {
    redirectWithError("invalid_role_update_request");
  }

  const { supabase, user } = await requireSuperAdmin("/clients");
  if (targetUserId === user.id) {
    redirectWithError("cannot_update_own_role");
  }

  const { data: target, error: targetError } = await supabase
    .from("app_users")
    .select("id, role")
    .eq("id", targetUserId)
    .maybeSingle();
  if (targetError) {
    redirectWithError(targetError.message);
  }
  if (!target) {
    redirectWithError("target_user_not_found");
  }
  if (target.role === "super_admin") {
    redirectWithError("cannot_update_super_admin");
  }

  const nextRole = nextRoleRaw as "user" | "admin";
  const { error } = await supabase
    .from("app_users")
    .update({ role: nextRole })
    .eq("id", targetUserId)
    .neq("role", "super_admin");
  if (error) {
    redirectWithError(error.message);
  }

  redirect("/clients?updated=1");
}

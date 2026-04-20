"use server";

import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { assertTrustedFormRequest } from "@/lib/security/request";
import { allowedStatuses, isMissingExpiresAtColumn, plusDaysIsoDate, todayIsoDate } from "@/app/mes-annonces/actions/shared";
import { getRequestLocale } from "@/lib/i18n/request-locale";
import { withLocalePath } from "@/lib/i18n/pathname";

export async function updateListingStatusAction(formData: FormData) {
  await assertTrustedFormRequest();
  const locale = await getRequestLocale();
  const myListingsPath = withLocalePath("/mes-annonces", locale);
  const listingId = `${formData.get("listing_id") ?? ""}`.trim();
  const status = `${formData.get("status") ?? ""}`.trim();

  if (!listingId || !allowedStatuses.has(status)) {
    redirect(`${myListingsPath}?error=invalid_status_request`);
  }

  const { supabase, user } = await requireUser(myListingsPath);
  const statusValue = status as "active" | "paused" | "archived";

  const updatePayload: { status: "active" | "paused" | "archived"; expires_at?: string } = {
    status: statusValue,
  };

  if (statusValue === "active") {
    const { data: listingData, error: listingError } = await supabase
      .from("listings")
      .select("expires_at")
      .eq("id", listingId)
      .eq("user_id", user.id)
      .single();

    if (listingError && !isMissingExpiresAtColumn(listingError.message)) {
      redirect(`${myListingsPath}?error=${encodeURIComponent(listingError.message)}`);
    }

    if (!listingError && listingData && listingData.expires_at < todayIsoDate()) {
      updatePayload.expires_at = plusDaysIsoDate(30);
    }
  }

  let { error } = await supabase
    .from("listings")
    .update(updatePayload)
    .eq("id", listingId)
    .eq("user_id", user.id);

  if (error && isMissingExpiresAtColumn(error.message)) {
    const retry = await supabase
      .from("listings")
      .update({ status: statusValue })
      .eq("id", listingId)
      .eq("user_id", user.id);
    error = retry.error;
  }

  if (error) {
    redirect(`${myListingsPath}?error=${encodeURIComponent(error.message)}`);
  }

  redirect(`${myListingsPath}?updated=1`);
}

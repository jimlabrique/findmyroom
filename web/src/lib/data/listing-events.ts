import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export type ListingEventType = "view_listing" | "click_contact";

function isMissingListingEventsTable(message: string) {
  return /listing_events/i.test(message) && (/relation/i.test(message) || /table/i.test(message));
}

export async function trackListingEvent({
  listingId,
  eventType,
  source,
}: {
  listingId: string;
  eventType: ListingEventType;
  source: string;
}) {
  try {
    const adminSupabase = createAdminSupabaseClient();
    if (!adminSupabase) {
      return;
    }

    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const normalizedSource = source.trim().slice(0, 120) || "unknown";

    const { error } = await adminSupabase.from("listing_events").insert({
      listing_id: listingId,
      event_type: eventType,
      source: normalizedSource,
      viewer_user_id: user?.id ?? null,
    });

    if (error && !isMissingListingEventsTable(error.message)) {
      console.error("[listing_events.insert]", error.message);
    }
  } catch (error) {
    console.error("[listing_events.track]", error);
  }
}

export type ListingMetrics = {
  views: number;
  contacts: number;
};

export async function getListingMetricsByListingIds(listingIds: string[]) {
  const metrics = new Map<string, ListingMetrics>();
  if (!listingIds.length) {
    return metrics;
  }

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("listing_events")
    .select("listing_id, event_type")
    .in("listing_id", listingIds);

  if (error) {
    if (!isMissingListingEventsTable(error.message)) {
      console.error("[listing_events.select]", error.message);
    }
    return metrics;
  }

  for (const event of data ?? []) {
    const entry = metrics.get(event.listing_id) ?? { views: 0, contacts: 0 };
    if (event.event_type === "view_listing") {
      entry.views += 1;
    }
    if (event.event_type === "click_contact") {
      entry.contacts += 1;
    }
    metrics.set(event.listing_id, entry);
  }

  return metrics;
}

export async function getOwnerListingMetrics(listingIds: string[]) {
  return getListingMetricsByListingIds(listingIds);
}

import { createServerSupabaseClient } from "@/lib/supabase/server";

type SystemReadiness = {
  ok: boolean;
  issues: string[];
};

let readinessCache: { expiresAt: number; value: SystemReadiness } | null = null;
const READINESS_CACHE_MS = 60_000;

function includesAll(message: string, parts: string[]) {
  const lower = message.toLowerCase();
  return parts.every((part) => lower.includes(part));
}

function issueFromMessage(message: string) {
  if (includesAll(message, ["photo_captions", "column"])) {
    return "Base non migree: colonne `photo_captions` manquante.";
  }
  if (includesAll(message, ["expires_at", "column"])) {
    return "Base non migree: colonne `expires_at` manquante.";
  }
  if (
    includesAll(message, ["room_details", "column"]) ||
    includesAll(message, ["total_rooms", "column"]) ||
    includesAll(message, ["animals_policy", "column"])
  ) {
    return "Base non migree: nouveaux champs annonce manquants (room_details/total_rooms/animals_policy).";
  }
  if (
    includesAll(message, ["listing_events", "relation"]) ||
    includesAll(message, ["listing_events", "table"])
  ) {
    return "Base non migree: table `listing_events` manquante.";
  }
  if (includesAll(message, ["bucket", "not found"])) {
    return "Storage non configure: bucket `listing-photos` introuvable.";
  }
  return null;
}

function isExpectedRlsMessage(message: string) {
  return includesAll(message, ["permission denied"]) || includesAll(message, ["row-level security"]);
}

async function computeSystemReadiness(): Promise<SystemReadiness> {
  const issues: string[] = [];

  try {
    const supabase = await createServerSupabaseClient();

    const { error: listingsError } = await supabase
      .from("listings")
      .select("id, photo_captions, expires_at, room_details, total_rooms, animals_policy")
      .limit(1);
    if (listingsError) {
      const issue = issueFromMessage(listingsError.message);
      if (issue) {
        issues.push(issue);
      }
    }

    const { error: eventsError } = await supabase.from("listing_events").select("id").limit(1);
    if (eventsError) {
      const issue = issueFromMessage(eventsError.message);
      if (issue && !isExpectedRlsMessage(eventsError.message)) {
        issues.push(issue);
      }
    }

    const { error: storageError } = await supabase.storage.from("listing-photos").list("", { limit: 1, offset: 0 });
    if (storageError) {
      const issue = issueFromMessage(storageError.message);
      if (issue) {
        issues.push(issue);
      }
    }
  } catch (error) {
    console.error("[system_readiness]", error);
    issues.push("Check de configuration impossible pour le moment.");
  }

  return {
    ok: issues.length === 0,
    issues,
  };
}

export async function getSystemReadiness() {
  const now = Date.now();
  if (readinessCache && now < readinessCache.expiresAt) {
    return readinessCache.value;
  }

  const value = await computeSystemReadiness();
  readinessCache = {
    expiresAt: now + READINESS_CACHE_MS,
    value,
  };
  return value;
}

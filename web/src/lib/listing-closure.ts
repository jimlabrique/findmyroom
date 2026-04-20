export const LISTING_CLOSURE_REASON_VALUES = ["found_via_app", "found_elsewhere", "no_longer_needed"] as const;

export type ListingClosureReason = (typeof LISTING_CLOSURE_REASON_VALUES)[number];

const LISTING_CLOSURE_REASON_SET = new Set<string>(LISTING_CLOSURE_REASON_VALUES);

export function parseListingClosureReason(value: FormDataEntryValue | null): ListingClosureReason | null {
  const raw = `${value ?? ""}`.trim();
  if (!raw || !LISTING_CLOSURE_REASON_SET.has(raw)) {
    return null;
  }
  return raw as ListingClosureReason;
}

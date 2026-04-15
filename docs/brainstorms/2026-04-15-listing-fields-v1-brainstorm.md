---
date: 2026-04-15
topic: listing-fields-v1
---

# Listing Fields V1

## What We're Building
We are upgrading the listing form to capture higher-signal coloc data while staying simple to publish.  
The form keeps a minimal required core, then adds structured optional fields that improve matching quality and listing clarity.

The new model separates objective housing data (rooms, price, furniture, bathroom, exterior/view) from coloc context (current roommates and LGBTQIA+ friendly signal).

## Why This Approach
We chose a structured form instead of free text because it is faster to scan, filter, and compare for users.  
We avoid sensitive exclusion mechanics by not introducing explicit gender targeting in search. We keep only non-blocking context fields.

## Key Decisions
- Minimal required + recommended optional fields: better completion without over-friction.
- Gender-related info as non-blocking context only: `coloc actuelle` + `LGBTQIA+ friendly`.
- Price per room required when multiple rooms are available: each room has its own `taille + prix`.
- Total number of rooms in the flatshare is mandatory.
- `Animaux autorisés` is tri-state: `oui / non / à discuter`.
- Structured attributes are mandatory where selected:
  - `SDB`: privative / partagée
  - `Meublée`: oui / non / partiellement
  - `Extérieur`: balcon / terrasse / aucun
  - `Vue`: jardin / cour / rue / autre

## Open Questions
- Should per-room attributes (furnished/private bathroom/exterior) be modeled per room or at listing-level in V1?

## Next Steps
→ Implementation plan for schema + form + listing display + filters.

# Google Forms Build Checklist

Use this before going live.

## Global checks

- [ ] All field keys match spec files exactly
- [ ] Consent field is mandatory on both forms
- [ ] Timezone for date fields set to Europe/Brussels
- [ ] Optional tracking fields added if needed (`source_channel`, `campaign`, `operator`)
- [ ] Thank-you screen mentions "response under 48h"

## Coloc form checks

- [ ] `accepted_segment` has exactly: `etudiant`, `jeune_actif`, `both`
- [ ] `non_negotiables` uses fixed list
- [ ] `monthly_rent_eur` is numeric only
- [ ] `district` dropdown contains only Brussels target districts

## Candidat form checks

- [ ] `segment` has exactly: `etudiant`, `jeune_actif`
- [ ] `pet_type` shown only in `has_pet = yes` branch (via section logic)
- [ ] `preferred_districts` allows multiple selection
- [ ] `smoker` options exactly match scoring engine values

## Ops integration checks

- [ ] New submissions appear in Google Sheets response tabs within 5 minutes
- [ ] Duplicate detection rule configured (same WhatsApp + same room OR same WhatsApp + move_in_date)
- [ ] Error fallback: form failure -> manual WhatsApp intake with same fields

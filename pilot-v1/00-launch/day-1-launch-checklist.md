# Day 1 Launch Checklist (Pilot V1)

Target: pilot fully operational by end of day.

## 1) Tools setup (90 min)

- [ ] Create Google Form `Form Coloc` from `01-google-forms/form-coloc-spec.md`
- [ ] Create Google Form `Form Candidat` from `01-google-forms/form-candidat-spec.md`
- [ ] Run `01-google-forms/google-forms-build-checklist.md`
- [ ] Create Google Sheets workbook from `02-google-sheets/schema.md`
- [ ] Apply formulas and filter views from `02-google-sheets/formulas-and-views.md`
- [ ] Follow `00-launch/google-forms-sheets-setup.md` end-to-end once

## 2) Scoring validation (20 min)

- [ ] Run:
  - `node pilot-v1/03-scoring/scenario-tests.js`
- [ ] Run a real sample shortlist generation:
  - `node pilot-v1/03-scoring/generate-shortlist.js --coloc pilot-v1/03-scoring/examples/coloc-sample.json --candidate pilot-v1/03-scoring/examples/candidate-a.json --candidate pilot-v1/03-scoring/examples/candidate-b.json --candidate pilot-v1/03-scoring/examples/candidate-c.json --out /private/tmp/shortlist-sample.md`

## 3) Communication setup (30 min)

- [ ] Fill placeholders in:
  - `05-templates/rgpd-consent-text.md`
  - `05-templates/whatsapp-coloc-outreach.txt`
  - `05-templates/whatsapp-candidate-intake.txt`
  - `05-templates/whatsapp-candidate-follow-up.txt`
- [ ] Save fixed WhatsApp snippets in your phone/desktop app.

## 4) Ops setup (40 min)

- [ ] Fill `06-kpi/pilot-tracker-template.csv` with week labels and owner names
- [ ] Assign roles using `04-ops/ownership-split.md`
- [ ] Start daily standup using `04-ops/daily-standup-template.md`
- [ ] Open decision log `04-ops/scoring-change-log.md`

## 5) First acquisition sprint (today)

- [ ] Send 20 coloc outreach messages (Brussels groups + referrals)
- [ ] Qualify at least 2 colocs today
- [ ] Move qualified leads to Google Sheet tab `Colocs` with status `coloc_qualified`

## End-of-day success criteria

- Both forms live
- Google Sheets pipeline live
- Scoring validated
- First outreach batch sent
- At least 2 qualified colocs in pipeline

# Google Forms + Sheets Setup (Step by step)

Use this once, then run daily operations from the ops docs.

## 1) Create `Form Coloc`

1. Open [forms.google.com](https://forms.google.com)
2. Create blank form named `Form Coloc - Pilot Brussels`
3. Add fields from `01-google-forms/form-coloc-spec.md` in exact order
4. In `Responses` tab -> click Sheets icon -> create new sheet
5. Rename response sheet to `Form Coloc Responses`

## 2) Create `Form Candidat`

1. Create second blank form named `Form Candidat - Pilot Brussels`
2. Add fields from `01-google-forms/form-candidat-spec.md`
3. Add section logic so `pet_type` appears only when `has_pet = yes`
4. In `Responses` tab -> click Sheets icon -> select existing pilot workbook
5. Rename response sheet to `Form Candidat Responses`

## 3) Prepare ops workbook tabs

Inside the same workbook:

1. Add tabs `Colocs`, `Candidats`, `Matches`, `Pilot KPI`, `Config`
2. Paste headers from CSV templates in:
   - `02-google-sheets/import-templates/colocs-template.csv`
   - `02-google-sheets/import-templates/candidats-template.csv`
   - `02-google-sheets/import-templates/matches-template.csv`
   - `02-google-sheets/import-templates/pilot-kpi-template.csv`
3. Apply formulas from `02-google-sheets/formulas-and-views.md`

## 4) Verify end-to-end flow

1. Submit one fake coloc form entry
2. Submit one fake candidate form entry
3. Confirm both rows appear in response tabs
4. Copy them into `Colocs` and `Candidats` tabs
5. Run local scoring and generate sample shortlist

## 5) Go-live minimum

Before first outreach:

- Both forms shareable by link
- Workbook has all required tabs
- KPI row for week 1 initialized
- WhatsApp templates customized with your contact info

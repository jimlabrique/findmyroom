# Pilot V1 Launch Pack (4 weeks)

> Archive note (2026-04-14):
> ce dossier est un ancien package "matching concierge".
> Il est conserve pour reference, mais il ne definit pas la V1 produit actuelle.

This folder contains an implementation-ready concierge pilot package for "coloc matching" in Brussels.

## Goal

Validate that compatibility-based shortlists improve how flatshares select candidates compared with their usual process.

## Fixed constraints

- Pilot format: concierge (no heavy product build yet)
- Stack: Google Forms + Google Sheets + WhatsApp
- Market: Brussels only
- Segments: `etudiant` and `jeune_actif` (separated by default, merge only if coloc allows it)
- Sample target: 10 qualified colocs / 60 candidates
- SLA: shortlist sent within 48h after complete candidate data

## Folder map

- `01-google-forms/`: form specs and build checklist
- `02-google-sheets/`: workbook schema, formulas, filter views, import templates
- `03-scoring/`: scoring rubric, scoring engine, scenario tests
- `04-ops/`: week-by-week execution, operating playbook, ownership split
- `05-templates/`: WhatsApp messages, shortlist template, GDPR text and deletion SOP
- `06-kpi/`: KPI definitions, tracker CSV template, go/no-go gate

## How to use this pack

1. Follow setup guide `00-launch/google-forms-sheets-setup.md`.
2. Build both Google Forms using `01-google-forms`.
3. Create Google Sheets workbook using `02-google-sheets`.
4. Validate scoring logic locally:
   - `node pilot-v1/03-scoring/scenario-tests.js`
5. Start operations using `04-ops`.
6. Use templates from `05-templates` for all candidate/coloc communications.
7. Track pilot outcomes with `06-kpi/pilot-tracker-template.csv`.
8. At end of week 4, apply the exact gate in `06-kpi/kpi-and-go-no-go.md`.

# Google Sheets Workbook Schema

Workbook name suggestion: `Coloc Pilot Brussels - V1`

## Tabs structure

Create these tabs:

1. `Form Coloc Responses` (auto-created by Google Form)
2. `Form Candidat Responses` (auto-created by Google Form)
3. `Colocs` (ops table)
4. `Candidats` (ops table)
5. `Matches` (decision table)
6. `Pilot KPI` (weekly KPIs)
7. `Config` (optional lists and constants)

## Tab: `Colocs`

| Column | Type | Notes |
|---|---|---|
| `coloc_id` | Number/Text | Internal id (`C-001` style recommended) |
| `created_at` | DateTime | Intake timestamp |
| `contact_name` | Text | |
| `contact_whatsapp` | Text | |
| `contact_email` | Text | Optional |
| `room_title` | Text | |
| `monthly_rent_eur` | Number | |
| `charges_eur` | Number | |
| `district` | Text | Brussels list |
| `room_available_date` | Date | |
| `accepted_segment` | Text | `etudiant`, `jeune_actif`, `both` |
| `min_stay_months` | Number | |
| `max_stay_months` | Number | |
| `non_negotiables` | Text | Comma-separated |
| `lifestyle_cleanliness` | Number | 1-5 |
| `lifestyle_noise` | Number | 1-5 |
| `lifestyle_sociability` | Number | 1-5 |
| `lifestyle_guests` | Number | 1-5 |
| `lifestyle_schedule` | Number | 1-5 |
| `lifestyle_remote_work` | Number | 0-5 |
| `smoking_allowed` | Text | `no`, `outside_only`, `yes` |
| `pets_allowed` | Text | `no`, `cat_only`, `small_pets`, `all` |
| `vibe_text` | Text | |
| `consent_rgpd` | Boolean/Text | TRUE/checked |
| `status` | Text | `new_coloc`, `coloc_qualified`, `candidates_incoming`, `shortlist_sent`, `feedback_received`, `closed` |
| `operator_owner` | Text | Owner name |
| `feedback_score` | Text | `much_better`, `better`, `same`, `worse` |
| `feedback_comment` | Text | |
| `closed_at` | DateTime | |

## Tab: `Candidats`

| Column | Type | Notes |
|---|---|---|
| `candidate_id` | Number/Text | Internal id (`U-001`) |
| `created_at` | DateTime | Intake timestamp |
| `full_name` | Text | |
| `whatsapp` | Text | |
| `email` | Text | Optional |
| `segment` | Text | `etudiant`, `jeune_actif` |
| `budget_max_eur` | Number | |
| `preferred_districts` | Text | Comma-separated |
| `move_in_date` | Date | |
| `target_stay_months` | Number | |
| `lifestyle_cleanliness` | Number | 1-5 |
| `lifestyle_noise` | Number | 1-5 |
| `lifestyle_sociability` | Number | 1-5 |
| `lifestyle_guests` | Number | 1-5 |
| `lifestyle_schedule` | Number | 1-5 |
| `lifestyle_remote_work` | Number | 0-5 |
| `smoker` | Text | `no`, `occasionally`, `yes` |
| `has_pet` | Boolean/Text | |
| `pet_type` | Text | Optional |
| `non_negotiables` | Text | Comma-separated |
| `about_me` | Text | |
| `consent_rgpd` | Boolean/Text | TRUE/checked |
| `completion_status` | Text | `complete`, `incomplete` |
| `follow_up_count` | Number | Start at 0 |
| `last_follow_up_at` | DateTime | |

## Tab: `Matches`

| Column | Type | Notes |
|---|---|---|
| `match_id` | Text | `M-xxx` |
| `coloc_id` | Text | Reference to `Colocs.coloc_id` |
| `candidate_id` | Text | Reference to `Candidats.candidate_id` |
| `hard_filters_pass` | Boolean | |
| `hard_filter_details` | Text | Comma-separated |
| `red_flags` | Text | Comma-separated |
| `major_friction_count` | Number | |
| `compat_score` | Number | 0-100 |
| `match_decision` | Text | `shortlist`, `reject`, `follow_up_once`, `abandon` |
| `explain_top_matches` | Text | Mandatory for shortlist |
| `explain_top_frictions` | Text | Mandatory for shortlist |
| `warnings` | Text | Optional |
| `created_at` | DateTime | |
| `shortlist_sent_at` | DateTime | |
| `sla_deadline` | DateTime | `created_at + 48h` |
| `sla_in_time` | Number | 1/0 |

## Tab: `Pilot KPI`

One row per week.

| Column | Type |
|---|---|
| `week_label` | Text |
| `colocs_new` | Number |
| `colocs_qualified` | Number |
| `candidates_started` | Number |
| `candidates_completed` | Number |
| `completion_rate` | Formula |
| `shortlists_sent` | Number |
| `feedback_received` | Number |
| `feedback_better_or_equal` | Number |
| `quality_rate` | Formula |
| `sla_in_time_count` | Number |
| `sla_rate` | Formula |
| `notes` | Text |

## Mapping workflow (Forms -> Ops tabs)

1. Google Forms write raw rows into `Form Coloc Responses` and `Form Candidat Responses`.
2. Daily, append new rows into ops tabs `Colocs` / `Candidats`.
3. Add status and owner fields in ops tabs.
4. Create match rows in `Matches` based on scoring results.

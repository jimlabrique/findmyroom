# Google Form Spec - Form Candidat

Use this form for all applicants to coloc rooms.

## Settings

- Language: French
- Required fields: all except explicitly marked optional
- Auto-confirmation after submit with "response expected under 48h"
- Consent checkbox mandatory before submit
- Link responses to Google Sheets
- Collect email: disabled (use explicit email field instead)
- Limit to 1 response: disabled

## Fields

| Order | Field key | Label | Type | Required | Notes |
|---|---|---|---|---|---|
| 1 | `full_name` | Nom complet | Short text | Yes | |
| 2 | `whatsapp` | Numero WhatsApp | Phone | Yes | Primary channel |
| 3 | `email` | Email | Email | No | Fallback only |
| 4 | `segment` | Statut principal | Single choice | Yes | `etudiant` / `jeune_actif` |
| 5 | `budget_max_eur` | Budget max mensuel (EUR) | Number | Yes | Integer |
| 6 | `preferred_districts` | Quartiers preferes | Multi choice | Yes | Brussels districts |
| 7 | `move_in_date` | Date d'entree souhaitee | Date | Yes | ISO date |
| 8 | `target_stay_months` | Duree souhaitee (mois) | Number | Yes | Integer |
| 9 | `lifestyle_cleanliness` | Ton niveau menage | Opinion scale 1-5 | Yes | 1 relax / 5 strict |
| 10 | `lifestyle_noise` | Niveau de bruit de vie | Opinion scale 1-5 | Yes | 1 calme / 5 anime |
| 11 | `lifestyle_sociability` | Sociabilite a la maison | Opinion scale 1-5 | Yes | 1 reserve / 5 tres social |
| 12 | `lifestyle_guests` | Frequence invites | Opinion scale 1-5 | Yes | 1 rare / 5 frequent |
| 13 | `lifestyle_schedule` | Rythme quotidien | Opinion scale 1-5 | Yes | 1 tot / 5 tard |
| 14 | `lifestyle_remote_work` | Teletravail (jours/semaine) | Number | Yes | 0-5 |
| 15 | `smoker` | Tu fumes ? | Single choice | Yes | `no` / `occasionally` / `yes` |
| 16 | `has_pet` | Tu as un animal ? | Multiple choice | Yes | `yes` / `no` |
| 17 | `pet_type` | Type d'animal | Short text | No | Show in "yes" section only |
| 18 | `non_negotiables` | Tes non negociables | Multi choice | Yes | Same fixed list as coloc form |
| 19 | `about_me` | Qui es-tu en coloc ? | Long text | Yes | Max 5 lines |
| 20 | `consent_rgpd` | Consentement traitement donnees pilote | Checkbox | Yes | Must be checked |

## Fixed options for `non_negotiables`

- `no_smoking`
- `no_pets`
- `quiet_after_22`
- `no_party`
- `cleaning_strict`

## Google Sheets mapping

Each submission goes to tab `Form Candidat Responses`.
Then copy/append to tab `Candidats` and set:

- `completion_status = complete` if required fields are present
- else `completion_status = incomplete`

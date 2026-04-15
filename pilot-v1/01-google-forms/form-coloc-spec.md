# Google Form Spec - Form Coloc

Use this form for flatshares with one available room.

## Settings

- Language: French
- Submission mode: one room per submission
- Required fields: all except explicitly marked optional
- Consent checkbox mandatory before submit
- Link responses to Google Sheets
- Collect email: disabled (use explicit email field instead)
- Limit to 1 response: disabled

## Fields

| Order | Field key | Label | Type | Required | Notes |
|---|---|---|---|---|---|
| 1 | `contact_name` | Nom du contact coloc | Short text | Yes | Owner side main contact |
| 2 | `contact_whatsapp` | Numero WhatsApp | Phone | Yes | Primary ops channel |
| 3 | `contact_email` | Email | Email | No | Fallback only |
| 4 | `room_title` | Titre annonce | Short text | Yes | Example: "Chambre lumineuse Ixelles" |
| 5 | `monthly_rent_eur` | Loyer mensuel (EUR) | Number | Yes | Integer |
| 6 | `charges_eur` | Charges mensuelles (EUR) | Number | No | Default 0 |
| 7 | `district` | Quartier | Dropdown | Yes | Brussels district list |
| 8 | `room_available_date` | Date de disponibilite | Date | Yes | ISO date |
| 9 | `accepted_segment` | Segment accepte | Single choice | Yes | `etudiant` / `jeune_actif` / `both` |
| 10 | `min_stay_months` | Duree minimum (mois) | Number | Yes | Integer |
| 11 | `max_stay_months` | Duree maximum (mois) | Number | No | Optional cap |
| 12 | `non_negotiables` | Regles non negociables | Multi choice | Yes | See fixed options below |
| 13 | `lifestyle_cleanliness` | Niveau menage attendu | Opinion scale 1-5 | Yes | 1 relaxed / 5 strict |
| 14 | `lifestyle_noise` | Niveau de bruit de vie | Opinion scale 1-5 | Yes | 1 calme / 5 anime |
| 15 | `lifestyle_sociability` | Vie sociale a la maison | Opinion scale 1-5 | Yes | 1 reserve / 5 tres social |
| 16 | `lifestyle_guests` | Frequence invites | Opinion scale 1-5 | Yes | 1 rare / 5 frequent |
| 17 | `lifestyle_schedule` | Rythme quotidien | Opinion scale 1-5 | Yes | 1 tot / 5 tard |
| 18 | `lifestyle_remote_work` | Teletravail (jours/semaine) | Number | Yes | 0-5 |
| 19 | `smoking_allowed` | Tabac dans la coloc | Single choice | Yes | `no` / `outside_only` / `yes` |
| 20 | `pets_allowed` | Animaux acceptes | Single choice | Yes | `no` / `cat_only` / `small_pets` / `all` |
| 21 | `vibe_text` | Ambiance de la coloc | Long text | Yes | 3-5 lines max requested |
| 22 | `consent_rgpd` | Consentement traitement donnees pilote | Checkbox | Yes | Must be checked |

## Fixed options for `non_negotiables`

- `no_smoking`
- `no_pets`
- `quiet_after_22`
- `no_party`
- `cleaning_strict`

## Google Sheets mapping

Each submission goes to tab `Form Coloc Responses`.
Then copy/append to tab `Colocs` and set:

- `status = new_coloc`
- `operator_owner` assigned manually

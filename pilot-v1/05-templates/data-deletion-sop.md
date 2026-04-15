# Data Deletion SOP (Pilot)

## Trigger

Candidate or coloc asks for deletion of personal data.

## SLA

- Acknowledge request within 24h
- Execute deletion within 72h

## Steps

1. Verify requester identity (same WhatsApp/email used in form).
2. Locate records in Google Sheets tabs: `Colocs`, `Candidats`, `Matches`.
3. Export minimal audit note in internal log: requester id + timestamp + action.
4. Delete personal fields from Google Sheets records.
5. Delete related WhatsApp notes and local exported files.
6. Confirm deletion to requester with timestamp.

## Confirmation template

Bonjour {first_name},

Ta demande de suppression a ete executee le {timestamp}.
Nous avons supprime les donnees personnelles associees a ton dossier pilote.

Si tu veux une confirmation complementaire, reponds a ce message.

# Findmyroom V1 (Next.js + Supabase)

Marketplace d'annonces de colocation:
- publier
- chercher
- filtrer
- contacter
- uploader plusieurs photos avec une legende par photo

## Stack

- Next.js App Router
- Supabase (DB + auth)
- Google login via Supabase OAuth

## Setup local

1. Copier les variables d'environnement:

```bash
cp .env.example .env.local
```

2. Renseigner les vraies valeurs Supabase dans `.env.local`.
Renseigner aussi les variables SMTP si tu veux l'envoi d'email direct depuis le formulaire contact.

3. Dans Supabase SQL Editor, executer:

```sql
-- web/supabase/schema.sql
```

Ce script cree aussi le bucket storage `listing-photos` et ses policies.

4. Dans Supabase Auth > Providers > Google:
- activer Google provider
- ajouter `http://localhost:3000/auth/callback` comme redirect URL

5. Installer et lancer:

```bash
npm install
npm run dev
```

## Envoi email direct (formulaire contact)

Pour envoyer l'email directement sans ouvrir le client mail local:
- configure `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM` dans `.env.local`
- redemarre `npm run dev`

## Routes V1

- `/` homepage
- `/annonces` recherche + filtres
- `/annonces/[slug]` detail annonce
- `/connexion` auth Google
- `/deposer` creation annonce (auth)
- `/mes-annonces` gestion annonces (auth)
- `/mes-annonces/[id]/editer` edition annonce (auth)

## Hors scope volontaire en V1

- swipe
- matching complexe
- score de compatibilite
- chat interne riche

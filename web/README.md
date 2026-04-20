# FindMyRoom V1 (Next.js + Supabase)

Marketplace d'annonces de colocation:
- publier
- chercher
- filtrer
- contacter
- uploader plusieurs photos avec une legende par photo

## Stack

- Next.js App Router
- Supabase (DB + auth)
- Google login + email/password via Supabase Auth
- i18n FR/EN/NL (URLs préfixées `/{locale}`)

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

Checks qualité:

```bash
npm run check:max-lines
npm run lint
npm run build
```

## Envoi email direct (formulaire contact)

Pour envoyer l'email directement sans ouvrir le client mail local:
- configure `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM` dans `.env.local`
- redemarre `npm run dev`

## Routes V1

- `/{locale}/annonces` recherche + filtres
- `/{locale}/annonces/[slug]` détail annonce
- `/{locale}/connexion` auth
- `/{locale}/deposer` création annonce (auth)
- `/{locale}/mes-annonces` gestion annonces (auth)
- `/{locale}/mes-annonces/[id]/editer` édition annonce (auth)

Locales supportées:
- `fr`
- `en`
- `nl`

## Mobile (Capacitor)

- Config Capacitor: `capacitor.config.ts`
- Android shell: `web/android`
- Guide de setup: `docs/mobile-capacitor-guide.md`

## Hors scope volontaire en V1

- swipe
- matching complexe
- score de compatibilite
- chat interne riche

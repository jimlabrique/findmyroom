# FindMyRoom Security Checklist (OWASP-focused)

## Auth & Session
- [ ] Google OAuth redirect URLs limitées à `https://www.findmyroom.be/auth/callback` + localhost dev. (à confirmer dans Supabase Auth > URL config)
- [x] `next` path strictement relatif (`/path`), aucun `//` ni URL externe.
- [x] Cookies session vérifiés (`HttpOnly`, `Secure` en prod, `SameSite=Lax`).
- [x] Rate-limit actif sur `signin`, `signup`, `google signin`.

## Input / Injection
- [x] Validation serveur sur tous les formulaires critiques (auth, dépôt, édition, contact).
- [x] Échappement HTML dans tous les templates email.
- [x] Paramètres SQL via client Supabase uniquement (pas de SQL string concat côté app).

## Access Control
- [x] RLS activé sur `listings`, `listing_events`, `app_users`.
- [x] Vérification des policies d’ownership sur CRUD annonces.
- [x] Vérification des rôles admin/super-admin sur pages et actions admin.

## Abuse & Bots
- [x] Honeypot actif sur formulaire contact annonce.
- [x] Rate-limit IP sur route email contact.
- [ ] Rate-limit distribué Upstash en prod (fallback mémoire local). (à confirmer en prod: variables Upstash)

## Browser Security
- [x] CSP active et testée (Google OAuth, Supabase storage, scripts Next). (script-src nonce, sans `unsafe-inline`)
- [x] `X-Frame-Options: DENY`.
- [x] `X-Content-Type-Options: nosniff`.
- [x] `Referrer-Policy: strict-origin-when-cross-origin`.
- [x] `Strict-Transport-Security` actif en prod.
- [x] `Permissions-Policy` restrictive.

## CSRF / Origin
- [x] Vérification Origin/Referer sur toutes les actions `POST` sensibles.
- [x] Requêtes cross-origin non approuvées bloquées.

## Data / Privacy
- [x] `SUPABASE_SERVICE_ROLE_KEY` jamais exposée côté client.
- [x] Variables sensibles uniquement en env serveur.
- [x] Suppression compte: suppression user + cleanup photos.

## Release Gate
- [x] `npm run check:max-lines` OK.
- [x] `npm run lint` OK.
- [x] `npm run build` OK.
- [ ] Parcours fonctionnels testés en `fr/en/nl`.

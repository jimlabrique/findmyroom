# FindMyRoom Security Checklist (OWASP-focused)

## Auth & Session
- [ ] Google OAuth redirect URLs limitées à `https://www.findmyroom.be/auth/callback` + localhost dev.
- [ ] `next` path strictement relatif (`/path`), aucun `//` ni URL externe.
- [ ] Cookies session vérifiés (`HttpOnly`, `Secure` en prod, `SameSite=Lax`).
- [ ] Rate-limit actif sur `signin`, `signup`, `google signin`.

## Input / Injection
- [ ] Validation serveur sur tous les formulaires critiques (auth, dépôt, édition, contact).
- [ ] Échappement HTML dans tous les templates email.
- [ ] Paramètres SQL via client Supabase uniquement (pas de SQL string concat côté app).

## Access Control
- [ ] RLS activé sur `listings`, `listing_events`, `app_users`.
- [ ] Vérification des policies d’ownership sur CRUD annonces.
- [ ] Vérification des rôles admin/super-admin sur pages et actions admin.

## Abuse & Bots
- [ ] Honeypot actif sur formulaire contact annonce.
- [ ] Rate-limit IP sur route email contact.
- [ ] Rate-limit distribué Upstash en prod (fallback mémoire local).

## Browser Security
- [ ] CSP active et testée (Google OAuth, Supabase storage, scripts Next).
- [ ] `X-Frame-Options: DENY`.
- [ ] `X-Content-Type-Options: nosniff`.
- [ ] `Referrer-Policy: strict-origin-when-cross-origin`.
- [ ] `Strict-Transport-Security` actif en prod.
- [ ] `Permissions-Policy` restrictive.

## CSRF / Origin
- [ ] Vérification Origin/Referer sur toutes les actions `POST` sensibles.
- [ ] Requêtes cross-origin non approuvées bloquées.

## Data / Privacy
- [ ] `SUPABASE_SERVICE_ROLE_KEY` jamais exposée côté client.
- [ ] Variables sensibles uniquement en env serveur.
- [ ] Suppression compte: suppression user + cleanup photos.

## Release Gate
- [ ] `npm run check:max-lines` OK.
- [ ] `npm run lint` OK.
- [ ] `npm run build` OK.
- [ ] Parcours fonctionnels testés en `fr/en/nl`.

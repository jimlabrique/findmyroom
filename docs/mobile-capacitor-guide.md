# FindMyRoom Mobile (Capacitor) - iOS & Android

## État courant
- Android shell Capacitor créé dans `web/android`.
- iOS shell non généré sur cette machine (CocoaPods manquant).

## Prérequis
- Node.js 20+
- Android Studio + SDK Android
- Xcode (macOS) + CocoaPods
- Variables OAuth/Supabase déjà configurées en web

## Commandes
```bash
cd web
npm install
npx cap add android
npx cap add ios
npx cap sync
npx cap open android
npx cap open ios
```

## Deep Links à configurer
- Scheme app: `findmyroom://auth/callback`
- Universal links domaine: `https://www.findmyroom.be`

## Supabase / Google OAuth
- Ajouter redirect URLs mobile:
  - `findmyroom://auth/callback`
  - `https://www.findmyroom.be/auth/callback`
- Vérifier les origins autorisées côté Google OAuth client web/mobile.

## Flux OAuth mobile retenu
1. L’utilisateur lance login Google dans la WebView app.
2. Retour via deep link ou universal link.
3. Passage sur `/auth/callback` pour échange code/session.
4. Session active ensuite dans la WebView.

## Checklist soumission stores
- [ ] Icônes app iOS/Android
- [ ] Splash screens
- [ ] Policy privacy
- [ ] Description store FR/EN/NL
- [ ] Screenshots mobile/tablette
- [ ] TestFlight (iOS) et Internal testing (Android)

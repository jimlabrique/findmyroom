# PRD V1 - Marketplace Colocation

Date: 2026-04-14
Statut: source of truth (actif)
Stack: Next.js (front), Supabase (DB + backend), Google login (auth)

## 1) Vision produit

La V1 est une marketplace d'annonces de colocation, pas une app de matching.

Promesse simple:
- publier une annonce vite
- trouver des annonces vite
- filtrer vite
- contacter vite

Le produit doit etre plus propre que Facebook et plus humain qu'un portail immo classique.

## 2) Probleme a resoudre

Aujourd'hui, beaucoup d'offres coloc vivent dans des groupes Facebook:
- flux bruyant
- infos incompletes ou mal structurees
- filtres faibles
- tri chronophage
- contact peu fluide

Notre V1 corrige ce point avec une structure d'annonce standard, une recherche claire, et un chemin de contact direct.

## 3) Cibles

Primaire:
- personnes qui ont deja une maison/appart en coloc avec 1+ chambre libre

Secondaire:
- etudiants majeurs
- jeunes actifs
- expats
- profils en recherche de coloc

## 4) Positionnement

Produit:
- plateforme de petites annonces dediee a la colocation

Pas produit:
- "Tinder de la coloc"
- moteur de score comportemental complexe
- workflow de swipe ou match mutuel

## 5) Scope V1 (P0)

1. Auth Google (inscription/connexion)
2. Depot d'annonce
3. Liste d'annonces
4. Page detail d'annonce
5. Recherche + filtres simples
6. Bouton de contact annonceur
7. Espace "mes annonces" minimum (voir/suspendre/editer)

## 6) Hors scope V1 (deporte apres lancement)

- swipe cards
- likes mutuels
- scoring de compatibilite de vie
- shortlist automatique
- "match du jour"
- messagerie interne complete (chat app)

Note:
Le contact en V1 passe par WhatsApp ou email expose par l'annonceur.

## 7) Donnees annonce (obligatoires V1)

- titre
- loyer mensuel (EUR)
- ville / localisation
- nombre de chambres disponibles
- disponibilite (date)
- description logement
- description ambiance coloc
- photos (au moins 1)
- canal de contact (WhatsApp ou email)

Champs optionnels recommandes:
- charges incluses ou non
- type de bail
- duree min
- genre prefere (si legalement applicable)

## 8) Principes UX

- 1 tache = 1 ecran principal
- pas de jargon "matching"
- friction minimale au depot
- info critique visible dans les cartes annonces
- CTA contact visible sans scroll excessif sur la page detail
- mobile-first (usage dominant acquisition sociale)

## 9) KPI V1

- taux completion depot annonce >= 70%
- temps median depot annonce <= 5 min
- CTR liste -> detail >= 25%
- taux detail -> clic contact >= 15%
- taux annonces avec au moins 1 prise de contact <= 7 jours >= 40%

## 10) Definition de succes V1

V1 est validee si:
- les annonceurs publient sans assistance
- les chercheurs trouvent des annonces pertinentes avec filtres simples
- le contact se declenche sans mecanique de matching

Si ces 3 points sont tenus, on pourra ajouter des suggestions intelligentes en V2.

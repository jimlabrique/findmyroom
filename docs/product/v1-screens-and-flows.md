# V1 Ecrans et User Flows - Marketplace Colocation

Date: 2026-04-14
Statut: actif

## 1) Architecture ecrans (App Router)

Routes publiques:
- `/` : homepage
- `/annonces` : recherche + liste
- `/annonces/[slug]` : detail annonce
- `/connexion` : auth Google

Routes connectees:
- `/deposer` : creation annonce
- `/mes-annonces` : liste de ses annonces
- `/mes-annonces/[id]/editer` : edition annonce

## 2) Flow A - Deposer une annonce

Objectif: passer de "je veux poster" a "annonce publiee" en moins de 5 minutes.

Etapes:
1. User clique `Deposer une annonce` depuis homepage ou header
2. Si non connecte: redirection `/connexion` puis retour automatique `/deposer`
3. Formulaire annonce (single page, sections courtes)
4. Upload photos (drag/drop ou mobile picker)
5. Preview rapide
6. `Publier`
7. Redirection vers page detail publiee + toast de confirmation

Regles UX:
- champs obligatoires marques clairement
- validation inline (pas de bloc erreur final massif)
- autosave brouillon local si fermeture accidentelle

## 3) Flow B - Chercher une coloc

Objectif: trouver des annonces pertinentes en 2-3 interactions.

Etapes:
1. User arrive sur homepage ou `/annonces`
2. Saisit ville + budget max (facultatif)
3. Applique filtres simples
4. Ouvre detail annonce
5. Clique `Contacter`

Filtres V1:
- ville
- budget min/max
- disponibilite
- chambres dispo (>= 1, >= 2)

Tri V1:
- plus recentes (defaut)
- prix croissant
- prix decroissant

## 4) Flow C - Gerer ses annonces

Objectif: controler facilement statut et contenu d'une annonce.

Etapes:
1. User connecte ouvre `/mes-annonces`
2. Voit statut: `active`, `pausee`, `archivee`
3. Peut editer, mettre en pause, reactiver, archiver
4. Peut voir compteur simple de clics contact (si tracking active)

## 5) Structure Homepage

Bloc 1 - Hero:
- titre clair: "Trouver un colocataire sans le chaos des groupes Facebook"
- CTA principal: `Deposer une annonce`
- CTA secondaire: `Voir les annonces`
- mini barre de recherche (ville + budget max)

Bloc 2 - Valeur produit:
- "Simple a publier"
- "Annonces structurees"
- "Contact direct"

Bloc 3 - Dernieres annonces:
- grille de cartes (6-12)
- bouton `Voir toutes les annonces`

Bloc 4 - Comment ca marche:
1. Publier
2. Etre visible
3. Echanger

Bloc 5 - Footer:
- lien legal
- contact
- mention "pas de swipe, pas de bruit inutile"

## 6) Structure Ecran Depot d'annonce (`/deposer`)

Sections formulaire:
1. Infos principales:
- titre
- ville
- disponibilite

2. Prix:
- loyer
- charges (optionnel)

3. Capacite:
- nombre de chambres dispo

4. Description:
- description logement
- ambiance coloc

5. Media:
- photos

6. Contact:
- WhatsApp ou email

7. Actions:
- `Enregistrer brouillon`
- `Publier`

## 7) Structure Ecran Recherche (`/annonces`)

Layout desktop:
- colonne gauche: filtres
- zone principale: resultats

Layout mobile:
- barre recherche sticky
- bouton `Filtres` ouvre bottom sheet

Carte annonce (obligatoire):
- photo principale
- titre
- ville
- loyer
- chambres dispo
- date dispo
- badge `nouveau` si < 7 jours

Etat vide:
- message clair
- suggestion d'elargir budget/ville
- CTA `Creer alerte` (placeholder V1, non active)

## 8) Structure Page Detail (`/annonces/[slug]`)

Above the fold:
- galerie photos
- titre
- ville
- loyer
- chambres dispo
- disponibilite
- CTA `Contacter`

Contenu principal:
- description logement
- ambiance coloc
- infos pratiques (bail, duree min si fournie)

Sidebar (desktop) / sticky footer (mobile):
- rappel prix + disponibilite
- bouton `Contacter` persistant

Bas de page:
- annonces similaires basiques (meme ville)

## 9) Textes UX a imposer

A utiliser:
- `annonce`
- `deposer`
- `recherche`
- `contacter`

A eviter en V1:
- `match`
- `score`
- `swipe`
- `compatibilite algorithmique`

## 10) Criteres d'acceptation produit

- un nouvel annonceur publie une annonce complete sans support
- un chercheur trouve une annonce et clique contact en < 3 minutes
- aucun ecran coeur de V1 n'impose une logique de matching

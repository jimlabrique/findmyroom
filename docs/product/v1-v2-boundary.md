# V1 vs V2 - Frontiere Produit

Date: 2026-04-14
Statut: actif

## Decision ferme

La V1 est une marketplace d'annonces colocation.
Le matching n'est pas un pilier V1.

## Ce qui entre en V1

- auth Google
- depot annonce
- liste annonces
- detail annonce
- recherche/filtres simples
- contact annonceur (WhatsApp/email)
- gestion basique de ses annonces

## Ce qui sort de V1 (deplace en V2+)

- swipe cards
- like/match mutuel
- score comportemental avance
- shortlist automatique de candidats
- tunnel de pre-tri long
- chat interne riche

## Pourquoi ce de-scope est bon

- reduit le temps de build
- reduit les risques de comprehension produit
- permet de valider une vraie utilite immediate (publier/trouver/contacter)
- evite de sur-promettre un "algo magique" sans base data suffisante

## Signal GO pour ouvrir V2

On ajoute des suggestions intelligentes uniquement si la V1 prouve:
- traction offre (annonces actives)
- traction demande (contacts declenches)
- qualite percue superieure a Facebook sur clarte et vitesse

## Format V2 recommande (progressif)

1. Suggestions "annonces similaires" plus intelligentes
2. Formulaire preferences leger pour chercheurs
3. "Top picks" explainable sans swipe
4. Eventuellement matching leger, jamais coeur unique du produit

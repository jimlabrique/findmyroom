---
date: 2026-04-16
topic: coloc-studio-listing-types
status: active
---

# Colocation + Studio Brainstorm

## What We're Building

FindMyRoom reste une marketplace simple d'annonces, mais avec 2 types d'annonce en V1:

- `Colocation`
- `Studio`

Le dépôt commence par le choix du type, puis le formulaire s'adapte.  
On garde une recherche unique (`/annonces`) avec un filtre `Type`, par défaut sur `Colocation`.

## Why This Approach

Approche retenue:

- 2 types explicites, pas un seul modèle ambigu.
- un flux de recherche unique avec filtre, pour éviter de fragmenter le trafic.
- formulaire conditionnel après choix du type, pour garder une UX claire sans multiplier les pages.

Ce choix évite le piège "tout mélanger" qui rend les filtres moins fiables, tout en ouvrant le produit aux studios sans refonte lourde.

## Key Decisions

- Type d'annonce obligatoire: `Colocation` ou `Studio`.
- Page annonces unique avec filtre type.
- Valeur par défaut du filtre type: `Colocation`.
- Bloc "parties communes":
- `Colocation`: bloc complet (salon, cuisine, SDB partagée/privée, extérieur, équipements).
- `Studio`: bloc allégé (équipements + extérieur).
- Dépôt: étape 1 = choix type, ensuite formulaire conditionnel.

## Open Questions

- Le filtre type doit-il proposer `Tous` en plus de `Colocation` et `Studio`, ou rester strictement binaire ?
- Le studio doit-il rester limité à `1 chambre` en V1, ou accepter des variantes (ex: studio + coin nuit) ?

## Next Steps

1. Faire la spec fonctionnelle V1 de ce scope.
2. Planifier la migration de données (`listing_type` + champs conditionnels).
3. Implémenter UI dépôt + recherche + détail en gardant la simplicité actuelle.

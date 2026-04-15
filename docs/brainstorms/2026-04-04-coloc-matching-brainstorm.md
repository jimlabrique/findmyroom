---
date: 2026-04-04
topic: coloc-matching
status: archived
superseded_by:
  - ../product/v1-marketplace-prd.md
  - ../product/v1-screens-and-flows.md
---

# Coloc Matching Brainstorm

> Archive note (2026-04-14):
> ce document decrit une these "matching-first" qui n'est plus le cap du produit.
> Le cap actif est "marketplace d'annonces first" dans `docs/product/`.

## What We're Building

Nous construisons une plateforme de matching pour la colocation.

Le point de départ n'est pas "trouver une chambre", mais "savoir avec qui on va vivre avant de s'engager". La v1 cible un cas concret: une coloc existante avec une chambre libre qui cherche la bonne personne. Le produit doit aider cette coloc a eliminer les mauvais matchs avant la visite, pas juste a recevoir plus de messages.

Le coeur du produit est un moteur de compatibilite de vie: habitudes du quotidien, attentes de cohabitation, points de friction, red flags. Les plateformes actuelles matchent surtout une chambre avec un budget et une localisation. Ici, on matche des humains avec une dynamique de coloc.

## Why This Approach

Trois voies etaient possibles:

- `Listings-first`: meilleure annonce, meilleurs filtres, meilleure messagerie.
- `Tinder-first`: likes, matchs mutuels, cartes et swipe.
- `Matching-first`: annonce + questionnaire structure + score explique + shortlist.

Le bon choix est `matching-first`.

Le probleme observe n'est pas le manque d'annonces. Le probleme, c'est qu'une coloc recoit beaucoup de candidatures mais n'a aucun moyen fiable d'anticiper la compatibilite du quotidien avant la visite. Un produit centre sur le matching attaque ce vrai point de douleur. Les deux autres approches sont plus faciles a pitcher que vraiment utiles.

## Key Decisions

- `Wedge initial`: une coloc existante avec une chambre libre.
- `Client principal au lancement`: la coloc qui publie la chambre.
- `Promesse produit`: eviter les mauvais matchs de cohabitation avant la visite.
- `Critere principal de matching`: compatibilite de mode de vie.
- `Logique de matching`: red flags + habitudes compatibles, avec priorite aux red flags.
- `Structure de profil`: profil unique de la coloc en v1, mini-profils plus tard.
- `Core flow`: candidature structuree, pas swipe mutuel.
- `Format de candidature`: questionnaire de vie structure.
- `Sortie du matching`: score + explications claires sur alignements et frictions.
- `Segments`: etudiants et jeunes actifs, separes par defaut, melangeables si la coloc l'accepte.
- `Positionnement`: app de matching pour la colocation.
- `Business model de depart`: freemium cote coloc, pas paiement a la publication.
- `Zone de lancement`: Bruxelles.
- `Canal d'acquisition initial`: groupes Facebook et communautes logement.
- `Validation prioritaire`: prouver que le filtre de compatibilite change vraiment la facon de trier.
- `Premier test`: concierge test manuel.

## What Not To Build Now

- Un swipe mutuel facon Tinder.
- Les contrats, paiements et paperasse locative.
- Les groupes de solos qui cherchent un logement ensemble.
- Un profil detaille de chaque habitant des le premier jour.
- Un algorithme opaque qui pretend lire dans les ames.
- Une expansion "Belgique entiere" des le depart.

## Open Questions

- Quelles dimensions exactes du questionnaire ont le meilleur pouvoir predictif ?
- Quel niveau de friction est acceptable pour que les candidats completent leur profil ?
- Quelles options premium meritent d'etre payees par une coloc ?
- Quel nom et quelle identite donnent une impression de confiance, pas une app gadget ?

## Deck Narrative

Le deck doit vendre une these, pas une usine a fantasmes.

These centrale:

> Le probleme de la colocation n'est pas de trouver une chambre. C'est de savoir avec qui on va vivre avant de s'engager.

L'angle a tenir du debut a la fin:

- Les plateformes actuelles optimisent l'annonce.
- Le vrai risque est humain.
- Notre produit reduit ce risque plus tot dans le parcours.

## Suggested 10-Page Deck

### 1. Cover

**Titre**

Matchmaking for shared living

**Sous-titre**

Helping flatshares choose the right roommate before the visit.

**But**

Installer une promesse nette et adulte. Pas "Tinder pour la coloc". Cette formule attire l'attention et tue la credibilite en meme temps.

### 2. The Problem

**Message**

Une coloc publie une chambre, recoit des dizaines de messages, mais ne sait pas qui sera vraiment compatible au quotidien.

**A mettre visuellement**

- Inbox surchargee
- Trop peu de signaux utiles
- La compatibilite est invisible avant la visite

### 3. Why Existing Platforms Fail

**Message**

Les plateformes existantes matchent une chambre avec un budget. Elles ne matchent pas une vie commune.

**Contraste simple**

- Filters today: prix, localisation, disponibilite
- Missing layer: rythme de vie, proprete, bruit, invites, habitudes, attentes

### 4. The Solution

**Message**

Une plateforme de matching pour la colocation qui mesure la compatibilite de vie entre une coloc existante et ses candidats.

**Produit**

- annonce de chambre
- questionnaire structure
- score de compatibilite
- explication des points d'alignement et de friction

### 5. Product Experience

**Flow**

1. La coloc publie une chambre
2. Le candidat remplit son profil et son questionnaire
3. La coloc recoit une shortlist triee par compatibilite
4. Le chat et la visite arrivent apres le tri

**Point a marteler**

Le chat ne doit pas etre le debut du produit. Il doit etre la consequence d'un pre-tri intelligent.

### 6. Target Market Entry

**Message**

Le bon point d'entree n'est pas "tout le marche de la location". C'est un usage precis, douloureux, repetitif: les colocs existantes avec une chambre libre a Bruxelles.

**Focus initial**

- Bruxelles
- etudiants
- jeunes actifs
- separation par defaut entre segments

### 7. Why This Wedge Can Win

**Message**

La valeur n'est pas d'apporter plus de volume. La valeur est de reduire le risque humain dans une decision recurrente et stressante.

**Arguments**

- Douleur concrete et frequente
- Offre deja existante dans des canaux chaotiques
- Gain immediat pour la coloc: moins de temps perdu, moins de mauvais profils, moins de visites inutiles

### 8. Business Model

**Message**

Freemium cote coloc.

**Hypothese**

- publication gratuite
- matching basique gratuit
- premium pour tri avance, shortlist enrichie, signaux prioritaires, contact prioritaire

**Pourquoi**

Faire payer la publication trop tot freine l'offre. Faire payer le candidat trop tot freine l'adoption. Mauvaise idee des deux cotes.

### 9. Validation Plan

**Message**

Ne pas construire une app complete avant d'avoir prouve que la compatibilite change vraiment la facon de trier.

**Premier test**

Concierge test manuel:

1. Sourcer des chambres existantes
2. Faire remplir un questionnaire aux candidats
3. Produire une shortlist a la main
4. Mesurer si les colocs trouvent cela meilleur que leur tri habituel

### 10. What We Need To Prove Next

**Message**

Le projet merite d'etre creuse si trois signaux apparaissent vite:

- les colocs acceptent de publier ou de tester le service
- elles trouvent le filtre assez utile pour changer leur tri
- les candidats completent un profil suffisamment riche sans abandonner

**Close**

The idea is not another housing marketplace.
It is a compatibility layer for shared living.

## Visual Direction For The Deck

Le deck doit paraitre net, urbain, credible. Pas startup candy, pas template de consultant.

- `Look`: editorial, minimal, dense juste ce qu'il faut.
- `Palette`: neutres chauds + une couleur d'accent franche.
- `Mood`: Bruxelles, vie urbaine, appartement partage, real life.
- `Visuals`: captures de flows simules, cartes de score, tableaux comparatifs, pas de stock photos de gens qui rient devant une salade.

## Next Steps

1. Transformer ce brief en vrai deck 10 pages avec wording final slide par slide.
2. Designer la presentation avec une direction visuelle nette.
3. Exporter en PDF propre pour ton associe.

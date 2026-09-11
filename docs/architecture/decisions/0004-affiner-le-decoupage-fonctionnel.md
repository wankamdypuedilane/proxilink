# ADR 0004 — Affiner le découpage fonctionnel

- Statut : accepté
- Date : 10 septembre 2026
- Décideur : Dilane Junior Wankam Dypue

## Contexte

L’ADR 0001 adopte un monolithe modulaire et identifie initialement les modules `account`, `provider`, `service`, `availability`, `booking` et `admin`.

Avant l’initialisation du backend, plusieurs ambiguïtés ont été constatées :

- `service` peut être confondu avec la couche applicative Spring et l’annotation `@Service` ;
- la recherche du MVP ne possède ni index ni données propres ;
- un module générique `shared` risquerait de devenir une dépendance commune non maîtrisée ;
- les noms fonctionnels et les noms techniques doivent rester cohérents.

Cette décision affine le découpage défini par l’ADR 0001 sans remettre en cause le choix du monolithe modulaire.

## Options envisagées

### Option 1 — Conserver les noms initiaux

Avantages :

- aucune modification documentaire ;
- correspondance directe avec le vocabulaire fonctionnel initial.

Inconvénients :

- ambiguïté autour du nom `service` ;
- séparation insuffisamment claire entre une capacité de recherche et un véritable module ;
- risque de créer un module partagé sans responsabilité précise.

### Option 2 — Affiner les noms et responsabilités avant l’implémentation

Avantages :

- vocabulaire technique moins ambigu ;
- modules fondés sur des responsabilités et des données métier ;
- réduction du risque de dépendances transversales ;
- structure plus facilement contrôlable avec Spring Modulith.

Inconvénients :

- mise à jour nécessaire de la documentation ;
- correspondance à expliquer entre certains termes métier français et les packages techniques anglais.

## Décision

Les modules fonctionnels initiaux du backend seront :

- `account` : identité, authentification et état des comptes ;
- `provider` : profils et informations propres aux prestataires ;
- `catalog` : publication, consultation et recherche simple des prestations ;
- `availability` : définition et consultation des disponibilités ;
- `booking` : création et suivi des réservations ;
- `admin` : cas d’utilisation réservés à l’administration.

Le nom `catalog` remplace `service` afin d’éviter la confusion avec les services applicatifs Spring.

Le module `availability` reste autonome, car il porte des règles métier propres et participera à la prévention des doubles réservations.

La recherche par mot-clé et par catégorie est une capacité du module `catalog` dans le MVP. Un module `search` ne sera créé que si la recherche obtient ultérieurement ses propres données, son propre index ou un besoin de dimensionnement indépendant.

Aucun module métier générique `shared` ne sera créé. Les éléments techniques partagés devront rester minimaux, explicites et ne devront pas contenir de logique métier appartenant à un module fonctionnel.

Les packages techniques utiliseront les noms anglais `catalog`, `booking` et `admin`, tandis que l’interface utilisateur et la documentation fonctionnelle pourront employer les termes français « prestations », « réservations » et « administration ».

## Conséquences positives

- responsabilités des modules plus explicites ;
- absence d’ambiguïté entre le domaine et l’annotation Spring `@Service` ;
- maintien d’un module dédié aux disponibilités ;
- limitation des modules sans données ni règles propres ;
- réduction du risque de créer un module partagé servant de fourre-tout.

## Conséquences négatives

- certains termes techniques diffèrent du vocabulaire fonctionnel français ;
- la documentation initiale doit être mise à jour ;
- le découpage devra continuer à être réévalué à partir des règles métier découvertes.

## Réévaluation

Cette décision devra être réévaluée si :

- la recherche nécessite un index ou un stockage propre ;
- le module `availability` ne porte finalement aucune règle indépendante ;
- le module `admin` commence à contenir de la logique métier appartenant aux autres modules ;
- des éléments techniques partagés deviennent trop nombreux ou créent des dépendances cycliques.
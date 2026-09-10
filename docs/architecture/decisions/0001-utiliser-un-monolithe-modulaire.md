# ADR 0001 — Utiliser un monolithe modulaire

- Statut : accepté
- Date : 10 septembre 2026
- Décideur : Dilane Junior Wankam Dypue

## Contexte

ProxiLink est une marketplace locale dont le MVP doit permettre la gestion des comptes, des profils prestataires, des services, des disponibilités et des réservations.

Le projet est développé initialement par une seule personne. L’architecture doit donc rester simple à développer, tester et déployer, tout en empêchant un couplage excessif entre les domaines fonctionnels.

## Options envisagées

### Option 1 — Monolithe traditionnel en couches

Toute l’application est organisée principalement par couches techniques, par exemple contrôleurs, services et dépôts.

Avantages :

- structure simple à démarrer ;
- déploiement unique ;
- faible complexité opérationnelle.

Inconvénients :

- frontières métier peu visibles ;
- risque de dépendances incontrôlées ;
- évolution plus difficile lorsque l’application grandit.

### Option 2 — Monolithe modulaire

L’application reste une seule unité de déploiement, mais son code est organisé en modules fonctionnels possédant des frontières explicites.

Avantages :

- faible complexité de déploiement ;
- séparation claire des responsabilités ;
- tests possibles par module ;
- préparation d’une éventuelle extraction future de certains modules.

Inconvénients :

- discipline nécessaire pour respecter les frontières ;
- risque de couplage si les dépendances ne sont pas vérifiées ;
- base de données et processus de déploiement partagés.

### Option 3 — Microservices

Chaque domaine fonctionnel est développé et déployé comme un service indépendant.

Avantages :

- déploiement et dimensionnement indépendants ;
- forte isolation entre les services ;
- liberté technologique par service.

Inconvénients :

- forte complexité opérationnelle ;
- communication réseau et cohérence distribuée à gérer ;
- observabilité et déploiement plus difficiles ;
- coût disproportionné pour une seule personne et un MVP.

## Décision

ProxiLink adoptera une architecture en monolithe modulaire.

L’application sera déployée comme une seule unité Spring Boot. Elle sera organisée en modules fonctionnels correspondant aux domaines métier.

Chaque module :

- possédera ses responsabilités ;
- exposera une interface publique limitée ;
- masquera ses détails internes ;
- ne dépendra pas directement des éléments internes d’un autre module.

Les relations JPA et les règles précises de communication entre modules feront l’objet d’une décision séparée.

## Contrôle des frontières

Spring Modulith sera utilisé pour analyser la structure modulaire.

Un test d’architecture vérifiera notamment l’absence de cycles et le respect des dépendances autorisées :

```java
@Test
void verifiesModularStructure() {
    ApplicationModules.of(ProxiLinkApplication.class).verify();
}
```

Ce test sera exécuté dans le pipeline GitHub Actions. Une violation des frontières modulaires fera échouer le build.

## Conséquences

### Conséquences positives

- une seule application à construire et à déployer ;
- organisation du code par domaines métier ;
- frontières modulaires vérifiables automatiquement ;
- complexité adaptée au MVP et à une équipe réduite ;
- possibilité d’extraire ultérieurement un module si cela devient nécessaire.

### Conséquences négatives

- tous les modules partagent le même processus de déploiement ;
- une panne de l’application peut affecter l’ensemble des fonctionnalités ;
- la base de données reste partagée ;
- le respect des frontières nécessite des tests d’architecture et une discipline continue.

## Réévaluation

Cette décision devra être réévaluée si au moins l’une des situations suivantes apparaît :

- plus de deux équipes travaillent durablement sur des domaines distincts ;
- le build complet dépasse régulièrement dix minutes ;
- un module nécessite un dimensionnement ou une disponibilité propres ;
- un module instable bloque régulièrement le déploiement des autres modules ;
- les différents domaines nécessitent des fréquences de déploiement incompatibles.
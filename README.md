# ProxiLink

Projet de marketplace de services de proximité conçu pour être développé en Java avec une démarche Agile, TDD et CI/CD.

> **Statut : Phase 1 — découverte et planification.**
> Le dépôt ne contient pas encore de code. Les travaux en cours portent sur la vision produit, le cadrage du MVP et la préparation du backlog.

## Le problème

Les habitants peuvent avoir des difficultés à trouver rapidement des prestataires locaux disponibles et fiables, à comparer leurs offres et à réserver un service simplement. De leur côté, les prestataires manquent parfois de visibilité et d'un outil centralisé pour gérer leurs demandes.

## La solution

ProxiLink est une marketplace web responsive qui met en relation des clients avec des prestataires locaux vérifiés.

**Proposition de valeur :** trouver et réserver simplement un service de proximité auprès d'un prestataire vérifié.

Le lancement est prévu à Brest, avec une évolution possible vers d'autres villes et pays.

## Utilisateurs visés

- Clients particuliers
- Prestataires particuliers
- Prestataires professionnels ou autoentrepreneurs
- Administrateurs

Un même compte peut être à la fois client et prestataire.

## Périmètre du MVP

Le MVP se concentre sur un parcours principal unique, de la création de compte au suivi d'une réservation :

1. Un utilisateur crée un compte.
2. Il demande à devenir prestataire.
3. L'administrateur valide ou refuse son profil.
4. Le prestataire validé publie un service.
5. Un client recherche et consulte ce service.
6. Le client propose un horaire et envoie une demande.
7. Le prestataire accepte ou refuse la demande.
8. Les utilisateurs consultent le statut de la réservation.

Les catégories initiales sont la cuisine, la coiffure et les cours particuliers.

Le parcours est considéré comme réussi lorsqu'il peut être exécuté de bout en bout, avec ses comportements essentiels testés, documentés et intégrés par la chaîne CI.

## Documentation

- [Vision produit](docs/product-vision.md) — version 0.1

Elle détaille les modes de prestation, la tarification, le modèle économique, la vérification des prestataires, les epics du MVP, les évolutions envisagées hors MVP et les contraintes du projet.

## Contraintes

- Développement individuel, 3 à 5 heures par semaine
- Sprints de deux semaines
- Première version présentable visée en 12 semaines
- Tests, assurance qualité (QA), sécurité, documentation et CI/CD intégrés progressivement

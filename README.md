# ProxiLink

ProxiLink est une marketplace web de services de proximité mettant en relation des clients avec des prestataires locaux vérifiés.

Le projet est développé avec une démarche Agile intégrant progressivement les tests, la qualité, la sécurité, la documentation et la CI/CD.

> **Statut : développement du MVP en cours.**
> L’architecture initiale et le socle technique du backend Spring Boot sont disponibles.

## Le problème

Les habitants peuvent avoir des difficultés à trouver rapidement des prestataires locaux disponibles et fiables, à comparer leurs offres et à réserver un service simplement. De leur côté, les prestataires manquent parfois de visibilité et d’un outil centralisé pour gérer leurs demandes.

## La solution

ProxiLink fournit une marketplace web responsive permettant de trouver et de réserver simplement un service de proximité auprès d’un prestataire vérifié.

Le lancement est prévu à Brest, avec une évolution possible vers d’autres villes et pays.

## Utilisateurs visés

- clients particuliers ;
- prestataires particuliers ;
- prestataires professionnels ou autoentrepreneurs ;
- administrateurs.

Un même compte peut être à la fois client et prestataire.

## Périmètre du MVP

Le MVP se concentre sur un parcours principal allant de la création d’un compte au suivi d’une réservation :

1. un utilisateur crée un compte ;
2. il demande à devenir prestataire ;
3. l’administrateur valide ou refuse son profil ;
4. le prestataire validé publie un service ;
5. un client recherche et consulte ce service ;
6. le client propose un horaire et envoie une demande ;
7. le prestataire accepte ou refuse la demande ;
8. les utilisateurs consultent le statut de la réservation.

Les catégories initiales sont la cuisine, la coiffure et les cours particuliers.

## Architecture

ProxiLink adopte une architecture en monolithe modulaire.

Le backend est organisé en modules fonctionnels :

- `account` ;
- `provider` ;
- `catalog` ;
- `availability` ;
- `booking` ;
- `admin`.

Les frontières entre les modules sont contrôlées avec Spring Modulith.

## Technologies principales

- Java 21 ;
- Spring Boot ;
- Maven ;
- Spring Modulith ;
- PostgreSQL 16 ;
- Flyway ;
- Spring Security ;
- Docker Compose ;
- JUnit 5 ;
- Mockito ;
- Testcontainers ;
- JaCoCo.

## Prérequis du backend

- Java 21 ;
- Docker et Docker Compose ;
- Git.

Le Maven Wrapper est fourni avec le projet. Une installation globale de Maven n’est donc pas nécessaire.

## Configuration locale

Depuis la racine du dépôt :

```bash
cd backend
cp .env.example .env
```

Renseigner ensuite une valeur locale pour `POSTGRES_PASSWORD` dans le fichier `.env`.

Le fichier `.env` contient des données locales et ne doit jamais être ajouté à Git.

## Démarrage du backend

```bash
cd backend
./mvnw spring-boot:run
```

Spring Boot utilise Docker Compose pour démarrer la base PostgreSQL locale.

Une fois l’application démarrée, son état peut être vérifié avec :

```bash
curl http://localhost:8080/actuator/health
```

La réponse attendue est :

```json
{"groups":["liveness","readiness"],"status":"UP"}
```

## Tests et vérifications

Exécuter les tests :

```bash
cd backend
./mvnw test
```

Exécuter toutes les vérifications et produire le rapport JaCoCo :

```bash
cd backend
./mvnw verify
```

Le rapport de couverture est généré dans :

```text
backend/target/site/jacoco/index.html
```

## Documentation

- [Vision produit](docs/product-vision.md)
- [Architecture initiale](docs/architecture/initial-architecture.md)
- [Décisions d’architecture](docs/architecture/decisions/)
- [Documentation du Sprint 01](docs/sprints/sprint-01/)

## Organisation du projet

- développement individuel ;
- charge prévue de 3 à 5 heures par semaine ;
- sprints de 12 jours ;
- tests, sécurité, documentation et CI/CD intégrés progressivement.
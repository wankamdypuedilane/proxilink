# Tâche 17 — Initialiser le backend Spring Boot

## Informations générales

- **Sprint :** Sprint 01
- **Issue GitHub :** #17
- **Branche :** `feat/17-initialize-spring-boot-backend`
- **Composant :** Backend
- **Statut :** terminé

## 1. Objectif

Initialiser le backend de ProxiLink avec une base technique reproductible, testable et adaptée à une architecture monolithique modulaire.

Le backend doit notamment fournir :

- une application Spring Boot utilisant Java 21 et Maven ;
- une base PostgreSQL locale ;
- la gestion du schéma avec Flyway ;
- une structure fonctionnelle contrôlée par Spring Modulith ;
- un endpoint de santé avec Spring Boot Actuator ;
- des tests d’intégration avec Testcontainers ;
- un rapport de couverture avec JaCoCo.

## 2. Prérequis

Les outils suivants doivent être disponibles :

- Java 21 ;
- Docker ;
- Docker Compose ;
- Git ;
- un terminal compatible avec Maven Wrapper.

Vérification :

```bash
java -version
docker --version
docker compose version
```

Versions utilisées pendant la réalisation :

```text
OpenJDK 21.0.12.1
Docker 26.1.5
Docker Compose 2.26.1
```

Le projet utilise Maven Wrapper. Il n’est donc pas nécessaire d’installer Maven globalement.

L’intégrité de la distribution Maven téléchargée par le wrapper est contrôlée avec la propriété `distributionSha256Sum`.

Le script Unix conserve le téléchargement au format ZIP. Il utilise `unzip` lorsque cet outil est disponible et se rabat sur l’outil `jar` fourni par le JDK dans le cas contraire. Après une extraction avec `jar`, le droit d’exécution du programme Maven est restauré automatiquement.

Ce fonctionnement permet au wrapper de rester utilisable dans un environnement WSL ne disposant pas de `unzip`, tout en vérifiant l’intégrité de l’archive téléchargée.

## 3. Génération du projet

Le projet a été généré avec Spring Initializr en utilisant les paramètres suivants :

| Paramètre | Valeur |
|---|---|
| Type de projet | Maven |
| Langage | Java |
| Spring Boot | 4.1.1 |
| Group | `com.proxilink` |
| Artifact | `proxilink-backend` |
| Package | `com.proxilink` |
| Packaging | Jar |
| Java | 21 |
| Configuration | YAML |

Dépendances sélectionnées :

- Spring Web ;
- Spring Data JPA ;
- Spring Security ;
- Validation ;
- PostgreSQL Driver ;
- Flyway Migration ;
- Spring Boot Actuator ;
- Spring Modulith ;
- Docker Compose Support ;
- Testcontainers.

## 4. Extraction de l’archive

La commande `unzip` n’était pas installée dans WSL :

```text
bash: unzip: command not found
```

L’archive Spring Initializr a donc été extraite avec l’outil `jar`, déjà fourni avec Java :

```bash
jar -xf /path/to/proxilink-backend.zip
```

Le contenu initialement extrait dans un sous-dossier `proxilink-backend/` a ensuite été déplacé directement dans `backend/`.

La racine du backend contient notamment :

```text
backend/
├── .mvn/
├── src/
├── compose.yaml
├── mvnw
├── mvnw.cmd
└── pom.xml
```

Le fichier `pom.xml` confirme l’utilisation de Spring Boot 4.1.1 :

```bash
./mvnw help:evaluate \
  -Dexpression=project.parent.version \
  -q \
  -DforceStdout
```

## 5. Configuration de PostgreSQL

Le fichier `compose.yaml` fournit une base PostgreSQL locale :

```yaml
services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: ${POSTGRES_DB:-proxilink}
      POSTGRES_USER: ${POSTGRES_USER:-proxilink}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:?Define POSTGRES_PASSWORD in backend/.env}
    ports:
      - "127.0.0.1:5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data

volumes:
  pgdata:
```

Le fichier `.env.example` documente les variables nécessaires sans contenir de mot de passe :

```dotenv
POSTGRES_DB=proxilink
POSTGRES_USER=proxilink
POSTGRES_PASSWORD=
```

Après un nouveau clonage du dépôt, chaque développeur crée sa configuration locale :

```bash
cp .env.example .env
```

Il doit ensuite renseigner une valeur locale pour `POSTGRES_PASSWORD` dans `.env` avant de démarrer PostgreSQL ou de valider la configuration Docker Compose.

Le fichier `.env` est ignoré par Git et ne doit jamais être ajouté au dépôt.

### Pourquoi utiliser `postgres:16-alpine` ?

`postgres:latest` peut changer automatiquement de version majeure. Deux développeurs peuvent alors recevoir des versions différentes sans avoir modifié le projet.

`postgres:16-alpine` permet :

- de fixer la version majeure à PostgreSQL 16 ;
- de recevoir les corrections compatibles de PostgreSQL 16 ;
- d’éviter une migration majeure imprévue ;
- d’utiliser une image Alpine plus compacte.

Les identifiants présents dans ce fichier sont exclusivement destinés au développement local. Ils ne doivent pas être réutilisés en production.

Validation de la configuration :

```bash
docker compose config --quiet
```

## 6. Configuration de Spring Boot

Le fichier `src/main/resources/application.yaml` contient :

```yaml
spring:
  application:
    name: proxilink-backend

  jpa:
    hibernate:
      ddl-auto: validate
    open-in-view: false

  flyway:
    enabled: true

management:
  endpoints:
    web:
      exposure:
        include: health,info
  endpoint:
    health:
      show-details: when-authorized
      probes:
        enabled: true
```

### Explication des propriétés

#### `ddl-auto: validate`

Hibernate compare les entités Java avec le schéma présent dans PostgreSQL.

Il arrête l’application si les deux structures sont incompatibles, mais il ne crée, ne supprime et ne modifie aucune table.

Le schéma reste ainsi sous le contrôle des migrations Flyway.

#### `flyway.enabled: true`

Flyway exécute les migrations SQL versionnées au démarrage de l’application.

Les futures migrations devront être placées dans :

```text
src/main/resources/db/migration/
```

Exemple de nom :

```text
V1__create_account_table.sql
```

#### `open-in-view: false`

Cette propriété empêche la session JPA de rester ouverte pendant la génération de la réponse HTTP.

Elle aide à éviter :

- les requêtes SQL cachées dans la couche web ;
- les problèmes de chargement tardif ;
- le mélange entre accès aux données et présentation HTTP.

#### `include: health,info`

Seuls les endpoints Actuator utiles à cette étape sont exposés :

- `/actuator/health` ;
- `/actuator/info`.

Les autres informations internes ne sont pas publiées.

#### `show-details: when-authorized`

Le statut général de santé peut être consulté publiquement, mais les détails sensibles sont réservés aux utilisateurs autorisés.

## 7. Architecture monolithique modulaire

Les modules fonctionnels suivants ont été créés :

```text
com.proxilink
├── account
├── provider
├── catalog
├── availability
├── booking
└── admin
```

Chaque module possède un fichier `package-info.java` annoté avec :

```java
@org.springframework.modulith.ApplicationModule
```

Les dépendances autorisées sont :

| Module | Dépendances autorisées |
|---|---|
| `account` | aucune |
| `provider` | `account` |
| `catalog` | `provider` |
| `availability` | `provider` |
| `booking` | `account`, `catalog`, `availability` |
| `admin` | `account`, `provider`, `catalog`, `booking` |

Exemple :

```java
@org.springframework.modulith.ApplicationModule(
    allowedDependencies = {
        "account",
        "catalog",
        "availability"
    }
)
package com.proxilink.booking;
```

Cette organisation empêche les dépendances arbitraires entre domaines.

Le détail de cette décision est conservé dans :

```text
docs/architecture/decisions/0004-affiner-le-decoupage-fonctionnel.md
```

## 8. Test de l’architecture

Le fichier suivant a été ajouté :

```text
src/test/java/com/proxilink/ModularArchitectureTests.java
```

Contenu :

```java
package com.proxilink;

import org.junit.jupiter.api.Test;
import org.springframework.modulith.core.ApplicationModules;

class ModularArchitectureTests {

    @Test
    void verifiesModularStructure() {
        ApplicationModules.of(ProxilinkBackendApplication.class).verify();
    }
}
```

Ce test analyse les modules et échoue lorsqu’une dépendance non autorisée ou un cycle architectural est détecté.

Exécution ciblée :

```bash
./mvnw -Dtest=ModularArchitectureTests test
```

Résultat obtenu :

```text
Tests run: 1, Failures: 0, Errors: 0, Skipped: 0
BUILD SUCCESS
```

### Erreurs rencontrées

Le fichier de test avait initialement été créé par erreur dans :

```text
src/main/java/
```

Il a été déplacé dans :

```text
src/test/java/
```

Une première commande contenait également une faute de frappe :

```bash
./mvnw -Dtest=ModularArchitectureTests testy
```

Maven a correctement signalé :

```text
Unknown lifecycle phase "testy"
```

La phase Maven correcte est `test`.

## 9. Test d’intégration avec Testcontainers

Le test de contexte utilise Testcontainers pour démarrer une base PostgreSQL temporaire dans Docker.

La configuration se trouve dans :

```text
src/test/java/com/proxilink/TestcontainersConfiguration.java
```

L’image a été alignée avec l’environnement local :

```java
return new PostgreSQLContainer(
    DockerImageName.parse("postgres:16-alpine")
);
```

Ainsi, les tests et l’environnement local utilisent la même version majeure de PostgreSQL.

La base de test :

- est créée automatiquement ;
- utilise un port disponible choisi dynamiquement ;
- est supprimée à la fin des tests ;
- ne dépend pas de données présentes sur la machine du développeur.

## 10. Ajustement de Spring Modulith

La dépendance suivante, ajoutée initialement par Spring Initializr, a été retirée :

```xml
<dependency>
    <groupId>org.springframework.modulith</groupId>
    <artifactId>spring-modulith-starter-jpa</artifactId>
</dependency>
```

Elle activait la persistance des événements Modulith et Hibernate attendait notamment une table `event_publication`.

Comme aucune migration SQL ne créait encore cette table et que la configuration utilise :

```yaml
ddl-auto: validate
```

le démarrage des tests échouait.

La persistance des événements Modulith n’est pas nécessaire pour le squelette actuel. Elle pourra être introduite ultérieurement avec une migration Flyway explicite si le projet en a besoin.

La dépendance `spring-boot-starter-data-jpa` est conservée : JPA reste donc disponible pour les futurs modèles métier.

## 11. Couverture des tests avec JaCoCo

Le plugin JaCoCo 0.8.15 a été ajouté au `pom.xml`.

Il exécute deux objectifs :

- `prepare-agent` : collecte les informations pendant les tests ;
- `report` : produit le rapport pendant la phase Maven `verify`.

Commande :

```bash
./mvnw verify
```

Rapport généré :

```text
target/site/jacoco/index.html
```

Ouverture depuis WSL dans le navigateur Windows :

```bash
explorer.exe "$(wslpath -w target/site/jacoco/index.html)"
```

Le rapport initial affiche environ 37 % de couverture.

Ce pourcentage est peu représentatif, car le projet ne contient encore qu’une classe de démarrage et aucun code métier. Aucun seuil minimal n’est donc imposé à cette étape.

Un seuil de couverture pourra être défini lorsque les premiers cas d’utilisation métier seront implémentés.

## 12. Démarrage de l’application

Commande :

```bash
./mvnw spring-boot:run
```

Spring Boot :

1. lit `compose.yaml` ;
2. démarre PostgreSQL avec Docker Compose ;
3. exécute Flyway ;
4. initialise JPA et Hibernate ;
5. démarre Tomcat sur le port 8080 ;
6. expose les endpoints Actuator autorisés.

Résultat :

```text
Tomcat started on port 8080
Started ProxilinkBackendApplication
```

Spring Security génère actuellement un mot de passe temporaire de développement. Une véritable gestion de l’authentification sera mise en place dans une future user story.

## 13. Vérification de l’état de santé

Dans un second terminal :

```bash
curl -i http://localhost:8080/actuator/health
```

Réponse obtenue :

```http
HTTP/1.1 200
Content-Type: application/vnd.spring-boot.actuator.v3+json
```

```json
{
  "groups": ["liveness", "readiness"],
  "status": "UP"
}
```

Interprétation :

- `HTTP 200` : la requête a réussi ;
- `UP` : l’application est opérationnelle ;
- `liveness` : le processus fonctionne ;
- `readiness` : l’application est prête à recevoir des requêtes.

## 14. Arrêt de l’environnement

L’application est arrêtée avec :

```text
Ctrl+C
```

Spring Boot arrête également le service Docker Compose qu’il avait démarré.

Vérification :

```bash
docker ps
```

Aucun conteneur actif ne doit rester après l’arrêt.

Le volume `pgdata` est toutefois conservé pour préserver les données locales entre deux démarrages.

## 15. Vérifications finales

Compilation :

```bash
./mvnw -DskipTests compile
```

Test architectural :

```bash
./mvnw -Dtest=ModularArchitectureTests test
```

Ensemble des tests :

```bash
./mvnw test
```

Cycle complet avec rapport JaCoCo :

```bash
./mvnw verify
```

Validation Docker Compose :

```bash
docker compose config --quiet
```

Contrôle de santé :

```bash
curl -i http://localhost:8080/actuator/health
```

Résultats obtenus :

```text
Tests run: 2
Failures: 0
Errors: 0
Skipped: 0
BUILD SUCCESS
```

## 16. Avertissements connus

Flyway affiche actuellement :

```text
No migrations found
```

Cet avertissement est attendu : aucune table métier n’a encore été créée. La première migration sera ajoutée avec le premier modèle persistant.

Mockito et la JVM affichent également des avertissements concernant le chargement dynamique d’un agent Java. Ils ne provoquent pas l’échec des tests et devront être traités dans une tâche technique distincte avant qu’une future version du JDK désactive ce comportement.

## 17. Résultat

À la fin de cette tâche :

- le backend Spring Boot compile ;
- l’application démarre avec Java 21 ;
- PostgreSQL 16 fonctionne avec Docker Compose ;
- les tests utilisent une base isolée avec Testcontainers ;
- Flyway contrôle l’évolution future du schéma ;
- Hibernate valide le schéma sans le modifier ;
- l’architecture modulaire est vérifiée automatiquement ;
- l’endpoint `/actuator/health` répond avec le statut `UP` ;
- JaCoCo génère un rapport de couverture ;
- aucun conteneur ne reste actif après l’arrêt ;
- aucun secret de production n’est stocké dans le dépôt.
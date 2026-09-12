# Tâche 18 — Configurer PostgreSQL et les migrations Flyway

## Informations générales

- **Sprint :** Sprint 1
- **Issue GitHub :** #18
- **Branche :** `feat/18-configure-postgresql-flyway`
- **Composant :** Backend / Base de données
- **Statut :** terminé

## 1. Objectif

Mettre en service la base de données PostgreSQL locale et le mécanisme de migration Flyway du backend ProxiLink.

L’issue #17 avait déclaré les dépendances et la configuration, mais le dossier des migrations n’existait pas. Aucune migration SQL versionnée n’avait donc encore été appliquée.

Cette tâche devait répondre aux besoins suivants :

- fournir une base PostgreSQL locale reproductible ;
- garder les identifiants hors du dépôt Git ;
- activer Flyway avec une première migration réellement appliquée ;
- vérifier que Flyway enregistre son historique dans la base ;
- établir les conventions de nommage des migrations futures ;
- confirmer que la chaîne complète fonctionne aussi en test isolé.

L’objectif n’était pas de créer des tables métier. Celles-ci relèvent des issues fonctionnelles qui suivront.

## 2. État initial hérité de l’issue #17

À la fin de l’issue #17, le backend disposait déjà :

- d’un service PostgreSQL décrit dans `backend/compose.yaml` ;
- d’un fichier `backend/.env.example` servant de modèle de configuration ;
- de la configuration Spring dans `backend/src/main/resources/application.yaml` ;
- des dépendances Flyway, PostgreSQL et Testcontainers dans `pom.xml`.

Il manquait le dossier des migrations. Flyway démarrait donc sans aucun script à exécuter et affichait :

```text
No migrations found
```

Cet avertissement était attendu à ce stade. Il est levé par la présente tâche.

## 3. Configuration de PostgreSQL avec Docker Compose

La base locale est décrite dans `backend/compose.yaml`.

Les points importants de cette configuration sont les suivants.

L’image utilisée est `postgres:16-alpine`. La version majeure est figée afin d’éviter une montée de version imprévue entre deux postes de travail. La variante Alpine réduit la taille de l’image.

Le port est publié sur `127.0.0.1:5432`. La base n’est donc accessible que depuis la machine locale et n’est pas exposée sur le réseau.

Les données sont conservées dans un volume nommé `pgdata`. La base survit ainsi à l’arrêt et au redémarrage du conteneur, ce qui permet de vérifier le comportement de Flyway sur une base déjà migrée.

Le nom de la base, l’utilisateur et le mot de passe proviennent de variables d’environnement, mais ils ne sont pas traités de la même façon.

`POSTGRES_DB` et `POSTGRES_USER` disposent chacun de la valeur par défaut `proxilink`. Cette valeur est purement locale et sert à démarrer la base de développement sans configuration supplémentaire. Elle peut être remplacée dans `backend/.env`.

`POSTGRES_PASSWORD` ne possède aucune valeur par défaut. Il doit être fourni dans `backend/.env`, faute de quoi Docker Compose refuse de démarrer.

Aucun mot de passe n’est donc enregistré dans `compose.yaml`.

Spring Boot démarre et arrête ce service automatiquement grâce au support Docker Compose ajouté lors de l’issue #17.

## 4. Gestion des variables d’environnement et des secrets

Les valeurs de connexion sont lues dans `backend/.env`.

Ce fichier est ignoré par Git. Les règles correspondantes se trouvent dans `backend/.gitignore` : `.env` et `.env.*` sont exclus, et seule l’exception `!.env.example` reste suivie.

Le modèle `backend/.env.example` est versionné et ne contient aucun mot de passe. Il déclare les clés attendues en laissant la valeur du mot de passe vide, afin que chaque développeur renseigne la sienne localement.

La variable `POSTGRES_PASSWORD` est obligatoire. Si elle n’est pas définie, Docker Compose refuse de démarrer et affiche un message explicite plutôt que de retomber sur une valeur par défaut. Cette contrainte évite qu’un mot de passe commun se glisse dans le dépôt ou dans les environnements partagés.

Préparation du fichier local :

```bash
cd backend
cp .env.example .env
```

La valeur de `POSTGRES_PASSWORD` doit ensuite être renseignée dans `backend/.env`. Elle n’est jamais reproduite dans la documentation ni dans les journaux de commande.

Validation de la syntaxe et de la résolution des variables :

```bash
docker compose config --quiet
```

La commande ne renvoie aucune sortie lorsque la configuration est valide.

## 5. Configuration de Flyway

La configuration se trouve dans `backend/src/main/resources/application.yaml`.

Deux propriétés se complètent.

Hibernate utilise `ddl-auto: validate`. Il compare les entités Java au schéma réel et interrompt le démarrage en cas d’incompatibilité, mais il ne crée, ne modifie et ne supprime aucune table.

Flyway est activé. Il exécute au démarrage les scripts SQL versionnés trouvés dans `src/main/resources/db/migration/`.

La responsabilité du schéma est donc entièrement portée par les migrations. Hibernate ne joue qu’un rôle de contrôle. Cette séparation rend l’évolution du schéma explicite, relisible en pull request et identique sur tous les environnements.

## 6. Migration `V1__initialize_database.sql`

Le dossier des migrations a été créé :

```text
backend/src/main/resources/db/migration/
```

Il contient le premier script :

```text
V1__initialize_database.sql
```

Son contenu se limite à deux commentaires :

```sql
-- Initial Flyway migration for the ProxiLink database.
-- Business tables will be introduced by migrations owned by their respective modules.
```

Ce choix est volontaire. Il s’agit d’une migration technique initiale, sans table métier.

Elle remplit deux fonctions. Elle permet d’abord de vérifier le mécanisme de migration de bout en bout : détection du script, exécution, création de l’historique. Elle évite ensuite d’anticiper les modèles persistants des futures issues, dont le découpage appartient aux modules fonctionnels concernés.

Créer une table métier ici aurait figé des décisions de modélisation qui n’ont pas encore été prises.

## 7. Vérification sur la base PostgreSQL locale

Démarrage de la base seule :

```bash
cd backend
docker compose up -d
docker compose ps
```

Démarrage de l’application :

```bash
cd backend
./mvnw spring-boot:run
```

Inspection de l’historique enregistré par Flyway :

```bash
docker compose exec postgres sh -c \
  'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c "SELECT installed_rank, version, description, type, success FROM flyway_schema_history ORDER BY installed_rank;"'
```

L’utilisateur et la base sont lus depuis l’environnement du conteneur. Aucun identifiant n’apparaît donc dans la commande.

Flyway a créé la table `flyway_schema_history` et y a inscrit la migration avec la version `1`, la description `initialize database`, le type `SQL` et l’indicateur `success` à `true`.

Un second démarrage de l’application a été effectué sur la même base. L’historique contenait toujours exactement une migration appliquée avec succès. Flyway reconnaît donc un script déjà exécuté et ne le rejoue pas.

Arrêt de l’environnement local :

```bash
docker compose down
```

## 8. Vérification isolée avec Testcontainers

La vérification locale ne suffit pas, car elle s’exécute sur une base qui peut déjà contenir des données.

La chaîne complète a donc été relancée sur une base vierge :

```bash
cd backend
./mvnw verify
```

Testcontainers a démarré un conteneur PostgreSQL 16 dédié, publié sur un port aléatoire afin de ne pas entrer en conflit avec la base locale.

Flyway a appliqué `V1__initialize_database.sql` sur cette base vide. Les 2 tests ont réussi. JaCoCo a généré son rapport de couverture et Maven s’est terminé avec `BUILD SUCCESS`.

Ce résultat confirme que la migration s’applique sur une base neuve, sans dépendre de l’état de l’environnement de développement.

## 9. Conventions pour les futures migrations

Les règles suivantes s’appliquent à toutes les migrations du projet.

Le nom d’un script suit le format :

```text
V<version>__<description>.sql
```

Le séparateur entre la version et la description est composé de deux caractères de soulignement. Un seul caractère empêche Flyway de reconnaître le script.

Les versions sont des entiers strictement croissants. La version `1` étant occupée par la migration technique initiale, la prochaine migration porte la version `2`.

Une migration déjà appliquée ne doit jamais être modifiée. Flyway enregistre une empreinte de chaque script dans `flyway_schema_history` et refuse de démarrer si le contenu d’une migration appliquée a changé.

Toute évolution du schéma passe donc par une nouvelle migration, y compris pour corriger une migration précédente.

Enfin, chaque module est responsable de ses propres données et de ses propres migrations, conformément à la décision d’architecture sur les relations entre modules. Un module ne modifie pas les tables d’un autre module.

## 10. Résultat

À la fin de cette tâche :

- PostgreSQL 16 démarre localement avec Docker Compose sur `127.0.0.1:5432` ;
- les identifiants restent dans `backend/.env`, ignoré par Git ;
- `backend/.env.example` documente les clés attendues sans contenir de mot de passe ;
- Flyway est activé et lit ses scripts dans `src/main/resources/db/migration/` ;
- la migration `V1__initialize_database.sql` est appliquée et enregistrée dans `flyway_schema_history` ;
- un redémarrage ne rejoue pas la migration déjà appliquée ;
- Hibernate valide le schéma sans le modifier ;
- `./mvnw verify` réussit sur une base isolée fournie par Testcontainers ;
- les conventions de nommage et d’évolution des migrations sont fixées pour les issues suivantes.

Les tables métier seront introduites par les migrations des modules fonctionnels concernés.

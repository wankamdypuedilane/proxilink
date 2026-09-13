# Tâche 20 — Mettre en place l’intégration continue du backend

## Informations générales

- **Sprint :** Sprint 2
- **Issue GitHub :** #20
- **Story points :** 3
- **Branche :** `feat/20-backend-continuous-integration`
- **Pull request :** [#35](https://github.com/wankamdypuedilane/proxilink/pull/35)
- **Composant :** Backend / Intégration continue
- **Statut :** En revue

## 1. Objectif

Exécuter automatiquement la compilation et les tests du backend ProxiLink sur GitHub Actions.

Cette tâche devait répondre aux besoins suivants :

- vérifier chaque pull request vers `main` avant sa fusion ;
- vérifier la branche `main` après chaque intégration ;
- exécuter les tests rapides et le test d’intégration dans un environnement propre ;
- conserver le rapport de couverture JaCoCo produit par le build ;
- limiter les exécutions aux modifications qui concernent le backend.

## 2. État initial hérité de l’issue #19

À la fin de l’issue #19, le backend disposait déjà :

- de tests rapides `*Test.java` exécutés par Surefire ;
- d’un test d’intégration `*IT.java` exécuté par Failsafe avec PostgreSQL fourni par Testcontainers ;
- d’un rapport JaCoCo généré pendant `./mvnw verify` ;
- du Maven Wrapper, qui évite d’installer Maven globalement.

Ces vérifications n’étaient lancées que manuellement sur le poste de développement. Aucun workflow d’intégration continue n’existait dans le dépôt.

## 3. Workflow GitHub Actions

Le workflow a été ajouté dans :

```text
.github/workflows/backend-ci.yml
```

Contenu final :

```yaml
name: Backend CI

on:
  pull_request:
    branches:
      - main
    paths:
      - "backend/**"
      - ".github/workflows/backend-ci.yml"

  push:
    branches:
      - main
    paths:
      - "backend/**"
      - ".github/workflows/backend-ci.yml"

  workflow_dispatch:

permissions:
  contents: read

jobs:
  backend-tests:
    name: Build and test backend
    runs-on: ubuntu-latest
    timeout-minutes: 15

    defaults:
      run:
        working-directory: backend

    steps:
      - name: Checkout repository
        uses: actions/checkout@v7

      - name: Set up Java 21
        uses: actions/setup-java@v6
        with:
          distribution: temurin
          java-version: "21"
          cache: maven
          cache-dependency-path: backend/pom.xml

      - name: Build and run tests
        run: ./mvnw --batch-mode clean verify

      - name: Upload JaCoCo report
        if: always()
        uses: actions/upload-artifact@v7
        with:
          name: backend-jacoco-report
          path: backend/target/site/jacoco/
          if-no-files-found: warn
          retention-days: 7
```

## 4. Déclencheurs et filtres

Le workflow démarre dans trois cas :

| Événement | Condition |
|---|---|
| `pull_request` | pull request ciblant `main` |
| `push` | push sur `main` |
| `workflow_dispatch` | lancement manuel depuis l’onglet Actions |

Les événements `pull_request` et `push` sont filtrés par chemin :

```yaml
paths:
  - "backend/**"
  - ".github/workflows/backend-ci.yml"
```

Une modification limitée à la documentation ne déclenche donc pas ces deux événements. Une modification du backend ou du workflow lui-même le déclenche.

Le lancement manuel avec `workflow_dispatch` n’est pas soumis à ces filtres.

## 5. Environnement d’exécution

| Élément | Valeur |
|---|---|
| Runner | `ubuntu-latest` |
| Durée maximale du job | 15 minutes |
| Permissions du jeton | `contents: read` |
| Répertoire des commandes | `backend` |
| Java | 21, distribution Temurin |
| Cache | Maven, indexé sur `backend/pom.xml` |

La permission `contents: read` limite le jeton GitHub du workflow à la lecture du dépôt.

La propriété `working-directory: backend` exécute chaque étape `run` depuis le dossier du backend. La commande Maven n’a donc pas besoin de changer de répertoire.

L’action `actions/setup-java` installe Java 21 Temurin et gère le cache des dépendances Maven. L’option `cache-dependency-path` indique que ce cache dépend du fichier `backend/pom.xml`, situé hors de la racine du dépôt.

## 6. Build et tests

La commande exécutée est :

```bash
./mvnw --batch-mode clean verify
```

L’option `--batch-mode` désactive le mode interactif de Maven, adapté à une exécution automatisée.

GitHub Actions considère l’étape Maven en échec lorsque `./mvnw --batch-mode clean verify` retourne un code différent de zéro. Une erreur de compilation ou un test en échec empêche donc le job de réussir.

La phase `verify` reprend le fonctionnement documenté dans l’issue #19 :

| Plugin | Catégorie | Tests exécutés en CI |
|---|---|---|
| Surefire | tests rapides `*Test.java` | 2 |
| Failsafe | test d’intégration `*IT.java` | 1 |

Le test d’intégration utilise Testcontainers pour démarrer PostgreSQL 16. Le runner `ubuntu-latest` fournit Docker, ce qui permet à Testcontainers de fonctionner sans configuration supplémentaire dans le workflow.

Résultat observé dans GitHub Actions :

- 3 tests réussis ;
- aucun échec ;
- aucune erreur.

Le pipeline utilise la configuration Maven existante. Aucune modification de `backend/pom.xml` n’a été nécessaire pour cette issue.

## 7. Publication du rapport JaCoCo

Le rapport généré dans `backend/target/site/jacoco/` est publié comme artefact GitHub Actions :

| Paramètre | Valeur |
|---|---|
| Nom de l’artefact | `backend-jacoco-report` |
| Condition | `if: always()` |
| Dossier absent | avertissement (`if-no-files-found: warn`) |
| Conservation | 7 jours |

La condition `if: always()` tente la publication même lorsque l’étape Maven échoue. L’option `if-no-files-found: warn` produit un avertissement au lieu d’une erreur si le rapport n’a pas été généré.

L’artefact final observé mesure 197 KB. Il contient notamment :

- `index.html` ;
- `jacoco.csv` ;
- `jacoco.xml` ;
- `jacoco-sessions.html`.

## 8. Première exécution : Maven Wrapper non exécutable

La première exécution du workflow a échoué à l’étape Maven :

```text
./mvnw: Permission denied
```

Le processus s’est terminé avec le code 126. Ce code indique que la commande a été trouvée mais qu’elle n’a pas pu être exécutée.

### Cause

Le fichier `backend/mvnw` était enregistré par Git avec le mode `100644`. Ce mode ne comporte pas le droit d’exécution.

Le runner Linux récupère les fichiers avec le mode enregistré dans Git. Le script n’était donc pas exécutable dans GitHub Actions.

### Correction

Le mode Git du fichier a été changé en `100755`, qui ajoute le droit d’exécution. Le commit correspondant ne contient que ce changement de mode, sans modification du contenu du script.

Vérification :

```bash
git ls-files -s backend/mvnw
```

Résultat :

```text
100755 0368a83830f803e2b585c3ac254a13f580479a3b 0	backend/mvnw
```

## 9. Deuxième exécution : avertissements Node.js 20

La deuxième exécution a réussi. Elle affichait cependant des avertissements liés à Node.js 20.

Les actions utilisées à ce moment étaient en version 4. Elles ont été mises à jour :

| Action | Avant | Après |
|---|---|---|
| `actions/checkout` | `v4` | `v7` |
| `actions/setup-java` | `v4` | `v6` |
| `actions/upload-artifact` | `v4` | `v7` |

Seules les références de version ont changé. Les paramètres des étapes sont restés identiques.

## 10. Dernière exécution

La dernière exécution observée :

- a réussi ;
- a duré 37 secondes ;
- a produit un artefact, `backend-jacoco-report` ;
- n’a plus affiché les avertissements liés à Node.js 20.

## 11. Historique de la branche

La branche contient trois commits :

| Commit | Message | Changement |
|---|---|---|
| `25d454b` | [CI] Mettre en place l’intégration continue du backend (#20) | création de `.github/workflows/backend-ci.yml` |
| `b8b0a5a` | [CI] Rendre le Maven Wrapper exécutable sous Linux (#20) | mode de `backend/mvnw` passé de `100644` à `100755` |
| `4c5299e` | [CI] Mettre à jour les actions GitHub (#20) | mise à jour des versions des trois actions |

## 12. Résultat et critères d’acceptation

À ce stade, la pull request #35 est en revue.

- [x] Le workflow GitHub Actions est présent dans le dépôt.
- [x] Il se déclenche lors des pull requests vers `main`.
- [x] Il se déclenche lors des pushs sur `main`.
- [x] Les dépendances Maven sont mises en cache.
- [x] Le backend est compilé automatiquement.
- [x] Les tests sont exécutés automatiquement.
- [x] Le rapport de couverture JaCoCo est généré et publié comme artefact.
- [x] Un échec de compilation ou de test fait échouer le workflow.
- [x] Le workflow réussit sur la pull request de vérification #35.
- [x] Les modifications sont proposées et intégrées au moyen de la pull request #35.

### Hors périmètre

Le déploiement continu n’est pas couvert par cette issue. Le workflow compile, teste et publie le rapport de couverture, mais il ne déploie l’application sur aucun environnement.

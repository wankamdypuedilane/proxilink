# Tâche 19 — Configurer l’environnement de tests et la couverture du backend

## Informations générales

- **Sprint :** Sprint 1
- **Issue GitHub :** #19
- **Branche :** `feat/19-configure-backend-testing`
- **Composant :** Backend / Tests
- **Statut :** terminé

## 1. Objectif

Mettre en place un environnement de tests fiable pour le backend ProxiLink, avant l’arrivée du premier code métier.

Cette tâche devait répondre aux besoins suivants :

- confirmer que les bibliothèques de test sont disponibles et correctement câblées ;
- séparer les tests rapides des tests d’intégration nécessitant Docker ;
- fixer une convention de nommage claire pour chaque catégorie de test ;
- supprimer les avertissements liés au chargement dynamique de l’agent Mockito ;
- produire un rapport de couverture JaCoCo exploitable ;
- définir une politique de couverture réaliste pour la suite du projet.

L’objectif n’était pas d’écrire des tests métier. Le backend ne contient encore aucune logique fonctionnelle.

## 2. État initial hérité des issues #17 et #18

À la fin des issues #17 et #18, le backend disposait déjà :

- d’un test d’architecture vérifiant les modules avec Spring Modulith ;
- d’un test de contexte Spring Boot utilisant PostgreSQL avec Testcontainers ;
- de la migration technique `V1__initialize_database.sql` ;
- du plugin JaCoCo 0.8.15 avec les objectifs `prepare-agent` et `report`.

Plusieurs limites subsistaient :

- `./mvnw test` exécutait tous les tests, y compris le test de contexte qui démarre un conteneur PostgreSQL ;
- aucun test ne vérifiait explicitement le fonctionnement de Mockito ;
- aucune convention ne distinguait les tests rapides des tests d’intégration ;
- Mockito et la JVM affichaient des avertissements concernant l’auto-attachement dynamique d’un agent Java.

## 3. Bibliothèques de test disponibles

Les bibliothèques suivantes sont fournies par les dépendances de test déclarées dans `backend/pom.xml`. Leurs versions sont gérées par Spring Boot 4.1.1 et par le BOM Spring Modulith. Aucune version n’est fixée manuellement.

| Bibliothèque | Rôle | Dépendance qui la fournit |
|---|---|---|
| JUnit Jupiter | Écriture et exécution des tests | starters `spring-boot-starter-*-test` |
| Mockito | Création de doubles de test | starters `spring-boot-starter-*-test` |
| AssertJ | Assertions lisibles | starters `spring-boot-starter-*-test` |
| Spring Boot Test | Chargement du contexte Spring dans les tests | starters `spring-boot-starter-*-test` |
| Spring Modulith Test | Vérification de la structure modulaire | `spring-modulith-starter-test` |
| Flyway Test | Support de Flyway dans les tests | `spring-boot-starter-flyway-test` |
| Testcontainers | Services réels dans Docker | `spring-boot-testcontainers`, `testcontainers-junit-jupiter`, `testcontainers-postgresql` |

La version de JUnit Jupiter utilisée est la 6.0.3, héritée de Spring Boot 4.1.1. La version de Testcontainers utilisée est la 2.0.5.

## 4. Conventions de nommage des tests

Les tests sont répartis en deux catégories selon le suffixe de leur classe.

| Suffixe | Catégorie | Plugin Maven | Docker requis |
|---|---|---|---|
| `*Test.java` | Tests rapides | Surefire | non |
| `*IT.java` | Tests d’intégration | Failsafe | oui |

Configuration de Surefire :

```xml
<plugin>
    <groupId>org.apache.maven.plugins</groupId>
    <artifactId>maven-surefire-plugin</artifactId>
    <configuration>
        <includes>
            <include>**/*Test.java</include>
        </includes>
        <excludes>
            <exclude>**/*IT.java</exclude>
        </excludes>
        <argLine>@{argLine} -javaagent:${settings.localRepository}/org/mockito/mockito-core/${mockito.version}/mockito-core-${mockito.version}.jar</argLine>
    </configuration>
</plugin>
```

Configuration de Failsafe :

```xml
<plugin>
    <groupId>org.apache.maven.plugins</groupId>
    <artifactId>maven-failsafe-plugin</artifactId>
    <configuration>
        <includes>
            <include>**/*IT.java</include>
        </includes>
        <argLine>@{argLine} -javaagent:${settings.localRepository}/org/mockito/mockito-core/${mockito.version}/mockito-core-${mockito.version}.jar</argLine>
    </configuration>
    <executions>
        <execution>
            <goals>
                <goal>integration-test</goal>
                <goal>verify</goal>
            </goals>
        </execution>
    </executions>
</plugin>
```

Les inclusions explicites remplacent les motifs par défaut des deux plugins. Surefire ne recherche donc plus les classes `Test*.java` ou `*Tests.java`. Les classes utilitaires `TestcontainersConfiguration` et `TestProxilinkBackendApplication` ne sont ainsi analysées par aucun des deux plugins.

Les classes existantes ont été renommées pour respecter cette convention :

| Classe | Catégorie |
|---|---|
| `ModularArchitectureTest` | test rapide |
| `ProxilinkBackendApplicationIT` | test d’intégration |

L’objectif `integration-test` de Failsafe exécute les tests sans interrompre immédiatement le build. L’objectif `verify` fait ensuite échouer Maven si un test d’intégration a échoué.

## 5. Différence entre `./mvnw test` et `./mvnw verify`

| Commande | Tests exécutés | Docker requis | Rapport JaCoCo |
|---|---|---|---|
| `./mvnw test` | `*Test.java` avec Surefire | non | non |
| `./mvnw verify` | `*Test.java` avec Surefire, puis `*IT.java` avec Failsafe | oui | oui |

`./mvnw test` sert au retour rapide pendant le développement. Il ne démarre aucun conteneur.

`./mvnw verify` exécute le cycle complet. La phase `verify` suit la phase `integration-test` dans le cycle de vie Maven. Elle inclut donc les tests rapides, le test d’intégration et la génération du rapport de couverture.

## 6. Test de configuration Mockito

Le fichier suivant a été ajouté :

```text
src/test/java/com/proxilink/MockitoConfigurationTest.java
```

Ce test est un test technique. Il ne vérifie aucune règle métier.

Il démontre que la pile de tests unitaires est correctement câblée :

- JUnit Jupiter découvre et exécute le test ;
- `MockitoExtension` crée un double avec `@Mock` ;
- `@InjectMocks` injecte ce double dans l’objet testé par son constructeur ;
- le comportement programmé avec `when(...)` est bien utilisé ;
- `verify(...)` confirme l’interaction attendue ;
- AssertJ réalise l’assertion finale.

Les deux collaborateurs utilisés sont déclarés à l’intérieur du fichier de test. Aucun code de production n’a été introduit pour cette vérification.

## 7. Test d’architecture modulaire

Le test `ModularArchitectureTest` vérifie la structure du monolithe modulaire :

```java
class ModularArchitectureTest {

    @Test
    void verifiesModularStructure() {
        ApplicationModules.of(ProxilinkBackendApplication.class).verify();
    }
}
```

Il échoue lorsqu’une dépendance non autorisée ou un cycle entre modules est détecté.

Ce test analyse le bytecode sans démarrer Spring ni Docker. Il appartient donc aux tests rapides exécutés par Surefire.

## 8. Test d’intégration Spring Boot avec PostgreSQL

Le test `ProxilinkBackendApplicationIT` vérifie que le contexte Spring Boot démarre entièrement :

```java
@Import(TestcontainersConfiguration.class)
@SpringBootTest(properties = "spring.docker.compose.enabled=false")
class ProxilinkBackendApplicationIT {

    @Test
    void contextLoads() {
    }

}
```

La classe `TestcontainersConfiguration` fournit un conteneur `postgres:16-alpine` annoté avec `@ServiceConnection`. Spring Boot configure alors automatiquement la source de données à partir de ce conteneur.

Pendant ce test :

1. Testcontainers démarre PostgreSQL 16 Alpine sur un port choisi dynamiquement ;
2. Flyway valide et applique `V1__initialize_database.sql` sur cette base vierge ;
3. Hibernate valide le schéma ;
4. le contexte Spring Boot démarre ;
5. le conteneur est supprimé à la fin de l’exécution.

### Désactivation de Docker Compose

La propriété `spring.docker.compose.enabled=false` empêche Spring Boot de démarrer la base locale décrite dans `compose.yaml`.

Le test utilise ainsi uniquement la base isolée fournie par Testcontainers. Il ne dépend pas du fichier `.env` et n’entre pas en conflit avec une base locale utilisant le port 5432.

## 9. Agent Mockito explicite partagé avec JaCoCo

### Problème initial

Mockito 5 utilise par défaut un mock maker capable de modifier des classes à l’exécution. Il s’auto-attachait pour cela dynamiquement à la JVM pendant les tests.

Java 21 signale ce chargement dynamique d’agent. Une future version du JDK le désactivera par défaut. Mockito et la JVM affichaient donc des avertissements indiquant que Mockito s’auto-attachait et qu’un agent Java avait été chargé dynamiquement.

### Correction

Mockito est désormais chargé comme agent Java explicite au démarrage de la JVM de test.

Le même `argLine` est déclaré dans Surefire et dans Failsafe :

```xml
<argLine>@{argLine} -javaagent:${settings.localRepository}/org/mockito/mockito-core/${mockito.version}/mockito-core-${mockito.version}.jar</argLine>
```

Cette ligne combine deux éléments :

- `@{argLine}` reprend l’agent JaCoCo préparé par l’objectif `prepare-agent` ;
- `-javaagent:...` ajoute l’agent Mockito.

La syntaxe `@{...}` est évaluée tardivement, au moment où Surefire ou Failsafe démarre la JVM de test. La valeur définie par JaCoCo pendant le build est donc bien prise en compte. Les deux agents cohabitent dans la même JVM.

La propriété `${mockito.version}` est fournie par Spring Boot. Le JAR chargé comme agent correspond donc toujours à la version de Mockito utilisée par les tests, sans version fixée manuellement.

### Propriété `argLine` vide

Une propriété vide a été ajoutée dans la section `<properties>` :

```xml
<argLine></argLine>
```

Elle fournit une valeur de repli à l’expression tardive `@{argLine}`. Avec cette expression, elle permet aux configurations de Surefire et de Failsafe de composer l’agent JaCoCo et l’agent Mockito dans une même ligne de commande.

Aucun scénario avec JaCoCo désactivé n’a été exécuté dans cette issue.

### Options volontairement écartées

L’option `-XX:+EnableDynamicAgentLoading` n’a pas été ajoutée. Elle masquerait l’avertissement sans supprimer l’auto-attachement.

L’option `-Xshare:off` n’a pas été ajoutée non plus. Elle n’est pas nécessaire à cette configuration.

### Résultat

Après correction, aucun avertissement Mockito concernant l’auto-attachement ni aucun avertissement JVM concernant le chargement dynamique d’agent n’apparaît pendant `./mvnw clean test`.

## 10. Rapport de couverture JaCoCo

Le rapport est produit pendant `./mvnw verify` :

```text
target/site/jacoco/index.html
```

Surefire et Failsafe reçoivent tous deux l’agent JaCoCo par la même configuration `argLine`. Le rapport est produit pendant la phase `verify` à partir du fichier `target/jacoco.exec`.

L’exécution `prepare-agent` déclare explicitement l’option `append` :

```xml
<execution>
    <goals>
        <goal>prepare-agent</goal>
    </goals>
    <configuration>
        <append>true</append>
    </configuration>
</execution>
```

Avec `append=true`, chaque JVM de test ajoute ses données à `target/jacoco.exec` au lieu de remplacer celles de la JVM précédente. Le fichier conserve ainsi les données produites successivement par les JVM Surefire et Failsafe. Le rapport généré pendant `verify` peut donc exploiter les données accumulées des deux phases.

Cette valeur correspond au comportement par défaut de JaCoCo. La déclarer rend l’intention visible dans le `pom.xml`.

Aucune expérience séparée n’a été menée pour attribuer les données du rapport à la phase Surefire ou à la phase Failsafe.

Le rapport observé analyse une classe et indique la couverture suivante :

| Classe analysée | Instructions manquées | Instructions couvertes | Couverture des instructions |
|---|---|---|---|
| `ProxilinkBackendApplication` | 5 | 3 | 37,50 % |

Cette valeur est une base initiale peu représentative. Le backend ne contient encore que sa classe de démarrage et aucune logique métier.

`./mvnw clean verify` a été réexécuté après la déclaration explicite de `append=true` :

- le journal JaCoCo affiche `append=true` dans l’`argLine` ;
- Surefire a exécuté 2 tests avec succès ;
- Failsafe a exécuté 1 test avec succès ;
- le build a réussi avec le code Maven 0 ;
- le rapport analyse toujours une classe ;
- la couverture des instructions reste de 37,50 %.

## 11. Politique de couverture

### Pourquoi aucun seuil n’est imposé maintenant

Aucune règle `check` de JaCoCo n’a été ajoutée à cette étape.

Un seuil automatique de 80 % sur le code actuel n’aurait pas de sens :

- le rapport ne porte que sur quelques instructions de la classe de démarrage ;
- l’atteindre obligerait à écrire des tests artificiels sans valeur fonctionnelle ;
- le build échouerait sans signaler de véritable défaut.

### Objectif pour les futurs modules métier

L’objectif de 80 % de couverture est une cible pour les futurs modules métier. Il n’est pas atteint actuellement.

Il concerne en priorité :

- l’authentification ;
- les règles métier critiques.

Le seuil automatique sera défini lorsque ces modules contiendront du code réel à protéger.

## 12. Commandes de vérification et résultats observés

Toutes les commandes sont exécutées depuis `backend/`.

### Tests rapides

```bash
./mvnw clean test
```

La commande a été exécutée sans conteneur Docker actif.

| Classe | Tests réussis |
|---|---|
| `MockitoConfigurationTest` | 1 |
| `ModularArchitectureTest` | 1 |

```text
Tests run: 2, Failures: 0, Errors: 0, Skipped: 0
BUILD SUCCESS
```

Observations :

- Maven s’est terminé avec le code 0 ;
- seul Surefire a exécuté des tests ;
- aucun conteneur Docker n’a été lancé ;
- aucun avertissement Mockito concernant l’auto-attachement ou le chargement dynamique de l’agent n’est apparu.

### Cycle complet

```bash
./mvnw clean verify
```

| Plugin | Classe | Tests réussis |
|---|---|---|
| Surefire | `MockitoConfigurationTest` | 1 |
| Surefire | `ModularArchitectureTest` | 1 |
| Failsafe | `ProxilinkBackendApplicationIT` | 1 |

```text
BUILD SUCCESS
```

Observations :

- Maven s’est terminé avec le code 0 ;
- Testcontainers 2.0.5 a démarré PostgreSQL 16 Alpine ;
- Flyway a validé et appliqué `V1__initialize_database.sql` ;
- le rapport JaCoCo a été généré dans `target/site/jacoco/index.html`.

### Absence de conteneur résiduel

```bash
docker ps
```

Aucun conteneur ne reste actif après l’exécution des tests.

## 13. Hors périmètre

L’exécution automatique de ces commandes dans un workflow d’intégration continue n’est pas couverte par cette tâche. Elle sera traitée dans l’issue #20.

## 14. Résultat

À ce stade de la tâche :

- JUnit Jupiter, Mockito, AssertJ, Spring Boot Test, Spring Modulith Test, Flyway Test et Testcontainers sont disponibles ;
- les tests rapides suivent la convention `*Test.java` et sont exécutés par Surefire ;
- les tests d’intégration suivent la convention `*IT.java` et sont exécutés par Failsafe ;
- `./mvnw test` s’exécute sans Docker ;
- `./mvnw verify` ajoute le test d’intégration avec PostgreSQL fourni par Testcontainers ;
- le fonctionnement de Mockito est vérifié par un test technique ;
- la structure modulaire est vérifiée automatiquement ;
- Docker Compose est désactivé dans le test d’intégration ;
- Mockito est chargé comme agent explicite, en complément de l’agent JaCoCo ;
- les avertissements d’auto-attachement de Mockito ont disparu ;
- JaCoCo génère un rapport avec une couverture initiale de 37,50 % ;
- aucun seuil de couverture n’est encore imposé ;
- l’objectif de 80 % reste une cible pour les futures règles métier critiques ;
- aucun conteneur ne reste actif après les tests.

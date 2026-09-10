# ADR 0003 — Définir les relations entre modules

- Statut : accepté
- Date : 10 septembre 2026
- Décideur : Dilane Junior Wankam Dypue

## Contexte

ProxiLink est organisé en monolithe modulaire. Les modules `account`, `provider`, `service`, `availability`, `booking` et `admin` doivent collaborer sans accéder directement à leurs détails internes.

Des relations JPA entre entités appartenant à des modules différents créeraient un couplage fort. Une modification interne d’un module pourrait alors affecter directement les autres modules et permettre le chargement involontaire de graphes d’objets importants.

Il faut donc définir comment un module référence les données d’un autre module et comment les modules communiquent.

## Options envisagées

### Option 1 — Relations JPA entre tous les modules

Les entités peuvent utiliser librement `@OneToOne`, `@OneToMany`, `@ManyToOne` ou `@ManyToMany` vers les entités des autres modules.

Avantages :

- navigation directe entre les objets ;
- prise en charge automatique de certaines jointures par JPA ;
- développement initial rapide.

Inconvénients :

- couplage fort entre les modules ;
- frontières métier facilement contournées ;
- chargements implicites et problèmes de performance possibles ;
- extraction future d’un module plus difficile.

### Option 2 — Identifiants entre les modules

Les relations JPA sont autorisées à l’intérieur d’un même module. Lorsqu’une donnée appartient à un autre module, seul son identifiant est conservé.

Exemple : une réservation conserve un `accountId` et un `serviceId`, mais ne possède pas de relation JPA directe vers les entités `Account` et `Service`.

Avantages :

- frontières modulaires explicites ;
- agrégats moins couplés ;
- chargements de données maîtrisés ;
- évolution interne des modules facilitée.

Inconvénients :

- appels supplémentaires lorsque des informations externes sont nécessaires ;
- assemblage manuel de certaines réponses ;
- cohérence entre modules à traiter explicitement.

## Décision

Les relations JPA seront limitées aux entités appartenant au même module.

Entre deux modules, une entité conservera uniquement l’identifiant de la ressource externe, généralement sous la forme d’un `UUID`.

Un module ne pourra pas utiliser directement :

- les entités internes d’un autre module ;
- les dépôts Spring Data d’un autre module ;
- les services internes d’un autre module.

Il devra passer par l’interface publique du module concerné.

## Communication entre modules

Une communication synchrone sera utilisée lorsqu’une réponse immédiate est nécessaire pour terminer une opération métier.

Par exemple, le module `booking` pourra interroger les interfaces publiques des modules `account`, `service` et `availability` avant de créer une réservation.

Un événement de domaine sera utilisé pour informer les autres modules d’un fait déjà survenu, lorsque leur réaction ne doit pas faire partie de l’opération principale.

Les événements seront publiés après la validation de la transaction lorsque leur traitement concerne un effet secondaire. La stratégie garantissant la fiabilité des notifications externes sera décidée lors de l’implémentation du besoin correspondant.

## Intégrité des données

Chaque module est responsable de ses propres données et migrations Flyway.

Les références entre modules seront représentées dans le code par des identifiants. Une contrainte de clé étrangère en base pourra être utilisée lorsqu’elle protège une règle d’intégrité indispensable, à condition que cette dépendance soit documentée et qu’elle ne permette pas de contourner l’interface publique du module dans le code Java.

## Vérification

Spring Modulith vérifiera que les modules ne dépendent que des interfaces publiques autorisées.

Des tests métier vérifieront également les situations où une ressource référencée :

- n’existe pas ;
- n’est plus active ;
- n’est plus disponible ;
- a été supprimée ou anonymisée.

## Conséquences

### Conséquences positives

- réduction du couplage entre les modules ;
- accès aux données externes explicite ;
- meilleure maîtrise des requêtes ;
- frontières contrôlables automatiquement ;
- évolution et extraction futures facilitées.

### Conséquences négatives

- davantage de code d’orchestration ;
- assemblage manuel de certaines vues ;
- cohérence inter-modules à concevoir explicitement ;
- certaines opérations peuvent nécessiter plusieurs appels internes.

## Réévaluation

Cette décision devra être réévaluée si :

- les appels synchrones entre modules provoquent des problèmes de performance mesurés ;
- une vue nécessite régulièrement des jointures complexes entre plusieurs modules ;
- un module est extrait dans un service indépendant ;
- les événements doivent être garantis malgré une panne ou un redémarrage.
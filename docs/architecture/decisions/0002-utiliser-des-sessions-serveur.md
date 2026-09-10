# ADR 0002 — Utiliser des sessions serveur pour l’authentification

- Statut : accepté
- Date : 10 septembre 2026
- Décideur : Dilane Junior Wankam Dypue

## Contexte

ProxiLink comprend une application monopage React communiquant avec un backend Spring Boot.

Le MVP doit permettre l’inscription, la connexion, la déconnexion et le contrôle des accès selon les autorités de l’utilisateur.

La stratégie d’authentification doit rester simple, sécurisée et adaptée au déploiement initial d’un monolithe modulaire, tout en permettant une évolution vers plusieurs instances de l’application.

## Options envisagées

### Option 1 — Jetons JWT stateless

Le backend délivre un jeton signé que le client transmet avec chaque requête.

Avantages :

- facilite la distribution des requêtes entre plusieurs instances ;
- ne nécessite pas de stockage centralisé des sessions.

Inconvénients :

- complexifie la révocation immédiate des accès ;
- nécessite une stratégie de renouvellement des jetons ;
- augmente les risques en cas de stockage inadapté dans le navigateur ;
- apporte peu de bénéfices au monolithe du MVP.

### Option 2 — Sessions serveur en mémoire

Le serveur conserve les sessions dans la mémoire de l’instance Spring Boot.

Avantages :

- configuration simple ;
- révocation immédiate d’une session ;
- aucune gestion de jetons JWT.

Inconvénients :

- déconnexion des utilisateurs lors d’un redéploiement ;
- sessions non partagées entre plusieurs instances ;
- limitation de l’évolution horizontale de l’application.

### Option 3 — Sessions serveur persistées avec Spring Session JDBC

Spring Session remplace l’implémentation classique de `HttpSession` et stocke les sessions dans PostgreSQL.

Avantages :

- révocation immédiate des sessions ;
- conservation des sessions lors des redéploiements de l’application ;
- partage des sessions entre plusieurs instances ;
- réutilisation de PostgreSQL sans ajouter Redis au MVP.

Inconvénients :

- dépendance de l’authentification à la disponibilité de PostgreSQL ;
- ajout de tables techniques et d’un mécanisme de nettoyage des sessions expirées ;
- écritures supplémentaires en base de données.

## Décision

ProxiLink utilisera des sessions serveur persistées dans PostgreSQL avec Spring Session JDBC.

En production, le build React sera servi par Spring Boot afin que le frontend et l’API utilisent la même origine.

L’identifiant de session sera transporté dans un cookie :

- `HttpOnly` pour empêcher sa lecture par JavaScript ;
- `Secure` en production pour limiter son transport à HTTPS ;
- `SameSite=Lax` pour réduire les risques de requêtes intersites ;
- avec une durée de vie limitée et configurable.

Aucun identifiant de session ni secret d’authentification ne sera stocké dans `localStorage`.

## Protection CSRF

La protection CSRF de Spring Security restera activée.

Un cookie `XSRF-TOKEN`, volontairement accessible à JavaScript, transmettra le jeton CSRF au frontend. React renverra cette valeur dans l’en-tête `X-XSRF-TOKEN` pour les requêtes qui modifient l’état de l’application.

Le cookie CSRF ne sera pas `HttpOnly`, contrairement au cookie de session. Il ne contient pas l’identifiant de session.

Un endpoint `GET /api/csrf` permettra au frontend d’obtenir un jeton :

- au chargement de l’application ;
- après une authentification réussie ;
- après une déconnexion.

La connexion et la déconnexion seront également protégées contre les attaques CSRF. La déconnexion utilisera une requête `POST`.

## Développement local

En développement, le serveur Vite utilisera un proxy vers le backend Spring Boot. Le navigateur continuera ainsi à communiquer avec une seule origine apparente, sans généraliser une configuration CORS destinée uniquement au développement.

Si le frontend et le backend doivent ultérieurement être déployés sur des origines différentes, la politique des cookies, CORS et CSRF devra être réévaluée.

## Conséquences

### Conséquences positives

- authentification adaptée à l’architecture monolithique du MVP ;
- révocation immédiate des accès ;
- absence de jetons d’authentification dans le stockage JavaScript ;
- sessions conservées lors des redéploiements ;
- possibilité de partager les sessions entre plusieurs instances.

### Conséquences négatives

- PostgreSQL devient nécessaire au fonctionnement des sessions ;
- les accès à la session génèrent une charge supplémentaire sur la base ;
- les tables de sessions et leur nettoyage doivent être gérés ;
- le frontend et le backend sont couplés dans le déploiement du MVP.

## Réévaluation

Cette décision devra être réévaluée si :

- le frontend doit être déployé durablement sur une origine distincte ;
- l’application adopte plusieurs clients indépendants, notamment mobiles ou partenaires ;
- la charge des sessions justifie l’utilisation d’un magasin dédié comme Redis ;
- l’architecture évolue vers des services déployés indépendamment.
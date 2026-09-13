# ProxiLink — Frontend

Ce dossier contient l’application web de ProxiLink, la marketplace de services de proximité.

Le frontend est une application monopage construite avec React, TypeScript et Vite. Il communique avec le backend Spring Boot du dépôt au moyen d’une API HTTP.

> **Statut : socle technique initial.**
> L’application contient une page d’accueil minimale, une page introuvable et un client API prêt pour les futurs appels.

## Technologies

- **React** : construction de l’interface par composants ;
- **TypeScript** : typage statique du code ;
- **Vite** : serveur de développement et production du build ;
- **React Router** : routage côté navigateur ;
- **Vitest**, **Testing Library** et **jsdom** : tests des composants ;
- **ESLint** : analyse statique du code ;
- **Prettier** : formatage automatique.

Les versions exactes sont déclarées dans `package.json`.

## Prérequis

- Node.js dans l’une des versions suivantes :
  - 22.22.2 ou plus récent dans la branche 22 ;
  - 24.15.0 ou plus récent dans la branche 24 ;
  - 26 ou plus récent ;
- npm, fourni avec Node.js.

Ces bornes proviennent des exigences déclarées par les dépendances, notamment React Router, Vitest et jsdom.

Versions utilisées pendant la mise en place du frontend :

```text
Node.js 24.21.0
npm 11.19.0
```

Vérification :

```bash
node --version
npm --version
```

## Installation

Depuis la racine du dépôt :

```bash
cd frontend
npm install
```

## Configuration de l’API

Le frontend lit l’adresse du backend dans la variable `VITE_API_URL`.

Créer la configuration locale à partir du modèle versionné :

```bash
cp .env.example .env.local
```

Contenu du modèle `.env.example` :

```dotenv
VITE_API_URL=http://localhost:8080
```

Vite charge automatiquement `.env.local`. Ce fichier est ignoré par Git grâce à la règle `*.local` du fichier `.gitignore`.

Après une modification de `.env.local`, le serveur de développement doit être redémarré pour prendre en compte la nouvelle valeur.

> **Attention : aucune donnée secrète dans une variable `VITE_`.**
> Toute variable préfixée par `VITE_` est intégrée au code envoyé au navigateur. Elle est donc lisible par n’importe quel utilisateur de l’application. Elle ne doit jamais contenir de mot de passe, de jeton ou d’autre secret.

## Commandes

Toutes les commandes s’exécutent depuis le dossier `frontend/`.

| Commande               | Rôle                                                                        |
| ---------------------- | --------------------------------------------------------------------------- |
| `npm run dev`          | Démarre le serveur de développement Vite avec rechargement à chaud          |
| `npm run build`        | Vérifie les types avec TypeScript, puis produit le build dans `dist/`       |
| `npm run preview`      | Sert localement le contenu de `dist/` produit par `npm run build`           |
| `npm run lint`         | Analyse le code avec ESLint                                                 |
| `npm run format`       | Formate les fichiers avec Prettier                                          |
| `npm run format:check` | Vérifie le formatage sans modifier les fichiers                             |
| `npm test`             | Exécute les tests une seule fois avec Vitest                                |
| `npm run test:watch`   | Exécute les tests en mode surveillance et les relance à chaque modification |

`npm test` est un raccourci de npm pour `npm run test`.

Par défaut, Vite sert l’application de développement sur `http://localhost:5173` et la prévisualisation sur `http://localhost:4173`. L’adresse réellement utilisée est affichée dans le terminal au démarrage.

## Structure du code

```text
src/
├── components/   composants d’interface réutilisables
├── features/     fonctionnalités métier regroupées par domaine
├── hooks/        hooks React réutilisables
├── pages/        composants associés aux routes
├── services/     communication avec les services externes, dont l’API
├── test/         configuration commune des tests
├── types/        types TypeScript partagés
├── utils/        fonctions utilitaires
├── App.tsx       déclaration des routes
├── App.test.tsx  tests du routage
├── App.css       styles de l’application
├── index.css     styles généraux
├── main.tsx      point d’entrée de l’application
└── vite-env.d.ts typage des variables d’environnement Vite
```

Les dossiers `components`, `features`, `hooks`, `types` et `utils` ne contiennent encore qu’un fichier `.gitkeep`. Ce fichier permet à Git de conserver ces dossiers vides.

## Routage

`BrowserRouter` entoure l’application dans `src/main.tsx`. Les routes sont déclarées dans `src/App.tsx` :

| Route | Page           | Contenu                                                                       |
| ----- | -------------- | ----------------------------------------------------------------------------- |
| `/`   | `HomePage`     | page d’accueil minimale de ProxiLink                                          |
| `*`   | `NotFoundPage` | page affichée pour toute adresse inconnue, avec un lien de retour à l’accueil |

La route générique `*` capture toutes les adresses qui ne correspondent à aucune autre route.

## Tests

Les tests utilisent Vitest avec l’environnement `jsdom`, qui simule le navigateur.

Le fichier `src/test/setup.ts` est chargé avant chaque fichier de test. Il :

- ajoute les matchers de `@testing-library/jest-dom`, comme `toBeInTheDocument()` ;
- retire les composants du DOM après chaque test avec `cleanup()`.

Le fichier `src/App.test.tsx` vérifie le routage avec `MemoryRouter` :

- la route `/` affiche la page d’accueil ;
- une adresse inconnue affiche la page introuvable, et son lien ramène à l’accueil.

## Client API

Le fichier `src/services/apiClient.ts` centralise les appels HTTP vers le backend.

Il expose la fonction `apiRequest<T>(path, options)` :

- l’URL est construite à partir de `VITE_API_URL`, dont la barre oblique finale éventuelle est retirée ;
- le chemin doit commencer par `/` ;
- les en-têtes fournis sont acceptés sous forme d’objet, de tableau de paires ou d’instance de `Headers` ;
- l’en-tête `Accept: application/json` est ajouté seulement si l’appel n’en définit pas ;
- aucun en-tête `Content-Type` n’est imposé, afin de rester compatible avec des contenus comme `FormData` ;
- une réponse dont le statut n’est pas un succès provoque une erreur indiquant ce statut ;
- une réponse `204` renvoie `undefined` ;
- les autres réponses sont lues comme du JSON.

Si `VITE_API_URL` n’est pas définie, l’erreur est levée au moment de l’appel, et non à l’import du module.

Exemple d’utilisation futur :

```ts
const user = await apiRequest<User>('/users/1')
```

Aucun composant n’utilise encore ce client.

## Backend local

Le backend local est actuellement accessible sur `http://localhost:8080`. Aucun port n’est configuré dans le backend : cette adresse correspond au port par défaut de Spring Boot.

Le backend ne possède pas encore de route métier. Seuls les points d’accès Actuator `/actuator/health` et `/actuator/info` sont exposés.

Le backend ne possède pas encore de configuration CORS. Tant que ce point n’est pas traité, le navigateur bloquera les appels du serveur de développement Vite vers `http://localhost:8080`, car les deux adresses n’ont pas la même origine.

Les instructions de démarrage du backend se trouvent dans le [README principal](../README.md).

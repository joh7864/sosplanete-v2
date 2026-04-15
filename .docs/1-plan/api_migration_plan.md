# Plan de Migration API (Jeu v1 -> Backend v2)

Suite à l'audit du code source de `sosplanete-v1` (le jeu), j'ai dressé la cartographie des appels réseaux effectués par le jeu, et je les ai comparés avec l'état actuel de `backend-v2`.

## Constat

Le `backend-v2` a été conçu jusqu'à présent pour l'**interface d'administration** avec une architecture propre (modules `team`, `child`, `action-ref`, etc.). 
Le jeu v1, quant à lui, s'attend à une API plate, avec des endpoints historiques spécifiques (ex: `/categories`, `/actiondone`, `/impact`).

Ces endpoints **n'existent pas** actuellement dans la v2.

## Résolution Architecturale Validée

> [!NOTE]
> Nous allons créer un module dédié **`legacy-api`** au sein de `backend-v2`.
> Ce module regroupera exclusivement tous les endpoints attendus par le Frontend v1, formatant les données mockées ou provenant de la base PostgreSQL v2 exactement comme le jeu les attend, isolant ainsi cette complexité du reste de l'API admin propre.

---

## 1. Routes à implémenter dans `backend-v2` (module `legacy-api`)

Voici la liste exhaustive des endpoints que nous allons devoir recréer pour assurer la rétrocompatibilité. 

### Catégories et Actions
- `GET /categories`
  - *Comportement :* Retourne la liste des catégories d'actions (probablement via une agrégation de `action-ref` dans la DB).
- `GET /categories/:id/actions`
  - *Comportement :* Retourne la liste des actions disponibles pour un identifiant de catégorie.

### Suivi et Validation (Gameplay)
- `POST /actiondone/:childId`
  - *Comportement :* Valide la réalisation d'une action pour un enfant. Le payload est envoyé par le jeu.
- `DELETE /actiondone/:realisedActionId`
  - *Comportement :* Annule la réalisation d'une action.
- `GET /children/:childId/actionsdone?week_id=:week_id`
  - *Comportement :* Récupère les actions réalisées dans la semaine en cours.
- `GET /children/:childId/actionsdone2`
  - *Comportement :* Récupère l'historique complet des actions réalisées par un enfant.

### Scores et Impacts (DataViz du Jeu)
- `GET /impact`
  - *Comportement :* Récupère le bilan global (CO2, Eau, Déchets évités...).
- `GET /impact?week_id=:week_id`
  - *Comportement :* Récupère le bilan pour une semaine précise.
- `GET /teams`
  - *Comportement :* Renvoie la liste et infos basiques des équipes de l'instance.
- `GET /teams/total?week_id=:week_id`
  - *Comportement :* Renvoie le classement/score total des équipes de la semaine de l'instance.
- `GET /school`
  - *Comportement :* Renvoie les informations basiques de l'instance/école (Nom, Objectifs).

---

## 2. Plan d'Implémentation

### Étape A : Création du module `legacy-api`
Dans `backend-v2`, création de la coquille vide pour l'API :
- `src/modules/legacy-api/legacy-api.module.ts`
- `src/modules/legacy-api/legacy-api.controller.ts`
- `src/modules/legacy-api/legacy-api.service.ts`

Ce contrôleur exposera les routes racine attendues par le jeu. La configuration réseau (notamment le port CORS ou la redirection) du projet v1 ajustera `REACT_APP_API_ROOT_URL` en conséquence.

### Étape B : Mocking (Bouchons)
Pour tester rapidement la viabilité du réseau entre le Jeu et la v2 en condition de développement :
- Développement de bouchons (données formatées en dur) pour les endpoints majeurs pour que le jeu s'ouvre complètement (`/categories`, `/school`, etc.).
- Validation visuelle que l'application `sosplanete-v1` démarre sans erreur blanche.

### Étape C : Audit des manques (Admin-v2)
> [!IMPORTANT]
> A la fin de l'étape de mocking des interfaces requises par le jeu, il est hautement probable que l'on se rende compte de "trous administratifs" (ex: la v2 n'a pour l'instant pas d'interface pour définir l'impact environnemental, ou modifier la configuration des catégories du jeu).
> 
> **Livrable de cette étape :** Rédaction d'un plan de modification formel pour évoluer `admin-sosplanete-v2` et sa gestion côté base de données pour couvrir ces manques, soumis pour validation.

### Étape D : Câblage Base de Données
- Au fur et à mesure que la logique est clarifiée (grâce au point C), remplacement progressif des bouchons du `legacy-api.service.ts` par de vrais appels Prisma vers PostgreSQL.
- S'assurer de la concordance des identifiants et des formats de réponse.

---

## Vérification

1. Démarrer la stack et naviguer sur le jeu v1.
2. Constater la bonne récupération réseau des bouchons.
3. Attente de ta validation sur le nouveau plan concernant `admin-sosplanete-v2` avant d'aller plus loin dans la base de données.

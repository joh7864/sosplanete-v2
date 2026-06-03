# Plan d'Implantation : Refonte Backend sos-planete (v2)

Ce plan détaille la refonte complète du backend **sos-planete** (v2). L'objectif est de produire une nouvelle application moderne garantissant une **compatibilité ascendante totale** pour permettre au jeu vidéo existant de fonctionner sans modification.

## Objectifs de la v2
1. **Refonte Technologique** : Migration vers **NestJS / Prisma**.
2. **Compatibilité Ascendante (Livrable Critique)** : Le nouveau backend doit exposer les mêmes endpoints et formats de données que la v1 pour supporter le jeu vidéo des enfants sans mise à jour logicielle côté client.
3. **Evolutions Majeures** : Gestion multi-utilisateurs (AS/AM), Référentiel global, Gamification automatisée.

## ⚓ Couche de Compatibilité (Analyse Swagger Source)

L'analyse de `api.recette.nnauru.org` a identifié les endpoints critiques devant être maintenus à l'identique :

### 1. Authentification & Structure
- **`GET /check_auth`** : Support du Basic Auth (Pseudo/Password).
- **`GET /children/{pseudo}/pseudo`** : Résolution ID enfant via pseudo (utilisé par le jeu).
- **`GET /teams`**, **`GET /teams/{id}/groups`**, **`GET /groups/{id}/children`** : Navigation structurelle.

### 2. Saisie d'Actions (Game Client)
- **`POST /actiondone/{child_id}`** : Enregistrement des actions (Format JSON Array).
- **`GET /children/{id}/actionsdone`** : Historique local enfant.
- **`GET /week`** : Récupération de la période de saisie active.

### 3. Visualisation Impact (Game Dashboard)
- **`GET /impact`** : Score global, Animal débloqué (`AnimalNum`, `DeblocageAnimal`).
- **`GET /teams/{id}/impact`** : Impact par équipe.
- **`GET /teams/{id}/actionsdonefull`** : Détail des actions avec impacts calculés (`CO2evite`, `dechetEvite`, `eauEvitee`).

## Evolutions Avancées v2
- **Rôles AS/AM** : Gestion des accès par instance/école.
- **Référentiel Commun** : Mapping des actions locales sur une base globale gérée par l'AS.
- **Moteur d'Animaux** : Calcul de progression dynamique (9 animaux, courbe 70%).
- **Gestion Temporelle** : Ouverture/Fermeture auto des semaines.

## Plan de Travail
1. **Design Architecture v2** : Schéma Prisma intégrant les tables legacy et les nouvelles entités (Instances, Rôles).
2. **Implémentation API Parity** : Création des contrôleurs NestJS miroirs de la v1.
3. **Tests de Non-Régression** : Vérification des signatures via le Swagger existant.

## Questions pour l'utilisateur
1. Souhaitez-vous que je dessine le schéma de données Prisma complet intégrant à la fois la structure legacy et les nouveaux champs (Rôles, Instances) ?

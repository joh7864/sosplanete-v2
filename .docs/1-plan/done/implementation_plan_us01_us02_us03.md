# Plan d'Implémentation : US-01, US-02, US-03

Ce plan couvre les trois User Stories fondamentales pour la gouvernance multi-instance et l'organisation locale de SOS Planète v2.

---

## État des Lieux

### Ce qui existe déjà (Backend)

| Module | État | Endpoints |
| :--- | :--- | :--- |
| `auth` | ✅ Complet | Login, JWT, `RolesGuard`, `@Roles()` decorator |
| `users` | ✅ Complet | CRUD AS/AM, avatar upload, profil |
| `instance` | ⚠️ Partiel | `POST /`, `GET /`, `GET /:id` — **Manque** : `PUT`, `DELETE`, assignation AM |
| `team` | ⚠️ Partiel | `POST /`, `GET /`, `DELETE /:id` — **Manque** : `PUT /:id`, import CSV |
| `group` | ⚠️ Partiel | `POST /`, `GET /`, `DELETE /:id` — **Manque** : `PUT /:id`, import CSV |
| `child` | ⚠️ Partiel | `POST /`, `GET /`, `DELETE /:id` — **Manque** : `PUT /:id`, import CSV |
| `local-action` | ⚠️ Partiel | `POST /`, `POST /bulk-import`, `GET /` — **Manque** : `PUT` (label/catégorie seulement), `DELETE` |
| `action-ref` | ✅ Complet | CRUD + Search + CSV Import |

### Ce qui existe déjà (Frontend)

| Page | État | Notes |
| :--- | :--- | :--- |
| `/dashboard/instances` | 🔴 Placeholder | Page "Coming Soon" uniquement |
| `/dashboard/organization` | 🟡 Maquette Statique | Données hardcodées (3 équipes fictives), aucun appel API |
| `/dashboard/catalog` | 🟢 Fonctionnel | Affiche les actions du référentiel en mode AM, **Manque** : vrai mapping local |
| Navigation (`DashboardLayout`) | ✅ Prêt | Distinction AS/AM avec liens conditionnels |

### Schéma Prisma

Le schéma est **complet** et prêt pour toutes les US :
- `User` (AS/AM), `Instance`, `Team`, `Group`, `Child`, `LocalAction`, `ActionRef`
- Relations bien définies, contraintes d'unicité en place

---

## Étage 1 : US-01.1 & 01.2 — Gouvernance Multi-Instance

### Objectif
Permettre à un AS de créer/gérer des instances (écoles) et d'y assigner un AM (mono-école).

---

### Backend

#### [MODIFY] [instance.controller.ts](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sos-planete/apps/backend-v2/src/modules/instance/instance.controller.ts)
- Ajouter `PUT /:id` pour modifier `schoolName`, `hostUrl`, `adminId`
- Ajouter `DELETE /:id` avec **suppression en cascade** (Teams, Groups, Children, LocalActions, Periods, ActionsDone) après vérification côté frontend
- Activer les guards `@UseGuards(JwtAuthGuard, RolesGuard)` et `@Roles(Role.AS)` sur les routes d'écriture
- Enrichir `GET /` pour inclure les stats (nombre de teams, d'élèves)

#### [MODIFY] [instance.service.ts](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sos-planete/apps/backend-v2/src/modules/instance/instance.service.ts)
- `update(id, data)` : mise à jour partielle
- `remove(id)` : suppression en cascade complète via transaction Prisma (`$transaction`)
- `findAll()` : enrichir l'include pour remonter les counts `_count: { teams, localActions }`

#### [NEW] `instance/dto/create-instance.dto.ts`
- DTO avec `class-validator` : `schoolName` (required), `hostUrl` (optional, @IsUrl), `adminId` (optional)

#### [NEW] `instance/dto/update-instance.dto.ts`
- DTO partial avec les mêmes champs

---

### Frontend

#### [MODIFY] [instances/page.tsx](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sos-planete/apps/frontend-v2/src/app/dashboard/instances/page.tsx)
Remplacer le placeholder "Coming Soon" par une page fonctionnelle :
- **Header** : Titre + badge "SUPER ADMIN" + bouton "Nouvel Espace"
- **Grille de cartes** : Une `GlassCard` par instance avec :
  - Nom de l'école
  - URL dédiée
  - AM assigné (avatar + nom)
  - Stats (nombre d'équipes, joueurs, actions locales)
  - Boutons édition/suppression
- **Carte "+" dashed** : Bouton d'ajout d'instance (comme sur la page Organization)

#### [NEW] `components/instances/InstanceEditModal.tsx`
- Modal d'édition/création inspirée de `UserEditModal` (GlassCard + barre d'accent latérale)
- Champs : Nom de l'école, URL, sélecteur d'AM (dropdown des users avec `role: AM`)
- Boutons : Enregistrer / Annuler

#### [NEW] `components/instances/InstanceDeleteConfirm.tsx`
- Modal de confirmation de suppression avec **avertissement explicite** :
  - Message : "⚠️ Attention : la suppression de cet espace entraînera la suppression définitive de toutes les données associées (équipes, groupes, joueurs, actions locales, historique)."
  - Boutons : "Supprimer définitivement" (rouge) / "Annuler"
  - Optionnel : champ de confirmation textuel (saisir le nom de l'école)

---

## Étape 2 : US-02.1 — Organisation Locale (CRUD Teams/Groups/Players)

### Objectif
Permettre à un AM de gérer la hiérarchie complète : Équipes → Groupes → Joueurs, avec support de l'import CSV en masse.

---

### Backend

#### [MODIFY] [team.controller.ts](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sos-planete/apps/backend-v2/src/modules/team/team.controller.ts)
- Ajouter `PUT /:id` (name, color, icon)
- Ajouter `POST /import-csv` : import en masse de Teams depuis un fichier CSV
- Enrichir `GET /` pour inclure `groups._count.children`

#### [MODIFY] [team.service.ts](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sos-planete/apps/backend-v2/src/modules/team/team.service.ts)
- `update(id, data, user)` avec vérification d'accès (`user.instanceId`)
- `importFromCsv(instanceId, csvData, user)` : parsing du CSV et création en masse

#### [MODIFY] [group.controller.ts](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sos-planete/apps/backend-v2/src/modules/group/group.controller.ts)
- Ajouter `PUT /:id` (name, teamId)
- Ajouter `POST /import-csv` : import en masse de Groups depuis un fichier CSV

#### [MODIFY] [group.service.ts](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sos-planete/apps/backend-v2/src/modules/group/group.service.ts)
- `update(id, data, user)` avec vérification d'accès
- `importFromCsv(instanceId, csvData, user)` : parsing du CSV et création en masse

#### [MODIFY] [child.controller.ts](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sos-planete/apps/backend-v2/src/modules/child/child.controller.ts)
- Ajouter `PUT /:id` (pseudo, groupId)
- Ajouter `POST /import-csv` : import en masse de Players depuis un fichier CSV

#### [MODIFY] [child.service.ts](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sos-planete/apps/backend-v2/src/modules/child/child.service.ts)
- `update(id, data, user)` avec vérification d'accès
- `importFromCsv(instanceId, csvData, user)` : parsing du CSV et création en masse

#### [NEW] DTOs pour chaque module
- `create-team.dto.ts`, `update-team.dto.ts`
- `create-group.dto.ts`, `update-group.dto.ts`
- `create-child.dto.ts`, `update-child.dto.ts`

#### Format CSV attendu

| Entité | Colonnes CSV |
| :--- | :--- |
| **Teams** | `name`, `color` (optionnel), `icon` (optionnel) |
| **Groups** | `name`, `teamName` (résolu vers teamId) |
| **Players** | `pseudo`, `groupName` (résolu vers groupId) |

> [!TIP]
> Un CSV unifié (Teams + Groups + Players en une seule feuille) pourrait aussi être envisagé pour simplifier l'import initial d'une école : colonnes `teamName`, `groupName`, `pseudo`. Le système créerait automatiquement les entités manquantes.

---

### Frontend

#### [MODIFY] [organization/page.tsx](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sos-planete/apps/frontend-v2/src/app/dashboard/organization/page.tsx)
Remplacer les données hardcodées par une page **hiérarchique fonctionnelle** avec 3 niveaux :

**Structure de la page** :
1. **Barre d'outils** :
   - Bouton "Nouvelle Équipe"
   - Bouton "Importer (CSV)" avec icône Upload
   - Sélecteur d'instance (si AS) ou instance auto-détectée (si AM)
2. **Vue Accordéon Hiérarchique** :
   - **Niveau 1 (Équipe)** : GlassCard avec barre de couleur, nom, icône, compteurs
     - Boutons : Modifier / Supprimer / Ajouter un groupe
   - **Niveau 2 (Groupe)** : Sous-section pliable dans l'équipe
     - Nom du groupe, nombre d'élèves
     - Boutons : Modifier / Supprimer / Ajouter un joueur
   - **Niveau 3 (Joueur)** : Liste d'avatars/pseudos dans le groupe
     - Boutons : Modifier / Supprimer
3. **Bouton "+" Nouvelle Équipe** en carte dashed (déjà en place)

#### [NEW] `components/organization/TeamCard.tsx`
- Carte d'équipe avec couleur d'accent dynamique
- Compteurs intégrés (Groupes, Joueurs)
- Accordéon pour afficher les groupes

#### [NEW] `components/organization/GroupSection.tsx`
- Section pliable pour un groupe
- Liste des joueurs en chips/tags
- Boutons d'actions inline

#### [NEW] `components/organization/TeamEditModal.tsx`
- Modal de création/édition d'une équipe
- Champs : Nom, Couleur (color picker pastel), Icône (sélecteur Lucide)

#### [NEW] `components/organization/GroupEditModal.tsx`
- Modal de création/édition d'un groupe
- Champs : Nom, Équipe (dropdown)

#### [NEW] `components/organization/PlayerEditModal.tsx`
- Modal de création/édition d'un joueur
- Champs : Pseudo, Groupe (dropdown)

#### [NEW] `components/organization/CsvImportModal.tsx`
- Modal d'import CSV unifiée
- **Zone de drop** : Drag & drop d'un fichier CSV
- **Prévisualisation** : Tableau de prévisualisation des données parsées avant validation
- **Sélecteur de type** : Import Teams / Groups / Players / Import complet (3 niveaux)
- **Feedback** : Résumé post-import (X créés, Y ignorés, Z erreurs)

---

## Étape 3 : US-03.1 — Mapping du Catalogue Local

### Objectif
Permettre à un AM de composer le catalogue d'actions de son école à partir du référentiel global, avec personnalisation des libellés (label, description, catégorie uniquement — **pas de surcharge d'impact**).

> [!IMPORTANT]
> **Règle métier critique** : Seul un AS peut modifier les données d'impact (étoiles, CO2, eau, déchets) dans le Référentiel global. Un AM personnalise uniquement le **libellé**, la **description** et la **catégorie** de ses actions locales. La possibilité pour un AM de *proposer* l'ajout d'une nouvelle action au référentiel sera traitée dans une US future.

---

### Backend

#### [MODIFY] [local-action.controller.ts](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sos-planete/apps/backend-v2/src/modules/local-action/local-action.controller.ts)
- Ajouter `PUT /:id` pour modifier **uniquement** `label`, `description`, `category` (pas d'impact)
- Ajouter `DELETE /:id` avec vérification d'intégrité (pas d'`ActionDone` liées)
- Enrichir `POST /` pour accepter `description`

#### [MODIFY] [local-action.service.ts](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sos-planete/apps/backend-v2/src/modules/local-action/local-action.service.ts)
- `update(id, data, user)` avec vérification d'accès — champs autorisés : `label`, `description`, `category`
- `remove(id, user)` avec vérification d'intégrité
- Enrichir `findAll()` pour inclure `actionRef` complet + `_count.actionsDone`

#### [NEW] DTOs
- `create-local-action.dto.ts` : `actionRefId` (required), `customLabel` (optional), `description` (optional), `customCategory` (optional)
- `update-local-action.dto.ts` : `label` (optional), `description` (optional), `category` (optional)

---

### Frontend

#### [MODIFY] [catalog/page.tsx](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sos-planete/apps/frontend-v2/src/app/dashboard/catalog/page.tsx)
Transformer la page en un vrai **outil de mapping** :

**Vue Double-Panel** :
1. **Panel Gauche (60%)** : "Mon Catalogue" — Actions locales de l'instance
   - Liste des actions mappées avec label personnalisé, catégorie, lien vers le ref
   - Indicateur visuel du mapping (code ref + étoiles héritées du référentiel)
   - Boutons : Modifier (label/catégorie) / Supprimer / Voir l'original
2. **Panel Droit (40%)** : "Référentiel Global" — Actions disponibles
   - **Mode Tableau** :
     - Recherche et filtrage
     - Checkbox de sélection par ligne
     - Bouton "+" unitaire sur chaque action non encore mappée
     - Bouton global "Importer la sélection" (multi-sélection)
     - Bouton "Tout importer" pour copier tout le référentiel d'un coup
   - **Mode Cartes (Galerie)** :
     - Vue galerie réutilisant les composants `GalleryGroup` / `ActionGalleryCard`
     - **Sélection multi-cartes** : clic sur une carte = toggle sélectionné (overlay avec ✓)
     - **Barre d'action flottante** : apparaît quand ≥ 1 carte est sélectionnée, affichant "X action(s) sélectionnée(s) — [Importer dans mon espace]"
   - Commutateur Tableau / Cartes (List / LayoutGrid icons)

#### [NEW] `components/catalog/LocalActionCard.tsx`
- Carte d'action locale avec badge du code ref
- Libellé personnalisé en gras, label original en grisé en dessous

#### [NEW] `components/catalog/ActionMappingModal.tsx`
- Modal de personnalisation lors du mapping
- Champs : Label personnalisé (pré-rempli depuis le ref), Description, Catégorie
- **Pas de champs d'impact** — les données d'impact sont héritées automatiquement du référentiel

#### [NEW] `components/catalog/RefActionPicker.tsx`
- Composant de sélection depuis le référentiel (mode Tableau)
- Checkbox multi-sélection, barre de recherche, boutons d'import unitaire et en masse

#### [NEW] `components/catalog/RefGalleryPicker.tsx`
- Composant de sélection depuis le référentiel (mode Galerie/Cartes)
- Overlay de sélection sur chaque carte (✓ vert)
- Barre d'action flottante en bas ("Importer X actions")

---

## Décisions Actées

| Question | Décision |
| :--- | :--- |
| **Suppression d'instance** | Cascade complète avec **avertissement explicite** + confirmation de l'AS |
| **AM mono/multi-école** | **Mono-école** : un AM a un `instanceId` fixe dans son JWT |
| **Import en masse (US-03)** | Oui, depuis la **vue Tableau** ET la **vue Cartes** |
| **Surcharge d'impact par l'AM** | **Non** : seul l'AS modifie l'impact dans le référentiel global |
| **Proposition de nouvelle action** | Prévu pour une **US future** (hors scope de US-03.1) |

---

## User Review Required

> [!IMPORTANT]
> **Ordre d'exécution** : Les étapes sont dépendantes. L'étape 1 (Instances) est un prérequis pour l'étape 2 (Organisation), qui est elle-même un prérequis pour l'étape 3 (Catalogue).

> [!WARNING]
> **JWT `instanceId`** : Actuellement, le JWT inclut un `instanceId` mais sa valeur n'est peuplée que si l'utilisateur est associé à une instance. Il faudra s'assurer que lors de la **création d'un AM**, l'AS lui assigne obligatoirement une instance et que le `instanceId` est correctement inclus dans le token JWT lors du login.

> [!IMPORTANT]
> **Migration Prisma** : Le schéma Prisma existant couvre déjà tous les modèles nécessaires. **Aucune migration n'est requise**. C'est un avantage majeur.

---

## Verification Plan

### Automated Tests
- Tests unitaires des services backend (Instance CRUD, Team CRUD, LocalAction CRUD)
- Tests de guards (`@Roles(Role.AS)` bloque les AM sur les routes instances)
- Tests d'import CSV (format valide, doublons, erreurs)

### Manual Verification
1. Créer une instance en tant que AS, assigner un AM
2. Tester la suppression d'une instance (vérifier l'avertissement + cascade)
3. En tant que AM, créer des équipes, groupes et joueurs manuellement
4. Importer un fichier CSV de joueurs et vérifier la création
5. Mapper des actions du référentiel vers le catalogue local (unitaire + masse + vue cartes)
6. Vérifier que l'AM ne peut PAS modifier les données d'impact
7. Vérifier l'isolation entre instances (un AM ne voit pas les données d'une autre instance)

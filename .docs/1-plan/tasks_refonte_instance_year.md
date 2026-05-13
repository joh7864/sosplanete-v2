# Tasks — Refonte Instance × Année Scolaire

> Référence : `plan_refonte_instance_year.md`
> Démarré le : 2026-05-11
> Statut global : 🟡 PHASE 5 — Stabilisation & Corrections en cours (Recette post-migration)

---

## Phase 1 — Schéma Prisma

### 1.1 Créer le modèle `InstanceYear`
- [x] Ajouter le modèle `InstanceYear` dans `schema.prisma`
  - Champs : `id`, `instanceId` (FK → Instance), `schoolYear`, `isOpen`, `gameStartDate`, `gameEndDate`, `gamePeriodsCount`, `unlockedChapters`
  - Contrainte d'unicité : `@@unique([instanceId, schoolYear])`

### 1.2 Modifier `Period`
- [x] Remplacer `instanceId` + `schoolYear` par `instanceYearId` (FK → InstanceYear)
- [x] Supprimer les anciens champs `instanceId` et `schoolYear` de `Period`

### 1.3 Modifier `Team`
- [x] Remplacer `instanceId` par `instanceYearId` (FK → InstanceYear)

### 1.4 Modifier `Category`
- [x] Remplacer `instanceId` + `schoolYear` par `instanceYearId` (FK → InstanceYear)

### 1.5 Modifier `Instance`
- [x] Supprimer les champs devenus obsolètes : `isOpen`, `gameStartDate`, `gameEndDate`, `gamePeriodsCount`, `currentSchoolYear`

### 1.6 Générer et valider la migration Prisma
- [x] Exécuter migration SQL manuelle avec backfill (40 périodes, 4 teams, 6 catégories migrées)
- [x] Vérifier que la migration s'applique sans erreur sur la base de test ✔️
- [x] Générer le client Prisma (`npx prisma generate`)

---

## Phase 2 — Compatibilité scripts d'import

- [x] Vérifier que les scripts d'import CSV sont compatibles avec le nouveau modèle (`instanceYearId`)
- [x] Adapter `CategoryService.importCsv` pour utiliser `instanceYearId`
- [x] Adapter `TeamService.importCsv` pour utiliser `instanceYearId`
- [x] Adapter `LocalActionService.importByCodes` pour résoudre via `instanceYear`
- [x] Documenter la procédure : Instance → InstanceYear → Teams → Groups → Children → Periods → Actions

---

## Phase 3 — API Backend

### 3.1 Refactorer `InstanceService`
- [x] `GET /instances?schoolYear=X` → retourner les instances via leurs `InstanceYear`
- [x] `POST /instances` → créer `Instance` + `InstanceYear` pour l'année courante
- [x] `DELETE /instances/:id` → supprimer l'`Instance` entière (toutes années)
- [x] `handleCurrentPeriodActivation` porté sur `instanceYearId`
- [x] `syncPeriods` rattaché à `instanceYearId`

### 3.2 Refactorer `PeriodService`
- [x] Remplacer tous les filtres `instanceId + schoolYear` par `instanceYearId`
- [x] Adapter `handlePeriodRotation` (CRON) pour travailler avec `InstanceYear.isOpen`

### 3.3 Refactorer `TeamService`
- [x] Remplacer `instanceId + schoolYear` par `instanceYearId` dans toutes les requêtes

### 3.4 Refactorer `LegacyApiService`
- [x] `getOpenPeriod` : résoudre via `InstanceYear.isOpen = true`
- [x] `getInstanceContext` : retourner `instanceYearId` + `schoolYear`

### 3.5 Autres services refactorés
- [x] `ImpactService` — filtres via `instanceYear` ✔️
- [x] `TrackingService` — filtres via `instanceYearId` ✔️
- [x] `CategoryService` — filtres via `instanceYearId` ✔️
- [x] `GroupService` — navig. via `team.instanceYear.instanceId` ✔️
- [x] `ChildService` — navig. via `team.instanceYear.instanceId` ✔️
- [x] `AuthService` — `loginChild` via `instanceYear` ✔️
- [x] `AnimalUnlockService` — filtres via `instanceYearId` ✔️
- [x] `EcoBarRaceService` — filtres via `instanceYearId` ✔️
- [x] `StimulationService` — `inheritToInstance(instanceYearId)` ✔️
- [x] `YearService` — clone via `InstanceYear` ✔️
- [x] **TypeCheck `src/`** : 0 erreur ✔️

---

## Phase 4 — Frontend Admin

### 4.1 Infrastructure (complété)
- [x] Créer `useInstanceYear(instanceId, schoolYear)` hook avec cache mémoire
- [x] Ajouter `GET /instances/:id/year?schoolYear=` sur le backend
- [x] Ajouter `resolveInstanceYear()` dans `YearService` (création auto si absente)

### 4.2 Pages / Composants mis à jour
- [x] `organization/page.tsx` — utilise `useInstanceYear` + passe `instanceYearId` à `CsvImportModal` et `fetchTeams`
- [x] `tracking/page.tsx` — utilise `useInstanceYear` + passe `instanceYearId` à `ActionsImportModal` et `fetchStats`
- [x] `CsvImportModal` — accepte `instanceYearId?` optionnel, l'inclut dans la query
- [x] `ActionsImportModal` — accepte `instanceYearId?` optionnel, l'inclut dans la query

### 4.3 Composants complémentaires (complété)
- [x] `CategorySettings` — accepte `instanceYearId?`, enrichit `fetchCategories`, `handleSave`, `syncOrder`
- [x] `CategoryImportModal` — accepte `instanceYearId?`, enrichit l'URL CSV import
- [x] `CatalogMapping` — accepte `instanceYearId?`, enrichit `fetchData` et `handleMapActions`
- [x] `CatalogSection` — propage `instanceYearId` via `CatalogMapping`
- [x] `players/page.tsx` — ajoute `useSchoolYear` + `useInstanceYear`, enrichit `fetchTeams`
- [x] `organization/page.tsx` — propage `instanceYearId` à `CategorySettings` et `CatalogMapping`

---

## Phase 5 — Stabilisation & Corrections (Post-Refonte)

### 5.1 Paramétrage Annuel (Complété)
- [x] Rendre `unlockedChapters` modifiable indépendamment par année
  - [x] Backend : Surface via `findOne` et `findAll` avec `schoolYear` query param
  - [x] Admin : Rechargement forcé de l'instance lors du changement d'année (`OrganizationPage`)

### 5.2 Bugs Identifiés (En attente)
- [x] **`C001EQ`** : Équipes multi-années (cloisennement strict par `instanceYearId` manquant)
- [x] **`C002LK`** : Cadenas incohérent (toggle `isOpen` sans contexte d'année sur le dashboard)
- [x] **`C003SC`** : Page Scores vide dans le jeu (filtre imbriqué Prisma défectueux dans legacy-api)
- [x] **`C004CO`** : Formatage décimales CO2/Déchets/Eau sur la page Impacts
- [x] **`C005UN`** : Unités CO2 adaptatives (kg vs tonnes)
- [x] **`C006FT`** : Débordement police sur la page "Moi" (conflit Tailwind/Custom Font)

---

## Validation finale

### Couverture backend (complétée)
- [x] `TeamController` + `TeamService` — acceptent `instanceYearId?` en query, court-circuit
- [x] `CategoryController` + `CategoryService` — acceptent `instanceYearId?` en query, court-circuit
- [x] `TrackingController` + `TrackingService` — acceptent `instanceYearId?` en query, court-circuit
- [x] `GET /instances/:id/year` — résout/crée l'InstanceYear correspondante
- [x] TypeCheck `src/` : 0 erreur TypeScript Backend ✔️
- [x] TypeCheck Frontend : 0 erreur TypeScript ✔️

### Tests manuels (environnement requis)
- [ ] Créer une école, l'inscrire sur deux années différentes
- [ ] Vérifier que supprimer l'année 2024-2025 ne supprime pas l'année 2025-2026
- [ ] Vérifier que ouvrir/fermer un espace n'affecte que l'`InstanceYear` de l'année active
- [ ] Vérifier que les actions saisies dans le jeu sont rattachées à la bonne `InstanceYear`

### Déploiement
- [ ] Rebuild Docker et déploiement en production
- [ ] Procédure de remise en service : purge BDD + imports CSV

---

## Contexte session précédente (10/05/2026)

Des correctifs intermédiaires ont été apportés en attendant cette refonte. **Ils seront remplacés par la refonte**, mais sont actifs en production :

| Fichier | Modification temporaire |
|---|---|
| `legacy-api.service.ts` | `getOpenPeriod` rendu auto-correctif (filtre schoolYear) |
| `instance.service.ts` | `handleCurrentPeriodActivation` avec filtre schoolYear restauré |
| `period.service.ts` | CRON `handlePeriodRotation` corrige le schoolYear null |
| `period.controller.ts` | Ordre des routes corrigé (repair-school-years avant :id) |

> ⚠️ Ces fichiers contiennent des adaptations liées à l'ancien modèle. Ils seront entièrement réécrits lors de la refonte.

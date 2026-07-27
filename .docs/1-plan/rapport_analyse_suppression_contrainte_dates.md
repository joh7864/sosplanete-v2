# 📊 Analyse Exhaustive d'Impact : Suppression des Contraintes de Dates d'Espace

> **Décision analysée** : Permettre la création d'un `InstanceYear` avec une date de début quelconque et une date de fin quelconque, sans restriction liée au format d'année scolaire `YYYY-YYYY`.
>
> **Statut** : ⏸️ *MISE EN VEILLE — Document finalisé, mis de côté pour consultation ultérieure. Aucun code modifié.*
>
> **Dernière mise à jour** : 27 juillet 2026

---

## PARTIE 1 — CONTRAINTES ACTUELLES (ce qui bloque aujourd'hui)

### 1.1 La fonction `validateDatesForSchoolYear` — Backend
**Fichier** : `apps/backend-v2/src/modules/instance/instance.service.ts` (lignes 24–52)

C'est **le verrou principal**. Elle s'exécute à la **création** (ligne 101) et à la **mise à jour** (ligne 454) d'un espace.

```typescript
function validateDatesForSchoolYear(schoolYear, startDate, endDate) {
  const minDate = new Date(Date.UTC(startYear, 7, 1));  // 1er août de l'année N
  const maxDate = new Date(Date.UTC(endYear, 7, 31));   // 31 août de l'année N+1

  if (startDate < minDate || startDate > maxDate)
    throw new BadRequestException(`La date de début n'est pas cohérente avec ${schoolYear}`);
  if (endDate < minDate || endDate > maxDate)
    throw new BadRequestException(`La date de fin n'est pas cohérente avec ${schoolYear}`);
  if (startDate >= endDate)
    throw new BadRequestException(`La date de début doit être antérieure à la date de fin`);
}
```

**Modification à effectuer** : Supprimer les 2 premières vérifications (`minDate`/`maxDate`). Conserver uniquement `if (startDate >= endDate)`.

---

### 1.2 La validation côté Admin — Frontend
**Fichier** : `apps/admin-sosplanete-v2/src/components/organization/PeriodSettings.tsx` (lignes 34–57)

Un message d'erreur bloquant est affiché en rouge dans l'interface, **qui désactive le bouton "Calculer"** si les dates dépassent le tunnel académique.

```typescript
const dateError = useMemo(() => {
  const minDate = new Date(Date.UTC(startYear, 7, 1));  // même logique que le backend
  const maxDate = new Date(Date.UTC(endYear, 7, 31));

  if (start < minDate || start > maxDate) return `La date de début doit être comprise entre...`;
  if (end < minDate || end > maxDate) return `La date de fin doit être comprise entre...`;
  if (start >= end) return "La date de début de jeu doit être antérieure à la date de fin.";
}, [gameStartDate, gameEndDate, schoolYear]);
```

Le bouton est ensuite verrouillé si `dateError` est non nul (ligne 251 : `disabled={saving || !!dateError}`).

**Modification à effectuer** : Supprimer les 2 premières branches. Garder uniquement la condition `start >= end`.

---

## PARTIE 2 — IMPACTS EN CASCADE (effets sur le reste du système)

### 2.1 Le champ `schoolYear` — Contrainte architecturale profonde

**C'est l'impact le plus structurel de toute la décision.**

Actuellement, `schoolYear` au format `"YYYY-YYYY"` (ex: `"2024-2025"`) est utilisé comme **clé de partitionnement** de tous les systèmes. Il s'agit d'une clé primaire composite dans Prisma :

```
instanceId_schoolYear (clé unique dans InstanceYear, GameConfig, LocalAction, SystemConfig)
```

Partout dans le code, `schoolYear` est utilisé pour filtrer, cloner, et identifier les données. Voici les **occurrences concrètes** :

| Fichier | Ligne | Usage |
|:---|:---:|:---|
| `instance.service.ts` | 88 | `data.currentSchoolYear ?? '2024-2025'` — valeur par défaut |
| `instance.service.ts` | 194, 329, 389 | `schoolYear || '2024-2025'` — fallback hardcodé |
| `stimulation.service.ts` | 18, 76, 99, 154 | `schoolYear || '2024-2025'` |
| `stimulation.controller.ts` | 109, 118, 127, 135, 141 | `schoolYear || '2024-2025'` |
| `evoe.controller.ts` | 21, 41, 85 | `schoolYear || '2024-2025'` |
| `tracking.controller.ts` | 22, 41 | `schoolYear || '2024-2025'` |
| `whatsapp.service.ts` | 31, 196 | `schoolYear || '2024-2025'` |
| `impact.controller.ts` | 23, 29, 35, 58, 64 | `schoolYear || '2024-2025'` |

**Conséquence directe** : Si le libellé `schoolYear` devient libre (ex: `"Sprint-Juin-2026"`), toutes ces lignes avec `|| '2024-2025'` comme fallback vont cibler un espace inexistant par défaut, **cassant silencieusement** les fonctionnalités de calcul d'impact, de stimulation WhatsApp, et les Cron Jobs.

**Options possibles (à valider par l'utilisateur)** :
- **Option A (recommandée)** : Maintenir le format `YYYY-YYYY` comme identifiant technique interne, mais n'en plus valider la cohérence avec les dates de jeu.
- **Option B (rupture)** : Transformer `schoolYear` en libellé libre (`spaceName`). Implique une migration Prisma complète.

---

### 2.2 Duplication et clonage d'espace — `YearService`
**Fichier** : `apps/backend-v2/src/modules/instance/year.service.ts`

Lors de l'initialisation (`initializeYear`) ou de la duplication (`duplicateYear`) d'un espace vers un nouvel espace, le système **calcule automatiquement un décalage en années** entre les deux espaces pour ajuster les dates :

```typescript
function getStartYear(yearStr: string): number {
  const match = yearStr.match(/^(\d{4})/);
  return match ? parseInt(match[1], 10) : new Date().getFullYear();
}

const fromStartYear = getStartYear(fromYear);   // ex: "2024-2025" → 2024
const toStartYear   = getStartYear(targetYear); // ex: "2025-2026" → 2025
const yearOffset    = toStartYear - fromStartYear; // → 1

// Puis les dates sont décalées de +1 an automatiquement
gameStartDate: shiftDateByYears(lastIy.gameStartDate, yearOffset) // +1 an
```

**Problème identifié** : Si `schoolYear` n'est plus au format `"YYYY-YYYY"` (ex: `"Sprint-Mars-2026"`), la fonction `getStartYear` retournera `NaN`, et `yearOffset` sera `NaN`. Les dates clonées seront **invalides** (`Invalid Date`).

De même, dans `instance.service.ts` (ligne 522) lors d'une mise à jour :
```typescript
const endYear = new Date(gameEndDate).getFullYear();
const derivedSchoolYear = `${endYear - 1}-${endYear}`; // reconstruit le format YYYY-YYYY depuis gameEndDate
```
Ce mécanisme s'effondre si l'on utilise un libellé libre.

---

### 2.2bis Duplication d'un Espace vers de Nouvelles Dates (Question Annotée)

> 💬 **Question utilisateur** : *"Que se passe-t-il lorsque l'on duplique un espace sur d'autres dates ?"*

**Ce qui se passe aujourd'hui** :
La duplication d'espace (`duplicateYear` dans `year.service.ts`) fonctionne selon ce mécanisme :

1. L'utilisateur saisit `fromYear` (espace source, ex: `"2024-2025"`) et `toYear` (espace cible, ex: `"2025-2026"`).
2. Le système calcule un `yearOffset` en parsant le format `YYYY-YYYY` :
   ```typescript
   const fromStartYear = getStartYear("2024-2025"); // → 2024
   const toStartYear   = getStartYear("2025-2026"); // → 2025
   const yearOffset    = toStartYear - fromStartYear; // → +1 an
   ```
3. Toutes les dates (début/fin de jeu, `GameConfig`) sont **décalées automatiquement de +N années** :
   ```typescript
   gameStartDate: shiftDateByYears(lastIy.gameStartDate, +1) // ex: 1er nov 2024 → 1er nov 2025
   gameEndDate:   shiftDateByYears(lastIy.gameEndDate,   +1) // ex: 31 juil 2025 → 31 juil 2026
   ```
4. Toutes les structures (équipes, groupes, élèves, catalogue d'actions, `GameConfig`) sont clonées dans le nouvel espace.
5. **Les périodes hebdomadaires ne sont pas dupliquées** — elles sont régénérées automatiquement depuis les nouvelles dates via `syncPeriods`.

**Ce qui se passerait avec des dates libres** :
Si le libellé `schoolYear` devient libre (ex: `"Sprint-Mars"` → `"Sprint-Septembre"`), la fonction `getStartYear` retourne `NaN` car elle cherche `\d{4}` en début de chaîne. Résultat :
- `yearOffset = NaN`
- Les dates clonées deviendraient `Invalid Date`
- La duplication échouerait silencieusement ou corromprait les données

**Solution nécessaire si libellés libres (Option B)** :
Remplacer le calcul basé sur `schoolYear` par un calcul basé directement sur les dates `gameStartDate` et `gameEndDate` de l'espace source et cible :
```typescript
// Au lieu de parser le libellé, calculer l'offset depuis les dates effectives
const msOffset = newStartDate.getTime() - fromIy.gameStartDate.getTime();
gameEndDate = new Date(fromIy.gameEndDate.getTime() + msOffset);
```
Cela permettrait de dupliquer vers n'importe quelle date cible sans dépendre du format du libellé.

---

### 2.3 Calcul des Constantes d'Impact Annuelles — `ImpactService`
**Fichier** : `apps/backend-v2/src/modules/impact/impact.service.ts` (ligne 26)

```typescript
year = parseInt(yearOrSchoolYear.split('-')[0], 10); // "2024-2025" → 2024
```

Le service extrait l'année civile **depuis le format `schoolYear`** pour récupérer les constantes scientifiques de l'année correspondante (`annualImpactData`), qui contiennent :
- `dActuel` (données d'impact mondiales)
- `moyCo2Monde`, `moyEauMonde`, `moyDechetsMonde`

**Problème identifié** : Si `schoolYear` = `"Sprint-Mars-2026"`, ce `split('-')[0]` retournera `"Sprint"`, et `parseInt("Sprint")` retournera `NaN`. Le service ne pourra pas récupérer l'année de référence correcte et **créera une nouvelle entrée `annualImpactData` avec `year = NaN`** (ligne 45), ce qui corrompra la base de données.

---

### 2.4 Génération des Périodes Hebdomadaires — `PeriodService`
**Fichier** : `apps/backend-v2/src/modules/period/period.service.ts` (lignes 322–406)

La méthode `syncPeriods` génère toutes les périodes de 7 jours entre `gameStartDate` et `gameEndDate`. Elle est appelée à la création et à chaque modification des dates.

**Effets concrets selon la durée de l'espace** :

| Durée de l'espace | Périodes générées | Impact sur la DB |
|:---|:---:|:---|
| 2 semaines (sprint) | 2 périodes | Acceptable |
| 3 mois (trimestre) | ~13 périodes | Acceptable |
| 9 mois (année typique) | ~39 périodes | Actuel |
| 2 ans | ~104 périodes | Charge DB élevée, transactions lentes |
| 5 ans | ~260 périodes | À proscrire sans pagination |

**Comportement lors d'un raccourcissement de l'espace** (ex: on réduit la date de fin) :
Le code supprime les périodes en excès (lignes 365–385). Si des élèves ont des actions enregistrées sur ces périodes, la suppression déclenche une exception `ConflictException` avec avertissement (ligne 373), sauf si le paramètre `force: true` est passé. L'Admin auto-force actuellement (ligne 99 de `PeriodSettings.tsx`), ce qui signifie que **des données d'élèves peuvent être effacées silencieusement** si la date de fin est réduite.

**Note sur le calcul `gamePeriodsCount`** : Ce champ est actuellement saisi manuellement par l'Admin ou calculé depuis l'interface. Il devrait idéalement être **recalculé automatiquement** à partir des dates lors de chaque enregistrement pour éviter les incohérences.

---

### 2.5 Algorithme de Vitalité HP et d'Impact Annualisé — `EvoeService`
**Fichier** : `apps/backend-v2/src/modules/stimulation/evoe/evoe.service.ts`

Le ratio d'annualisation `52 / gamePeriodsCount` est utilisé dans `getPlayersHealthMap` pour extrapoler l'impact annuel d'une action périodique :

```typescript
const factor = isYearly ? 52 / gamePeriodsCount : 1;
```

**Valeurs et conséquences** :
- `gamePeriodsCount = 39` (9 mois) → `52 / 39 = 1.33` — **nominal**
- `gamePeriodsCount = 13` (trimestre) → `52 / 13 = 4` — impact annualisé multiplié par 4
- `gamePeriodsCount = 2` (sprint 2 semaines) → `52 / 2 = 26` — **surévaluation massive**
- `gamePeriodsCount = 104` (2 ans) → `52 / 104 = 0.5` — impact divisé par 2

**Risque** : Pour un espace de 2 semaines, une action peu impactante (ex: 0.5 kg de CO₂ évité) sera extrapolée à `0.5 × 26 = 13 kg` sur l'année, ce qui gonfle artificiellement les scores et les bilans WhatsApp.

**Note** : Pour les actions `isYearly = false` (actions ponctuelles non-annualisées), le facteur reste `1` quelle que soit la durée de l'espace — pas d'impact.

---

### 2.6 Cron Jobs — Rotation des Périodes et Rapport WhatsApp

#### Rotation automatique quotidienne (23h59)
**Fichier** : `apps/backend-v2/src/modules/period/period.service.ts` (lignes 220–279)

Ce Cron cherche les `InstanceYear` où `isOpen = true`. Il **ne filtre pas par `schoolYear`**. Il fonctionnera donc sans modification pour des espaces à dates libres — aucun impact.

#### Rapport hebdomadaire WhatsApp (Lundi 08h00)
**Fichier** : `apps/backend-v2/src/modules/stimulation/whatsapp.service.ts` (lignes 14–24)

```typescript
const activeConfig = await this.prisma.systemConfig.findFirst({
  orderBy: { id: 'desc' },
});
if (activeConfig) {
  await this.sendReport(activeConfig.schoolYear);
}
```

Puis `sendReport` recherche :
```typescript
const instanceYear = await this.prisma.instanceYear.findFirst({
  where: { schoolYear: sy, isOpen: true },
});
```

**Problème identifié** : Si plusieurs espaces de libellés différents sont ouverts simultanément, le Cron ne ciblera que le premier trouvé via `findFirst`. La sélection est non-déterministe. Une **configuration multi-espaces simultanés** nécessitera une logique de boucle (`findMany`).

---

### 2.7 Authentification des Élèves — `LegacyApiService`
**Fichier** : `apps/backend-v2/src/modules/legacy-api/legacy-api.service.ts`

L'authentification d'un élève cherche les comptes dont le `schoolYear` correspond à l'année calculée par `getCurrentSchoolYear()` :

```typescript
const currentSchoolYear = getCurrentSchoolYear(); // ex: "2025-2026" en juillet
let currentYearChildren = validChildren.filter(
  (c) => c.group.team.instanceYear.schoolYear === currentSchoolYear,
);
// Fallback vers la dernière InstanceYear enregistrée (notre fix récent)
if (currentYearChildren.length === 0) {
  currentYearChildren = [...validChildren].sort(
    (a, b) => b.group.team.instanceYearId - a.group.team.instanceYearId,
  );
}
```

**Comportement avec des libellés libres** : Le fallback récent fonctionne car il trie par `instanceYearId` (plus récent en premier). Un élève inscrit dans un espace `"Sprint-Automne-2026"` sera trouvé et authentifié correctement, même si `schoolYear !== currentSchoolYear`. **Pas de modification requise sur ce point.**

---

### 2.8 Requêtes de listing et filtrage — Partout dans le backend

Dans `instance.service.ts` (ligne 194) et dans de nombreux contrôleurs :
```typescript
const sy = schoolYear || '2024-2025';
```
Ces lignes utilisent `'2024-2025'` comme **valeur par défaut de repli** quand aucun paramètre `schoolYear` n'est passé. Avec des libellés libres, cette valeur de repli sera systématiquement incorrecte à partir de l'année 2026.

**Ces fallbacks hardcodés sont à remplacer** par un mécanisme de résolution dynamique (ex: récupérer le dernier `schoolYear` enregistré en DB).

---

## PARTIE 3 — RÉCAPITULATIF DES FICHIERS À MODIFIER

| Fichier | Nature de la Modification | Priorité |
|:---|:---|:---:|
| `instance.service.ts` | Supprimer les checks min/max dans `validateDatesForSchoolYear` | 🔴 Obligatoire |
| `PeriodSettings.tsx` | Supprimer les checks min/max dans `dateError` | 🔴 Obligatoire |
| `instance.service.ts` | Remplacer les `|| '2024-2025'` par un fallback dynamique | 🟡 Important |
| `stimulation.service.ts` | Remplacer les `|| '2024-2025'` par un fallback dynamique | 🟡 Important |
| `stimulation.controller.ts` | Remplacer les `|| '2024-2025'` par un fallback dynamique | 🟡 Important |
| `evoe.controller.ts` | Remplacer les `|| '2024-2025'` par un fallback dynamique | 🟡 Important |
| `whatsapp.service.ts` | Remplacer les `|| '2024-2025'` par un fallback dynamique | 🟡 Important |
| `impact.controller.ts` | Remplacer les `|| '2024-2025'` par un fallback dynamique | 🟡 Important |
| `tracking.controller.ts` | Remplacer les `|| '2024-2025'` par un fallback dynamique | 🟡 Important |
| `year.service.ts` | Protéger `getStartYear` si `schoolYear` non au format `YYYY-YYYY` | 🟠 Conditionnel |
| `impact.service.ts` | Protéger le `split('-')[0]` si `schoolYear` non au format `YYYY-YYYY` | 🟠 Conditionnel |
| `instance.service.ts` ligne 522 | Protéger la reconstruction `derivedSchoolYear` | 🟠 Conditionnel |
| Tests (`*.spec.ts`) | Mettre à jour les fixtures de test avec de nouveaux formats | 🟢 Secondaire |

> [!IMPORTANT]
> Les modifications **🟠 Conditionnelles** ne sont nécessaires que si le libellé `schoolYear` devient un champ libre (Option B). Si l'on maintient le format `YYYY-YYYY` comme clé interne (Option A), ces fichiers n'ont pas besoin d'être modifiés.

---

## PARTIE 4 — DÉCISIONS À PRENDRE (annotations demandées)

> *Veuillez renseigner vos choix ci-dessous pour que je puisse procéder à l'implémentation.*

**D1 — Format du libellé `schoolYear`**
Le champ `schoolYear` reste-t-il au format `YYYY-YYYY` (identifiant technique), ou devient-il un libellé libre comme `"Sprint-Printemps-2026"` ?
- [ ] Format `YYYY-YYYY` conservé comme identifiant (Option A, plus simple)
- [ ] Libellé libre (Option B, rupture plus profonde)

**D2 — Comportement de la duplication d'espace**
Si l'on duplique un espace `"Sprint-Mars-2026"` vers `"Sprint-Septembre-2026"`, comment doit-on décaler les dates ?
- [ ] Décalage automatique calculé depuis les dates effectives (`gameStartDate`/`gameEndDate`)
- [ ] Aucun décalage — l'admin re-saisit les dates manuellement sur le nouvel espace

**D3 — Valeurs par défaut de `gamePeriodsCount`**
La valeur `24` codée en dur est-elle encore pertinente ? Doit-on la recalculer automatiquement depuis les dates ?
- [ ] Oui, `gamePeriodsCount` = `ceil((gameEndDate - gameStartDate) / 7 jours)` automatiquement
- [ ] Non, l'admin la saisit manuellement

**D4 — Comportement avec des espaces courts (< 4 semaines)**
Faut-il plafonner le coefficient d'annualisation `52 / gamePeriodsCount` pour éviter la surévaluation des impacts sur des sprints très courts ?
- [ ] Oui, plafonner (ex: coefficient max = 4)
- [ ] Non, laisser la formule actuelle

---

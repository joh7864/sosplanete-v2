# Plan de Restructuration : Instance × Année Scolaire

## Diagnostic

Le modèle actuel confond deux concepts distincts :

| Concept | Ce que c'est | Ce qui est modélisé aujourd'hui |
|---|---|---|
| **École** | Entité permanente (Bron, Balan…) | `Instance` ✅ |
| **Participation annuelle** | L'école joue en 2025-2026 | Champ `currentSchoolYear` sur `Instance` ❌ |

Cette confusion explique la majorité des problèmes rencontrés :
- Ouvrir/fermer une école affecte toutes les années
- Supprimer une instance supprime toutes ses années
- Les scores, périodes et équipes n'ont pas de frontière annuelle claire

---

## Modèle cible

### Nouvelle entité : `InstanceYear`

Elle représente **la participation d'une école à une année scolaire donnée**.

```
Instance (entité permanente)
│  schoolName, icon, adminId
│
└── InstanceYear (participation annuelle) ← NOUVEAU
    │  instanceId, schoolYear, isOpen
    │  gameStartDate, gameEndDate, gamePeriodsCount
    │
    ├── Period (semaines de jeu)
    ├── Team (équipes de l'année)
    │    └── Group
    │         └── Child (élèves participants)
    └── Category (catalogue de l'année)
         └── Action
```

---

## Responsabilités par entité

| Entité | Appartient à | Justification |
|---|---|---|
| `Instance` | — (racine) | L'école existe indépendamment des années |
| `InstanceYear` | `Instance` | Une école peut jouer en 2024-2025 et 2025-2026 |
| `Period` | `InstanceYear` | Les semaines sont propres à une année de jeu |
| `Team` | `InstanceYear` | Les équipes sont reformées chaque année |
| `Group` | `Team` | Les classes/groupes sont annuels |
| `Child` | `Group` | Les élèves s'inscrivent par année de jeu |
| `Category` | `InstanceYear` | Le catalogue peut évoluer d'une année à l'autre |
| `Action` | `Category` | Idem |
| `ActionDone` | `Period` + `Child` | Inchangé |

---

## Phases de migration

### Phase 1 — Schéma Prisma

1. Créer le modèle `InstanceYear` avec les champs suivants :
   - `id`, `instanceId` (FK), `schoolYear`, `isOpen`
   - `gameStartDate`, `gameEndDate`, `gamePeriodsCount`
2. Modifier `Period` : remplacer `instanceId + schoolYear` par `instanceYearId`
3. Modifier `Team` : remplacer `instanceId` par `instanceYearId`
4. Modifier `Category` : remplacer `instanceId + schoolYear` par `instanceYearId`
5. Supprimer de `Instance` : `isOpen`, `gameStartDate`, `gameEndDate`, `gamePeriodsCount`, `currentSchoolYear`

### Phase 2 — Reconstruction par imports (table rase)

> **Décision :** Aucune migration des données existantes. La base de production sera remise à zéro et le passé sera reconstruit via les outils d'import existants.

Cela implique :
1. Purger la base de production (ou repartir d'une base vierge)
2. Recréer manuellement les `Instance` (écoles)
3. Créer les `InstanceYear` pour chaque année à reconstituer
4. Importer les données passées (actions réalisées, périodes) via les scripts d'import CSV
5. Les `Team`, `Group` et `Child` sont recréés à partir des imports

**Avantage :** Aucune dette technique liée aux données legacy, modèle propre dès le départ.

### Phase 3 — API Backend

| Avant | Après |
|---|---|
| `GET /instances?schoolYear=X` | Retourne les `InstanceYear` de l'année X avec leur Instance parente |
| `POST /instances` | Crée une `Instance` + une `InstanceYear` pour l'année courante |
| `POST /instances/:id/enroll` | Crée une `InstanceYear` pour une Instance existante sur une nouvelle année |
| `DELETE /instances/:id` | Supprime uniquement l'`InstanceYear` de l'année sélectionnée |
| `DELETE /instances/:id/hard` | Supprime l'`Instance` et toutes ses `InstanceYear` (action irréversible AS) |

### Phase 4 — Frontend Admin

- Le sélecteur d'année change le contexte global : toutes les listes (instances, scores, équipes) sont filtrées par `InstanceYear`
- L'affichage distingue clairement "l'école" (nom, logo) de "sa participation" (ouverte, périodes, équipes)
- L'action "Créer un espace" dans une année ne crée plus une nouvelle `Instance` si l'école existe déjà — elle crée une `InstanceYear`

---

## Impact estimé

| Zone | Niveau d'impact | Détail |
|---|---|---|
| Schéma BDD | 🔴 Élevé | Nouvelle table, FK à modifier sur Period/Team/Category |
| Reconstruction données | 🟢 Faible | Table rase + reconstruction par imports, pas de migration |
| Backend (services) | 🟠 Moyen | Réécriture de `InstanceService`, `PeriodService`, `TeamService` |
| Backend (API) | 🟠 Moyen | Nouveaux endpoints, paramètres modifiés |
| Frontend Admin | 🟠 Moyen | Refonte de la gestion des instances |
| Frontend Jeu (legacy) | 🟢 Faible | `getOpenPeriod` s'adapte, logique inchangée côté élève |

---

## Recommandation

Cette refonte est **incontournable** pour avoir un comportement cohérent. Elle doit être faite en une seule passe (pas incrémentalement) car les modifications de schéma sont profondes.

Avant de commencer, il est conseillé de :
1. Valider le schéma cible sur un environnement de test local
2. Vérifier que les scripts d'import CSV sont compatibles avec le nouveau modèle (`InstanceYear`)
3. Préparer les fichiers CSV de reconstruction pour chaque année et chaque école
4. Prévoir une fenêtre de remise en service (la base prod sera vierge pendant l'opération)

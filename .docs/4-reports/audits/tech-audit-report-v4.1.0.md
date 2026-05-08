# 🛡️ Rapport d'Audit Technique — SOS Planète v2

**Version analysée :** `4.1.0`
**Date d'audit :** 2026-05-08
**Auditeur :** Antigravity Agent (Tech Lead Mode)
**Périmètre :** Backend NestJS (`apps/backend-v2`) + Admin Frontend Next.js (`apps/admin-sosplanete-v2`)

---

## 📋 Synthèse Exécutive

| Dimension | Note | Observations |
|---|---|---|
| Architecture | 🟡 B | Patterns cohérents, mais responsabilités mixtes dans certains services |
| Qualité du Code | 🟠 C+ | Typage `any` systémique, catches silencieux, code mort présent |
| Sécurité | 🔴 D | Failles critiques : secret JWT hardcodé, fallback mot de passe en clair, ValidationPipe absent |
| Robustesse | 🟡 B- | Pas de filtre d'exception global, N+1 queries en production |
| Documentation | 🟡 B- | Pertinente sur certains modules, absente sur d'autres |

**Score global estimé : 12/20**

---

## 🏗️ Phase 1 : Analyse du Contexte Technique

### Stack Technologique

| Composant | Technologie | Version |
|---|---|---|
| Backend | NestJS + TypeScript | `^11.0.1` |
| ORM | Prisma | `^6.19.3` |
| Base de données | PostgreSQL | (via Prisma) |
| Frontend Admin | Next.js (App Router) | `16.2.3` |
| React | React | `19.2.4` |
| Auth | JWT + Passport | JWT `^11.0.2` |
| Animations | Framer Motion | `^12.38.0` |
| Tâches planifiées | `@nestjs/schedule` | `^6.1.3` |

### Architecture Globale

```
apps/
├── backend-v2/          NestJS, 14 modules, Prisma, REST
│   ├── auth/            JWT Strategy, Guards, Roles
│   ├── instance/        Espaces scolaires (cœur métier)
│   ├── period/          Périodes + CRON
│   ├── tracking/        Stats & import CSV
│   ├── stimulation/     Configuration de jeu (GameConfig)
│   ├── team/            Équipes / Groupes / Enfants
│   └── legacy-api/      Rétrocompatibilité v1
└── admin-sosplanete-v2/ Next.js App Router, Client Components
    ├── app/dashboard/   Pages (organization, tracking, users…)
    ├── components/      Composants UI réutilisables
    └── utils/           Helpers (storage, format, assets)
```

**Patterns observés :**
- Architecture en couches (Controller → Service → Prisma) ✅
- Modules NestJS isolés ✅
- Gestion multi-tenant via `instanceId` + `schoolYear` ✅
- Authentification JWT Bearer + Cookie HTTP-Only dual-mode ✅

---

## 🏗️ Phase 2 : Audit Qualité & Robustesse

### 2.1 Typage TypeScript — Fragilité Systémique

> **Niveau : 🟠 DÉGRADÉ**

Le type `any` est utilisé massivement dans les **signatures des méthodes de service** pour le paramètre `user`. Ce pattern empêche le compilateur TypeScript de détecter les erreurs d'accès aux propriétés du contexte d'authentification.

**Occurrences confirmées :**
- `team.service.ts` : `create(data, user: any)`, `findAll(instanceId, user: any)`, `update(id, data, user: any)`…
- `period.service.ts` : tous les endpoints
- `child.service.ts` : tous les endpoints
- `stimulation.service.ts` : `updateSystemConfig(data: any, schoolYear, user: any)`

**Impact :** Aucune garantie que `user.instanceIds`, `user.role`, `user.userId` existent réellement au runtime. Une erreur de configuration du JWT payload passerait inaperçue jusqu'en production.

**Recommandation :** Créer une interface `AuthenticatedUser` et l'utiliser systématiquement.

---

### 2.2 Gestion d'Erreurs — Catches Silencieux

> **Niveau : 🔴 CRITIQUE (pour le débogage)**

Plusieurs blocs `catch` sont totalement silencieux dans le frontend. Cela masque les erreurs réseau et API, rendant le débogage impossible sans les DevTools ouverts.

| Fichier | Ligne | Contexte |
|---|---|---|
| `GeneralSettings.tsx` | 178 | `fetchAMUsers` → échec invisible |
| `GeneralSettings.tsx` | 188 | `fetchPeriods` → échec invisible |
| `GeneralSettings.tsx` | 206 | `fetchGameConfig` → échec invisible |
| `CategorySettings.tsx` | 133, 210, 222 | Saves silencieuses |

**Code observé :**
```typescript
} catch (e) {} // ← Aucun log, aucun feedback utilisateur
```

---

### 2.3 Requêtes N+1 — Performance en Production

> **Niveau : 🟠 DÉGRADÉ**

Dans `instance.service.ts`, la méthode `findAll()` effectue **3 requêtes Prisma par instance** dans un `Promise.all` imbriqué :
- `prisma.child.count(...)` 
- `prisma.actionDone.count(...)`
- `prisma.actionDone.aggregate(...)`

Pour 20 instances, cela génère **60 requêtes DB** à chaque chargement du sélecteur d'instance.

**Localisation :** `instance.service.ts` lignes 81–118.

---

### 2.4 Code Mort & Inconsistances

> **Niveau : 🟡 MINEUR**

| Observation | Fichier | Ligne |
|---|---|---|
| `loadData = fetchTeams` alias inutilisé | `organization/page.tsx` | 205 |
| `expandedTeamId` déclaré mais jamais utilisé (`expandedId` utilisé à la place) | `organization/page.tsx` | 61 |
| Commentaire trompeur `// Keeping to REST if they want, but let's use Patch` sur une route `@Post(':id')` (non PATCH) | `period.controller.ts` | 32 |
| Fichier `package (conflicted).json` à la racine | `/` | — |
| `unlockedChapters` non défini dans `CreateInstanceDto` mais présent dans le corps POST frontend | `GeneralSettings.tsx` | 227 |

---

### 2.5 Algorithme `syncPeriods` — Risque de Suppression de Données

> **Niveau : 🔴 CRITIQUE**

La méthode `syncPeriods()` dans `instance.service.ts` (ligne 293–301) **supprime les périodes existantes avec leurs actions** si le nouveau calcul génère moins de périodes que précédemment.

```typescript
if (currentPeriods.length > generatedPeriods.length) {
  const toDelete = currentPeriods.slice(generatedPeriods.length);
  await this.prisma.$transaction(async (tx) => {
    for (const p of toDelete) {
      await tx.actionDone.deleteMany({ where: { periodId: p.id } }); // ← SUPPRESSION IRRÉVERSIBLE
      await tx.period.delete({ where: { id: p.id } });
    }
  });
}
```

**Scénario de risque :** Un gestionnaire modifie la date de fin du jeu pour la raccourcir → des semaines de données d'actions sont supprimées silencieusement.

---

## 🏗️ Phase 3 : Audit de Sécurité & Conformité

### 3.1 🔴 SECRET JWT HARDCODÉ EN PRODUCTION

> **Niveau : CRITIQUE — Vulnérabilité de Sécurité**

Le secret JWT est hardcodé en fallback dans **deux fichiers** :

```typescript
// jwt.strategy.ts ligne 19
secretOrKey: process.env.JWT_SECRET || 'sosplanete_secret_key_2026'

// auth.module.ts ligne 14
secret: process.env.JWT_SECRET || 'sosplanete_secret_key_2026'
```

Si `JWT_SECRET` n'est pas défini en production, tous les tokens signés avec `'sosplanete_secret_key_2026'` sont valides et la clé est publiquement visible dans le dépôt Git.

**Impact :** N'importe qui ayant accès au code source peut forger des JWT valides et se connecter en tant qu'`AS` (Super Admin).

---

### 3.2 🔴 FALLBACK MOT DE PASSE EN CLAIR (enfants)

> **Niveau : CRITIQUE — Vulnérabilité de Sécurité**

Dans `auth.service.ts` (ligne 70) et `legacy-api.service.ts` (ligne 41), une comparaison en clair du mot de passe est effectuée comme fallback :

```typescript
} else if (pass === child.password) { // Plain text fallback ← FAILLE
```

**Impact :** Des mots de passe stockés en clair (héritage v1) sont acceptés tels quels. Si la DB est compromise, les mots de passe des élèves sont directement lisibles.

---

### 3.3 🔴 ABSENCE DE GLOBAL `ValidationPipe`

> **Niveau : CRITIQUE — Injection & Intégrité des Données**

Le fichier `main.ts` n'inclut **aucun `app.useGlobalPipes(new ValidationPipe())`**. Pourtant, les DTOs utilisent `class-validator` (`@IsString()`, `@IsNotEmpty()`, etc.).

**Conséquence directe :** Les décorateurs `class-validator` sur les DTOs sont **totalement inopérants**. N'importe quel payload malformé est accepté tel quel, contournant toutes les validations définies.

**Exemple :** `POST /instances` avec `{ schoolName: null }` passerait sans erreur malgré `@IsNotEmpty()`.

---

### 3.4 🔴 ABSENCE DE FILTRE D'EXCEPTION GLOBAL

> **Niveau : ÉLEVÉ**

Aucun `GlobalExceptionFilter` n'est enregistré. Les erreurs Prisma non interceptées (ex: `P2002 Unique constraint`) remontent comme des réponses `500 Internal Server Error` avec un stacktrace NestJS complet exposé au client.

**Risque :** Fuite d'information sur la structure de la base de données et les détails d'implémentation.

---

### 3.5 SWAGGER EN PRODUCTION — Fallback Hardcodé

> **Niveau : ÉLEVÉ**

```typescript
// main.ts ligne 43
[swaggerUser]: swaggerPass || "nnauruc'estch0ue!!e" // Fallback temporaire
```

Le mot de passe Swagger est hardcodé dans le code source. Même si ce n'est pas critique, il compromet la documentation API en production si `SWAGGER_PASSWORD` n'est pas défini.

---

### 3.6 JWT Token dans `localStorage`

> **Niveau : MOYEN**

Le frontend stocke `access_token` dans `localStorage` (comportement par défaut de `setAuthData`). Cela expose le token aux attaques XSS. Le backend supporte les cookies HTTP-Only (déjà configuré dans `jwt.strategy.ts`) mais le frontend n'exploite pas ce mécanisme.

---

### 3.7 Absence de Rate Limiting

> **Niveau : MOYEN**

Aucun mécanisme de rate limiting sur les endpoints d'authentification (`/auth/login`, `/auth/child`). Vulnérable aux attaques par force brute.

---

## 🏗️ Phase 4 : Documentation In-Code

### 4.1 Points Positifs
- `utils/storage.ts` : JSDoc pertinent et précis sur la philosophie `localStorage` vs `sessionStorage`
- `year.service.ts` : Commentaires de section clairs (A, B, C, D) pour les étapes de clonage
- `period.service.ts` : Commentaires CRON explicites

### 4.2 Points Négatifs
- `instance.service.ts` : Aucune documentation sur `syncPeriods` malgré la complexité et le risque de suppression de données
- `tracking.service.ts` : Algorithme de stats complexe sans doc
- `organization/page.tsx` : 1110 lignes sans aucun commentaire de section
- Le commentaire `// Keeping to REST if they want, but let's use Patch` dans `period.controller.ts` est trompeur (la route est `@Post`, pas `@Patch`)

---

## 📊 Liste Consolidée des Écarts

| ID | Sévérité | Catégorie | Description | Fichier(s) |
|----|----------|-----------|-------------|-----------|
| SEC-01 | 🔴 CRITIQUE | Sécurité | Secret JWT hardcodé dans le code source | `jwt.strategy.ts`, `auth.module.ts` |
| SEC-02 | 🔴 CRITIQUE | Sécurité | Fallback mot de passe en clair pour les enfants | `auth.service.ts:70`, `legacy-api.service.ts:41` |
| SEC-03 | 🔴 CRITIQUE | Sécurité | `ValidationPipe` global absent → DTOs inopérants | `main.ts` |
| SEC-04 | 🔴 ÉLEVÉ | Sécurité | Aucun filtre d'exception global → stacktrace exposé | `main.ts` |
| SEC-05 | 🔴 ÉLEVÉ | Sécurité | Swagger password hardcodé en fallback | `main.ts:43` |
| BUG-01 | 🔴 CRITIQUE | Robustesse | `syncPeriods()` supprime des actions sans avertissement | `instance.service.ts:293-301` |
| QUAL-01 | 🟠 ÉLEVÉ | Qualité | `user: any` systémique → pas de type-safety sur le contexte auth | `*service.ts`, `*controller.ts` |
| QUAL-02 | 🟠 ÉLEVÉ | Qualité | Catches silencieux masquent toutes les erreurs réseau | `GeneralSettings.tsx:178,188,206` |
| PERF-01 | 🟠 ÉLEVÉ | Performance | N+1 queries dans `findAll()` instances (3 requêtes/instance) | `instance.service.ts:81-118` |
| QUAL-03 | 🟡 MOYEN | Qualité | Code mort : `expandedTeamId`, `loadData` alias, fichier conflicté | `organization/page.tsx` |
| SEC-06 | 🟡 MOYEN | Sécurité | JWT dans localStorage (XSS-vulnerable) | `storage.ts`, tout le frontend |
| SEC-07 | 🟡 MOYEN | Sécurité | Absence de rate limiting sur auth | `auth.controller.ts` |
| DOC-01 | 🟡 MOYEN | Documentation | `syncPeriods()` sans doc malgré comportement destructif | `instance.service.ts` |
| QUAL-04 | 🟡 MINEUR | Qualité | Commentaire trompeur sur `@Post(':id')` dans period controller | `period.controller.ts:32` |

---

## ✅ Checklist de Validation

- [x] Analyse basée uniquement sur des faits observables
- [x] Aucun jugement personnel
- [x] Rapport stocké dans `.docs/4-reports/audits/`
- [x] Version analysée clairement identifiée (`v4.1.0`)

---

## 🔗 Next Steps Recommandés

1. **Immédiat (Bloquant Sécurité) :** SEC-01, SEC-02, SEC-03 — jwt secret, validation pipe, plaintext password
2. **Court terme (Stabilité) :** BUG-01, SEC-04, QUAL-02 — syncPeriods guard, exception filter, catches
3. **Moyen terme (Qualité) :** QUAL-01, PERF-01 — interface AuthUser, optimisation N+1
4. **Long terme :** SEC-06, SEC-07 — migration vers cookies HTTP-Only, rate limiting

# 🏥 Health-Check Technique — Projet SOSPlanète v2

**Date d'évaluation :** 2026-09-03  
**Version évaluée :** `v1.2.0`  
**Statut Global :** 🟡 **ATTENTION (Builds 100% OK / Dette Linter & TypeScript à assainir)**  

---

## 🏗️ 1. Matrice de Santé Globale

| Application | Compilation / Build | Linter (ESLint) | TypeCheck | Dépendances Obsolètes | Statut Général |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **`apps/backend-v2`** | 🟢 **Succès** (`nest build`) | 🔴 **1 372 problèmes** (1 276 erreurs) | 🟢 **Succès** (inclus dans build) | 🟡 19 maj / 13 màj majeures | 🟡 **Stable (Dette TS/Lint)** |
| **`apps/evoe-frontend`** | 🟢 **Succès** (1.40s Vite) | 🔴 **201 problèmes** (190 erreurs) | 🟢 **Succès** (`tsc -b`) | 🟡 15 maj / 6 màj majeures | 🟡 **Stable (Dette React Hooks)** |
| **`apps/admin-sosplanete-v2`** | 🟢 **Succès** (Turbopack 5.5s) | 🔴 **745 problèmes** (382 erreurs) | 🟢 **Succès** (Next.js TS 6.8s) | 🟡 12 maj / 5 màj majeures | 🟡 **Stable (Dette Unescaped/Any)** |

---

## 🛠️ 2. Détail des Compilations & Builds

### 2.1 Backend NestJS (`apps/backend-v2`)
- **Commande :** `npm run build` (`nest build`)
- **Résultat :** 🟢 **Exit code 0**. Compilation TypeScript sans erreur de transpile. Les artefacts dans `dist/` sont générés et prêts pour l'exécution en production (`node dist/main`).

### 2.2 Frontend Evoe 3D (`apps/evoe-frontend`)
- **Commande :** `npm run build` (`tsc -b && vite build`)
- **Résultat :** 🟢 **Exit code 0** (durée : **1.40s**).
- **Modules transformés :** 2 856 modules.
- **Artefacts générés :**
  - `dist/assets/index-DzO_lwS9.js` : 1 800.78 kB (gzip: 510.53 kB)
  - `dist/assets/index-VQ7KPAJS.css` : 37.77 kB (gzip: 7.30 kB)
  - `dist/assets/ChallengeModal-DKB3ZL6w.js` : 25.91 kB
  - `dist/assets/AgentProfileModal-CzUN83CD.js` : 15.57 kB
- ⚠️ **Note d'optimisation :** Le bundle principal dépasse 500 Ko en raison de la suite Three.js et R3F. Il est recommandé de configurer le chunking dynamique dans Vite.

### 2.3 Administration Next.js 16 (`apps/admin-sosplanete-v2`)
- **Commande :** `npm run build` (`next build` Next.js 16.2.3 avec Turbopack)
- **Résultat :** 🟢 **Exit code 0** (compilation 5.5s, validation TypeScript 6.8s).
- **Pages statiques pré-rendues :** 14/14 routes générées avec succès (`/`, `/dashboard`, `/dashboard/catalog`, `/dashboard/organization`, `/dashboard/players`, `/dashboard/reference`, `/dashboard/select-instance`, `/dashboard/settings`, `/dashboard/spaces/wizard`, `/dashboard/users`, `/login`).

---

## 🔍 3. Analyse Détaillée des Erreurs Linter & Code Smells

### 3.1 Backend (`apps/backend-v2`) — 1 372 Problèmes
* **Typage `any` et accès membres non sûrs :** Nombreuses occurrences de `@typescript-eslint/no-unsafe-member-access`, `@typescript-eslint/no-unsafe-call`, `@typescript-eslint/no-unsafe-argument` dans les contrôleurs, services de stimulation et fichiers de test (`test-006.ts`, `recette-runner.ts`).
* **Promesses non gérées (`@typescript-eslint/no-floating-promises`) :** Appels asynchrones non préfixés par `await` ou `void` dans les scripts de seed et de test.

### 3.2 Frontend Evoe (`apps/evoe-frontend`) — 201 Problèmes
* **Effets avec `setState` synchrone (`react-hooks/set-state-in-effect`) :** Détecté dans [useEvoeData.ts](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/evoe-frontend/src/hooks/useEvoeData.ts#L107) (`setShowBriefing`, `fetchChallenges`). Peut induire des re-rendus en cascade.
* **Typage `any` :** Variables d'état des données d'animation 3D et des messages de chat non encore fortement typées.

### 3.3 Admin Frontend (`apps/admin-sosplanete-v2`) — 745 Problèmes
* **Entités non échappées (`react/no-unescaped-entities`) :** Apostrophes `'` et guillemets `"` non échappés dans les étapes du wizard de création d'espace ([Step6Gamification.tsx](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/admin-sosplanete-v2/src/components/wizard/steps/Step6Gamification.tsx), [Step7Communication.tsx](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/admin-sosplanete-v2/src/components/wizard/steps/Step7Communication.tsx), [Step8ReviewLaunch.tsx](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/admin-sosplanete-v2/src/components/wizard/steps/Step8ReviewLaunch.tsx)).
* **Imports orphelins :** Variables d'icônes `lucide-react` importées mais non consommées dans le DOM.

---

## 📦 4. Audit des Dépendances Obsolètes (`npm outdated`)

### 4.1 Dépendances Clés Backend
| Package | Version Actuelle | Version Souhaitée | Dernière Version | Risque / Impact |
| :--- | :---: | :---: | :---: | :--- |
| `@nestjs/common` & `@nestjs/core` | `11.1.18` | `11.2.3` | `12.0.1` | 🟢 Faible (Mineure 11.x stable) |
| `@prisma/client` & `prisma` | `6.19.3` | `6.19.3` | `7.10.0` | 🟡 Moyen (Prisma v7 apporte des breaking changes) |
| `class-validator` | `0.14.4` | `0.14.4` | `0.15.1` | 🟢 Faible |
| `typescript` | `5.9.3` | `5.9.3` | `7.0.2` | 🟡 Moyen |

### 4.2 Dépendances Clés Evoe Frontend
| Package | Version Actuelle | Version Souhaitée | Dernière Version | Risque / Impact |
| :--- | :---: | :---: | :---: | :--- |
| `three` | `0.184.0` | `0.184.0` | `0.185.1` | 🟢 Faible (Patch Three.js) |
| `@react-three/fiber` | `9.6.1` | `9.7.0` | `9.7.0` | 🟢 Faible |
| `framer-motion` | `12.40.0` | `12.43.0` | `13.2.0` | 🟢 Faible sur v12 / 🟡 Attention v13 |
| `vite` | `8.0.16` | `8.2.2` | `8.2.2` | 🟢 Faible (Mise à jour mineure recommandée) |

### 4.3 Dépendances Clés Admin Next.js
| Package | Version Actuelle | Version Souhaitée | Dernière Version | Risque / Impact |
| :--- | :---: | :---: | :---: | :--- |
| `next` & `eslint-config-next` | `16.2.3` | `16.2.3` | `16.3.4` | 🟢 Faible (Correctifs Next.js 16) |
| `tailwindcss` | `4.2.2` | `4.3.3` | `4.3.3` | 🟢 Faible |
| `recharts` | `3.8.1` | `3.10.1` | `3.10.1` | 🟢 Faible |

---

## 🎯 5. Recommandations de Remédiation Immédiate

1. **Exécuter `npm run lint -- --fix`** dans `apps/admin-sosplanete-v2` pour éliminer automatiquement les imports inutilisés et les entités échappables.
2. **Corriger les 2 appels `setState` dans les effets de `useEvoeData.ts`** pour garantir la conformité avec React 19.
3. **Mettre à jour les dépendances patch/mineures sûres** (`vite` 8.2.2, `next` 16.3.4, `@nestjs/*` 11.2.3).

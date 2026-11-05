# 🛡️ Rapport d'Audit Codebase (Tech Lead) — Version 2.4.0

**Date :** 2026-11-05  
**Version analysée :** Monorepo `v2.4.0` (`backend-v2 v2.4.0` · `admin-sosplanete-v2 v2.4.0` · `evoe-frontend v3.2.0` · `sosplanete-v1 v2.4.0`)  
**Périmètre :** `apps/backend-v2`, `apps/admin-sosplanete-v2`, `apps/evoe-frontend` (`apps/sosplanete-v1` recensé en taille)  
**Mode :** Lecture seule & Conformité des règles de gouvernance monorepo.  

---

## 1. Synthèse Exécutive

| Axe | Statut | Constat clé (v2.4.0) | Évolution vs v2.3.0 |
| :--- | :---: | :--- | :--- |
| **Taille des composants clés** | 🟢 | `App.tsx` (519 l.), `MascotBubble3D.tsx` (468 l.) et `App.css` (7 l.) sont **sous les 600 lignes** | 🟢 **Majeure** (-4 600 lignes de monolithe éclatées) |
| **Sécurité (Auth / Guard)** | 🟢 | Guards `AdminOnly` (JWT + rôle AS/AM) en place sur les routes sensibles, routes `/evoe/*` protégées | 🟢 **Sécurisé** (Lots 0 et 1 consolidés) |
| **Validation des entrées** | 🟢 | DTOs Easter Eggs et Telemetry convertis en classes `class-validator` avec `ValidationPipe` | 🟢 **Conforme** |
| **Cycle de vie & Réseau** | 🟢 | Boucle infinie d'appels API 429 résolue via `useRef` et `useCallback` sur `useDashboardLifecycle` | 🟢 **Résolu** (Zéro saturation 429) |
| **Architecture CSS** | 🟢 | Design tokens centralisés (`tokens.css`) et découpage en 10 modules thématiques (`src/styles/`) | 🟢 **Modulaire** (App.css: 3 078 -> 7 lignes) |
| **Code mort / Fichiers orphelins** | 🟢 | 0 fichier source orphelin détecté dans les 3 applications | 🟢 **Sain** |
| **Typage TypeScript** | 🟡 | 810 occurrences de `any` (animations R3F Three.js, sockets, payloads complexes) | 🟡 À typer progressivement |
| **Tests automatisés** | 🟢/🟡 | 10 suites NestJS (43/43 passés) ; Vitest frontend à initialiser | 🟡 Frontend à couvrir |

---

## 2. Phase 1 — Contexte Technique & Cartographie

### Stack Technique en Production
| App | Stack | Rôle |
| :--- | :--- | :--- |
| **`apps/backend-v2`** | NestJS 11, Prisma 6.19, Socket.IO, class-validator, Throttler, Swagger | API REST & WebSockets temps réel |
| **`apps/admin-sosplanete-v2`** | Next.js 16.2 (Turbopack, export statique), React 19, Recharts, dnd-kit, TailwindCSS | Back-office d'administration & cockpit |
| **`apps/evoe-frontend`** | Vite 8, React 19, React Three Fiber / trois 0.184, framer-motion, CSS Modulaire | Application immersive 3D Gardiens |
| **`apps/sosplanete-v1`** | Vite, React Legacy | Version 1 préservée pour historique |

### Cartographie de l'Architecture Applicative
- **Backend Modulaire :** Structuration en modules métier indépendants (`arcade`, `instance`, `legacy-api`, `local-action`, `period`, `stimulation`, `team`, `tracking`).
- **Découplage Easter Eggs Backend :** L'ancien monolithe `easter-egg.service.ts` est désormais segmenté en sous-services spécialisés (`easter-egg-catalog.service.ts`, `easter-egg-chrono.service.ts`, `easter-egg-cycle.service.ts`, `easter-egg-instance.service.ts`, `easter-egg-player.service.ts`, `easter-egg-seed.service.ts`, `easter-egg-tracking.service.ts`).
- **Frontend Décomposé :** `App.tsx` n'agit plus comme un dieu-composant mais comme un orchestrateur épuré (519 lignes) déléguant son cycle de vie à `useDashboardLifecycle`, son audio à `useBirthdayCelebration`, sa 3D à `DashboardCanvas` et ses modales à `DashboardModalsHost`.

---

## 3. Phase 2 — Qualité, Robustesse & SOLID

### 3.1 Respect du principe de responsabilité unique (SRP)
- **[App.tsx](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/evoe-frontend/src/App.tsx) :** Extraction réussie de 7 hooks métier (`useBirthdayCelebration`, `useDashboardLifecycle`, `useDeviceOrientation`, `useEarthOracle`, `useEasterEggFlow`, `useGuideNavigation`, `usePlayerInteractions`) et des conteneurs visuels.
- **[MascotBubble3D.tsx](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/evoe-frontend/src/components/ui/MascotBubble3D.tsx) :** Découpage de la logique de formulaire (`useMascotForm`), du viewport (`useViewportDimensions`), des vignettes (`MascotSchemaThumbnail`) et du panneau de verrouillage (`MascotLockedPanel`).

### 3.2 Robustesse face aux cas limites & boucle 429
- Le correctif appliqué dans [useDashboardLifecycle.ts](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/evoe-frontend/src/hooks/useDashboardLifecycle.ts) stabilise les références mémoires de `fetchEvoeData` et `fetchChallenges` à l'aide de `useRef`.
- [AuthContext.tsx](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/evoe-frontend/src/context/AuthContext.tsx) stabilise `refreshContext` via `useCallback(..., [])`, garantissant l'immunité contre les cycles de re-rendus intempestifs.

---

## 4. Phase 3 — Audit de Sécurité & Conformité

1. **Guards & Autorisations :**
   - Routes d'administration sous guard `AdminOnly` obligatoire (rejet des requêtes anonymes ou non autorisées).
   - Validation stricte des identifiants d'instance avec `ParseIntPipe`.
2. **Validation des Payloads :**
   - Définition de DTOs forts avec `class-validator` pour les requêtes POST/PATCH (`SubmitScoreDto`, `TelemetryEventDto`, etc.).
3. **Protection des Données :**
   - Aucun token ou secret en clair dans le code.
   - Headers d'authentification isolés via `evoeClient`.

---

## 5. Phase 4 — Analyse de la Taille des Fichiers

### Répartition globale (552 fichiers analysés)
- **< 300 lignes :** **406 fichiers (73.6 %)** 🟢
- **300 à 600 lignes :** **103 fichiers (18.7 %)** 🟢
- **> 600 lignes :** **43 fichiers (7.8 %)** 🟡 (dont 39 tolérés au baseline monorepo et 4 dans sosplanete-v1)

### Fichiers prioritaires restants au baseline (> 1 000 lignes) :
1. `apps/backend-v2/src/modules/stimulation/evoe/evoe.service.ts` (2 001 l.)
2. `apps/evoe-frontend/src/components/3d/PlayerAvatar.tsx` (1 715 l.)
3. `apps/evoe-frontend/src/components/ChatPanel.tsx` (1 570 l.)
4. `apps/admin-sosplanete-v2/src/components/easter-eggs/EasterEggsTrackingCockpit.tsx` (1 419 l.)
5. `apps/evoe-frontend/src/components/Portal2026.tsx` (1 333 l.)
6. `apps/admin-sosplanete-v2/src/components/easter-eggs/EasterEggFormModal.tsx` (1 274 l.)
7. `apps/evoe-frontend/src/components/arcade/games/space-invaders/SpaceInvadersGame.tsx` (1 229 l.)
8. `apps/backend-v2/src/modules/legacy-api/legacy-api.service.ts` (1 225 l.)
9. `apps/evoe-frontend/src/components/ui/ChallengeModal.tsx` (1 164 l.)
10. `apps/admin-sosplanete-v2/src/components/tracking/PlayerTrackingTab.tsx` (1 156 l.)

---

## 6. Plan d'Action Recommandé (v2.4.1+)

1. **Initialiser Vitest sur `apps/evoe-frontend`** pour tester unitairement les hooks extraits (`useDashboardLifecycle`, `useEasterEggFlow`, `useBirthdayCelebration`).
2. **Découper le composant 3D [PlayerAvatar.tsx](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/evoe-frontend/src/components/3d/PlayerAvatar.tsx)** (1 715 l.) en sous-composants Three.js dédiés (mesh, animations, survol HUD).
3. **Poursuivre la réduction du typage `any`** en introduisant des interfaces strictes pour les données de télémétrie et Socket.IO.

# 🛡️ Rapport d'Audit Codebase (Tech Lead)

**Date :** 2026-11-03
**Version analysée :** monorepo `v2.3.0` — `backend-v2 v2.3.2` · `admin-sosplanete-v2 v2.3.1` · `evoe-frontend v3.1.2`
**Périmètre :** `apps/backend-v2`, `apps/admin-sosplanete-v2`, `apps/evoe-frontend` (`apps/sosplanete-v1` recensé en taille uniquement)
**Mode :** lecture seule — aucune modification de code effectuée.

> [!NOTE]
> Les tailles sont mesurées en **lignes non vides** (`Measure-Object -Line`). Les tailles réelles sont légèrement supérieures (ex. `App.tsx` : 3 178 non vides / 3 366 au total).

> [!IMPORTANT]
> **État d'avancement (branche `refactor/audit-v2.3.0-security-and-safety-net`)**
> - ✅ **Lot 0** : tests de caractérisation du moteur de cycles (`easter-egg.cycle.spec.ts`, 14 tests) + garde-fou `npm run check:size` (baseline `.size-baseline.json`, 41 fichiers > 600 lignes en comptant les lignes vides).
> - ✅ **Lot 1** : guards `AdminOnly` (JWT + rôle AS/AM) sur les 14 routes `admin/*`, DTO convertis en classes class-validator, `ParseIntPipe`, filtre d'upload durci, routes `/evoe/*` ouvertes sécurisées (voir correction S2).
> - ⏳ Lots 2 à 6 : non démarrés.
>
> **Correction S2** : la plupart des routes `/evoe/*` vérifient déjà le joueur via `Authorization` (`getChildFromAuth`). Les routes réellement ouvertes étaient `GET missions/:instanceId`, `GET profile/:childId` et `POST propulsion/reset/:instanceId` (reset possible sans jeton via `schoolYear`) ; les uploads écrivaient le fichier sur disque avant la vérification d'auth. Tout est corrigé.
---

## 1. Synthèse exécutive

| Axe | Statut | Constat clé |
| :--- | :---: | :--- |
| Sécurité (authn/authz) | 🔴 | Les routes `admin/*` d'Easter Eggs et les routes `evoe/*` n'ont **aucun guard** |
| Validation des entrées | 🔴 | Les DTO Easter Eggs sont des `interface` : `ValidationPipe` ne valide rien. 0 usage de Zod |
| Taille des fichiers | 🔴 | 34 fichiers > 600 lignes (hors v1), dont 4 > 1 800 lignes |
| Typage TypeScript | 🟠 | 622 occurrences de `any` (`: any`, `as any`, `<any>`) |
| SOLID / responsabilité unique | 🔴 | `easter-egg.service.ts` (3 720 l.) et `MainApp` dans `App.tsx` (~3 260 l.) concentrent des dizaines de responsabilités |
| Tests | 🟠 | 9 fichiers de test pour ~350 fichiers source ; 1 seul spec sur le moteur Easter Eggs (8 tests) |
| Code mort / dette | 🟢/🟠 | 12 TODO/FIXME, 22 `console.log/debug`, 2 `eslint-disable`/`@ts-*` |
| Documentation in-code | 🟠 | JSDoc présent sur les méthodes récentes, absent sur de nombreux composants |

---

## 2. Phase 1 — Contexte technique

### Stack
| App | Stack |
| :--- | :--- |
| `backend-v2` | NestJS 11, Prisma 6.19, Socket.IO, class-validator/transformer, Throttler, Swagger |
| `admin-sosplanete-v2` | Next.js 16.2 (Turbopack, export statique), React 19.2, Recharts, dnd-kit, framer-motion |
| `evoe-frontend` | Vite 8, React 19, React Three Fiber / drei / three 0.184, framer-motion, socket.io-client |

### Architecture observée
- Monorepo 3 apps + `packages/`. Backend modulaire NestJS (`modules/<domaine>`), contrôleur → service → Prisma (pas de couche repository).
- `evoe-frontend` : une seule SPA, composant racine `MainApp` (`App.tsx` l.97 → l.3359).
- `admin` : App Router, composants par domaine (`easter-eggs/`, `tracking/`, `organization/`, `catalog/`).

### Contraintes projet (skills `.agent/`)
Next.js 16+ TypeScript strict, Zod pour la validation, Clean Code, tests Vitest, glassmorphism/mobile first.

---

## 3. Phase 2 — Qualité & Robustesse

### 3.1 SOLID / responsabilité unique
| Fichier | Constat observé |
| :--- | :--- |
| `easter-egg.service.ts` (3 720) | 1 classe, 31 méthodes publiques/privées, 112 appels `this.prisma.*`. Mélange : seed, contexte joueur, résolution de cycle, prérequis, validation de réponses, récompenses, leaderboard, CRUD catalogue, import/export, tracking admin, chrono-frise, chrono-egg, méta-énigme. 8 DTO déclarés dans le même fichier. |
| `App.tsx` (3 178) | Un composant `MainApp` de ~3 260 lignes : 15 `useState`, 9 `useEffect`, rendu HUD, modales, logique Easter Eggs, gestes logo (Konami), chrono-egg, etc. |
| `MascotBubble3D.tsx` (2 241) | 123 blocs `style={{…}}` inline ; mélange affichage bulle, sélecteur d'œufs, saisie cryptex, comm-link, lightbox, timers, victoire. |
| `evoe.service.ts` (1 813), `legacy-api.service.ts` (1 103), `chat.gateway.ts` (844), `telemetry.service.ts` (834) | Services « fourre-tout » multi-domaines. |
| `App.css` (2 752) | Feuille globale monolithique, non scindée par composant. |

### 3.2 Gestion d'erreurs
- Filtre global `GlobalExceptionFilter` en place (SEC-04) ✅.
- Contrôleurs Easter Eggs : validations manuelles ponctuelles (`BadRequestException` sur `instanceYearId`, `orderedIds`) ; conversions `+id` sans contrôle `NaN`.
- Requêtes Prisma exécutées **dans des boucles** (`resolveEggForInstance` : par cycle passé × par œuf × par candidat) → risque N+1 et latence.

### 3.3 Code mort / redondance
- Résolution du cycle dupliquée entre `resolveEggForInstance` (joueur) et `getAdminChronoFrise` (admin) : logique « œuf naturel / instances / reports » écrite deux fois avec des règles légèrement différentes (ex. admin : report calculé par `activeEggs[prevC % n]`, joueur : par instances + calendrier).
- `apps/backend-v2/test/recette-runner.ts` (574 l.) et `scripts/run_campaign_evoe_001.ts` (306 l.) : scripts ponctuels dans l'arbre source.
- Fichiers racine hors code : `groups.json` (147 Ko), `hash.txt`, `MISSIONS_FUTURISTES_EVOE.csv`, dossiers `tmp/`, `scratch/`.
- `any` : backend 239 · evoe-frontend 185 · admin 198.

---

## 4. Phase 3 — Sécurité & Conformité

| # | Sévérité | Constat | Localisation |
| :-: | :---: | :--- | :--- |
| S1 | 🔴 Critique | Aucun `@UseGuards` sur `EasterEggController` : les 14 routes `admin/*` (création/suppression de catalogue, import `replace`, reset de progression, upload d'image, force-hint, open/close instance, réglages) sont accessibles sans authentification. Seul `ThrottlerGuard` est global (`APP_GUARD`). | `easter-egg.controller.ts` l.195-358 ; `app.module.ts` l.84-88 |
| S2 | 🔴 Critique | `EvoeController` (`/evoe/*`) : aucun guard (ex. `POST propulsion/reset/:instanceId`, `POST challenges`, `PATCH profile`, uploads d'images). | `evoe.controller.ts` |
| S3 | 🟠 Élevé | Routes joueur identifiées via `Headers('authorization')` + `legacyApiService.getChildFromAuth(...)` : mécanisme maison, hors `JwtAuthGuard`/`RolesGuard` utilisés par les autres modules. | `easter-egg.controller.ts` l.56-190 |
| S4 | 🔴 Critique | **DTO = `interface`** (`SubmitAnswerDto`, `CreateEasterEggDto`, `ImportCatalogDto`…) : aucun décorateur class-validator (0 trouvé). `ValidationPipe` est actif mais sans effet sur ces routes ; `whitelist: false`. | `easter-egg.service.ts` l.22-95 ; `main.ts` l.41-47 |
| S5 | 🟠 Élevé | Nombreux `@Body() body: any` / littéraux inline (team, period, category, impact, stimulation, legacy). | ex. `impact.controller.ts` l.42/49, `category.controller.ts` l.77, `legacy-api.controller.ts` l.67 |
| S6 | 🟠 Moyen | `json({ limit: '50mb' })` global. | `main.ts` l.37-38 |
| S7 | 🟠 Moyen | Upload d'image : extension prise depuis `originalname`, aucun contrôle de MIME ni liste blanche d'extensions. | `easter-egg.controller.ts` l.243-270 |
| S8 | 🟢 | CORS restreint à une liste de domaines + réseaux locaux ; `GlobalExceptionFilter` (SEC-04) ; Throttler global (SEC-07). | `main.ts`, `app.module.ts` |
| S9 | 🟠 | Zod : **0 usage** alors que la règle projet l'impose (frontends et API). | repo |
| S10 | 🟢/🟠 | Réponses d'énigmes : `triggerConfig` masquée pour `RIDDLE_ANSWER_INPUT`, mais renvoyée pour les autres types (`COMM_LINK_COMMAND`, ex. `command: "demain"` visible dans la réponse `/active`) → la solution transite côté client. | `easter-egg.service.ts` l.1236-1262 |
| S11 | 🟠 | URLs `localhost:<port>` codées en dur en repli (3 occurrences front). | `evoe-frontend` |

### Règles CSS/UI
- `MascotBubble3D.tsx` : 123 styles inline, valeurs de couleurs codées en dur (`#0f172a`, `#0284c7`, …) au lieu de tokens/variables.
- `App.css` unique de 2 752 lignes.

---

## 5. Phase 4 — Documentation in-code
- Bon : méthodes Easter Eggs commentées en JSDoc (`resolveEggForInstance`, `checkPrerequisites`), commentaires métier en français.
- Écarts : JSDoc de `resolveEggForInstance` obsolète (cite « reconduit si aucun joueur n'a découvert » alors que la logique est désormais par équipe/rollover) ; peu de JSDoc sur les composants React et hooks ; types de retour implicites (objets littéraux volumineux non typés, ex. `getActiveEasterEgg`).

---

## 6. Phase 5 — Taille des fichiers

### Répartition par application (fichiers `.ts/.tsx/.js/.jsx/.css/.prisma`, hors `node_modules`/`dist`/`.next`)
| App | Total | < 300 | 300–600 | > 600 |
| :--- | :-: | :-: | :-: | :-: |
| backend-v2 | 158 | 140 | 12 | **6** |
| evoe-frontend | 83 | 42 | 23 | **18** |
| admin-sosplanete-v2 | 108 | 65 | 33 | **10** |
| sosplanete-v1 (hors périmètre) | 141 | 133 | 7 | 1 (`PlaneteAnimee.jsx` 1 895) |

### 🔴 > 600 lignes (34 fichiers v2)
| Lignes | Fichier |
| -: | :--- |
| 3 720 | `backend-v2/src/modules/stimulation/evoe/easter-egg.service.ts` |
| 3 178 | `evoe-frontend/src/App.tsx` |
| 2 752 | `evoe-frontend/src/App.css` |
| 2 241 | `evoe-frontend/src/components/ui/MascotBubble3D.tsx` |
| 1 813 | `backend-v2/src/modules/stimulation/evoe/evoe.service.ts` |
| 1 575 | `evoe-frontend/src/components/3d/PlayerAvatar.tsx` |
| 1 471 | `evoe-frontend/src/components/ChatPanel.tsx` |
| 1 343 | `admin/src/components/easter-eggs/EasterEggsTrackingCockpit.tsx` |
| 1 207 | `evoe-frontend/src/components/Portal2026.tsx` |
| 1 207 | `admin/src/components/easter-eggs/EasterEggFormModal.tsx` |
| 1 128 | `evoe-frontend/src/components/ui/ChallengeModal.tsx` |
| 1 120 | `evoe-frontend/src/components/arcade/games/space-invaders/SpaceInvadersGame.tsx` |
| 1 103 | `backend-v2/src/modules/legacy-api/legacy-api.service.ts` |
| 1 082 | `admin/src/components/tracking/PlayerTrackingTab.tsx` |
| 980 | `admin/src/app/dashboard/organization/page.tsx` |
| 890 | `admin/src/components/tracking/TrackingView.tsx` |
| 860 | `evoe-frontend/src/components/ui/AgentProfileModal.tsx` |
| 853 | `evoe-frontend/src/components/ui/AboutModal.tsx` |
| 844 | `backend-v2/src/modules/stimulation/chat.gateway.ts` |
| 834 | `backend-v2/src/modules/tracking/telemetry.service.ts` |
| 830 | `admin/src/components/easter-eggs/EasterEggsCatalogEditor.tsx` |
| 768 | `evoe-frontend/src/components/chat/ChatMessageItem.tsx` |
| 756 | `admin/src/components/easter-eggs/EasterEggsChronoFrise.tsx` |
| 722 | `evoe-frontend/src/components/Arch2070.tsx` |
| 716 | `admin/src/components/wizard/steps/Step4OrganizationStudents.tsx` |
| 715 | `evoe-frontend/src/components/ui/PlayerSearchHUD.tsx` |
| 707 | `evoe-frontend/src/components/birthday/GribouilleBirthdayBubble.tsx` |
| 670 | `evoe-frontend/src/components/ui/MissionCard3D.tsx` |
| 666 | `evoe-frontend/src/components/ui/ChronoEggModal.tsx` |
| 661 | `admin/src/components/catalog/ActionRefEditModal.tsx` |
| 652 | `backend-v2/src/modules/impact/impact.service.ts` |
| 652 | `evoe-frontend/src/components/ui/TemporalEchoModal.tsx` |
| 639 | `evoe-frontend/src/components/ui/EasterEggVictoryDispatcher.tsx` |
| 610 | `admin/src/components/settings/CatalogSection.tsx` |

### 🟠 301–600 lignes (68 fichiers v2) — les plus proches du seuil
`OnboardingGuide.tsx` 599 · `SessionTimelineDrawer.tsx` 586 · `year.service.ts` 580 · `recette-runner.ts` 574 · `CatalogMapping.tsx` 562 · `easterEggAudio.ts` 557 · `SystemMenuHUD.tsx` 556 · `useChatSocket.ts` 552 · `settings/page.tsx` 550 · `schema.prisma` 548 · `EditPlayerModal.tsx` 534 · `EasterEggsSeasonSettings.tsx` 520 · `instance.service.ts` 519 · `period.service.ts` 506 · `easterEggApi.ts` 494 · `PodiumGroup.tsx` 482 · … (liste complète : 68 entrées de 306 à 599 lignes).

### 🟢 < 300 lignes : 247 fichiers v2.

---

## 7. Liste des écarts (ID, sévérité, effort)

| ID | Sév. | Écart | Effort |
| :-: | :-: | :--- | :-: |
| E01 | 🔴 | Guards manquants sur `EasterEggController` (admin) et `EvoeController` | S |
| E02 | 🔴 | DTO Easter Eggs en `interface` → pas de validation runtime | M |
| E03 | 🔴 | `easter-egg.service.ts` 3 720 l. (31 méthodes, 112 appels Prisma) | L |
| E04 | 🔴 | `App.tsx` : composant unique ~3 260 l. | L |
| E05 | 🔴 | `MascotBubble3D.tsx` 2 241 l., 123 styles inline | L |
| E06 | 🟠 | `App.css` 2 752 l. monolithique | M |
| E07 | 🟠 | Autres services backend > 600 l. (`evoe`, `legacy-api`, `chat.gateway`, `telemetry`, `impact`) | L |
| E08 | 🟠 | 28 autres composants/pages > 600 l. | L |
| E09 | 🟠 | 622 `any` | L (progressif) |
| E10 | 🟠 | Duplication logique de cycle joueur/admin (chrono-frise) | M |
| E11 | 🟠 | Prisma dans des boucles (N+1) dans `resolveEggForInstance` | M |
| E12 | 🟠 | Solutions d'énigmes `COMM_LINK_COMMAND` exposées côté client | S |
| E13 | 🟠 | Upload sans contrôle MIME/extension ; body 50 Mo global | S |
| E14 | 🟠 | Couverture de tests faible (9 specs) | M |
| E15 | 🟢 | 22 `console.*`, 12 TODO, JSDoc obsolète, fichiers parasites à la racine | S |

---

# 📋 PLAN DE CORRECTION (à valider avant toute exécution)

> Principes : **un lot = un commit = build + tests verts**. Aucun changement de comportement dans les lots de découpage (refactoring pur, API publique inchangée via fichiers `index.ts` / ré-exports). Seuil cible : **< 300 l. idéal, ≤ 600 l. maximum, 0 fichier > 600 l.**

## Lot 0 — Filet de sécurité (prérequis, 0,5 j)
1. Étendre `easter-egg.service.spec.ts` : tests de caractérisation sur `resolveEggForInstance` (rollover, prérequis persistants, pauses), `checkPrerequisites`, `processPlayerDiscovery`.
2. Snapshot de la réponse `GET /evoe/easter-eggs/active` et `admin/chrono-frise` (script de comparaison avant/après).
3. Ajouter un garde-fou CI/script `npm run check:size` (échec > 600 l., avertissement > 300 l.).

## Lot 1 — Sécurité (priorité absolue, 1 j) — E01, E02, E12, E13
1. `@UseGuards(JwtAuthGuard, RolesGuard)` + `@Roles(...)` sur toutes les routes `admin/*` ; aligner les routes joueur sur un guard dédié.
2. Remplacer les `interface` DTO par des classes (`dto/*.dto.ts`) avec class-validator, ou schémas Zod + pipe `ZodValidationPipe` (à arbitrer, la règle projet cite Zod).
3. Ne plus renvoyer `triggerConfig` sensible au client (validation 100 % serveur).
4. Upload : liste blanche MIME/extension, limite 5 Mo déjà présente ; réduire `json limit` global et le relever uniquement sur les routes concernées.

## Lot 2 — Découpage `easter-egg.service.ts` (3 720 l.) — E03, E10, E11 (3 j)
Cible : un `EasterEggService` **façade** (< 150 l.) qui délègue ; les contrôleurs et le module restent inchangés.

| Nouveau fichier (`stimulation/evoe/easter-egg/`) | Contenu migré (lignes actuelles) | Taille cible |
| :--- | :--- | :-: |
| `dto/*.dto.ts` (+ `easter-egg.types.ts`) | 8 DTO (l.22-95), types de retour | ~150 |
| `easter-egg-seed.service.ts` | `onModuleInit`, `seedDefaultEasterEggs` (l.449-500) | ~250 |
| `easter-egg-context.service.ts` | `getPlayerContext` (l.501-558) | ~100 |
| `easter-egg-cycle.service.ts` | `resolveEggForInstance` éclaté : `computePauseCycles`, `collectRolloverCandidates`, `collectCurrentCandidates`, `buildCycleEggDetails` (l.567-1042) | ~500 (4 fichiers < 200) |
| `easter-egg-prerequisite.service.ts` | `checkPrerequisites` + helpers (l.1339-1445) | ~150 |
| `easter-egg-active.service.ts` | `getActiveEasterEgg` + mapping réponse (l.1050-1328) | ~300 |
| `easter-egg-player.service.ts` | `recordInteraction`, `verifyAnswer`, `validateTrigger`, `processPlayerDiscovery`, `shareEasterEgg`, `getMyDiscoveredEasterEggs` (l.1446-1871, 2021-2079) | ~550 → 2 fichiers |
| `easter-egg-leaderboard.service.ts` | `getDetectiveLeaderboard` (l.1872-2020) | ~150 |
| `easter-egg-catalog.service.ts` | CRUD, reorder, import/export (l.2080-2463) | ~400 |
| `easter-egg-settings.service.ts` | `updateSettings`, `computeDefaultPauseCycles`, barème quotas | ~150 |
| `easter-egg-admin-tracking.service.ts` | `getAdminTracking` (l.2495-2916) découpé en builders | ~450 → 2 fichiers |
| `easter-egg-instance.service.ts` | `openInstanceEgg`, `closeInstanceEgg`, `forceInstanceHint`, `resetEggProgress` | ~350 |
| `easter-egg-chrono.service.ts` | `getChronoEggArchive`, `reopenPeriodEgg`, `submitMetaEnigmaCode` (l.3223-3627) | ~420 |
| `easter-egg-chrono-frise.service.ts` | `getAdminChronoFrise` (l.3628-fin), **réutilise** le calcul de cycle de `easter-egg-cycle.service.ts` | ~400 |
| `easter-egg.utils.ts` | `normalizeAnswer`, helpers purs | ~100 |

Améliorations incluses : pré-charger en 1 requête (`findMany` + `Map`) récompenses/progressions au lieu de requêtes par candidat (E11) ; source unique de vérité du calcul de cycle (E10).
Découper aussi `easter-egg.controller.ts` (331 l.) en `EasterEggPlayerController` / `EasterEggAdminController` (guard de classe sur l'admin).

## Lot 3 — Découpage `App.tsx` (3 178 l.) — E04 (3 j)
Cible : `App.tsx` < 200 l. (routing + providers) ; `MainApp` éclaté.

| Nouveau module | Contenu |
| :--- | :--- |
| `features/dashboard/DashboardScreen.tsx` | rendu principal (scène 3D + HUD) |
| `features/hud/TopHud.tsx`, `TeamBar.tsx`, `EggBadgeSlot.tsx` | en-tête, logo (gestes Konami), badge œuf, bouton chrono-egg |
| `features/easter-eggs/useEasterEggFlow.ts` | état `activeEggData`, `interactWithEgg`, `verifyEasterEggAnswer`, replay, célébration |
| `features/easter-eggs/EasterEggLayer.tsx` | `MascotBubble3D`, `EasterEggVictoryDispatcher`, `ChronoEggModal`, `RosettaStoneModal` |
| `features/konami/useKonamiHud.ts` | logique HUD arcade |
| `features/modals/ModalsHost.tsx` | modales lazy (profil, défis, confirmation…) |
| `features/data/useDashboardData.ts` | chargement/rafraîchissement (existe partiellement : `useEvoeData.ts`) |
| `utils/format.ts` | `parseBold`, `fmtMass`, `fmtVolume`, `getVibrantTeamColor` (l.57-96) |

## Lot 4 — Découpage `MascotBubble3D.tsx` (2 241 l.) + CSS — E05, E06 (2 j)
| Nouveau fichier (`ui/mascot/`) | Contenu |
| :--- | :--- |
| `MascotBubble3D.tsx` | orchestration (< 250 l.) |
| `MascotHeader.tsx` | titre, timer, points IT, fermeture |
| `EggSelector.tsx` | sélecteur compact d'œufs + tooltip |
| `RolloverWarning.tsx` | alerte accumulation (> 4) |
| `CryptexInput.tsx`, `CommandInput.tsx`, `LockedPanel.tsx` | modes de saisie / verrouillé |
| `MascotLightbox.tsx` | agrandissement d'image |
| `useMascotTimer.ts`, `useTypewriter.ts`, `useViewport.ts` | hooks (timer 60 s, machine à écrire, dimensions) |
| `mascot.styles.ts` ou `MascotBubble3D.module.css` | extraction des 123 styles inline + tokens couleur |

`App.css` (2 752 l.) → découpage en `styles/` (`hud.css`, `chat.css`, `arcade.css`, `easter-egg.css`, …) ou CSS Modules par composant, importés au plus près de leur usage.

## Lot 5 — Autres fichiers > 600 l. — E07, E08 (≈ 8 j, parallélisable)

**Backend**
| Fichier | Découpage proposé |
| :--- | :--- |
| `evoe.service.ts` (1 813) | `missions`, `dashboard-status`, `challenges`, `profile`, `birthday`, `onboarding` (1 service chacun) |
| `legacy-api.service.ts` (1 103) | `legacy-auth`, `legacy-actions`, `legacy-stats`, `legacy-children` |
| `chat.gateway.ts` (844) | gateway (connexion/rooms) + `chat-message.handler` + `chat-moderation.service` |
| `telemetry.service.ts` (834) | `ingest`, `aggregation`, `queries` |
| `impact.service.ts` (652) | `impact-constants`, `impact-tuning`, `impact-compute` |

**Admin (Next.js)**
| Fichier | Découpage proposé |
| :--- | :--- |
| `EasterEggsTrackingCockpit.tsx` (1 343) | `TeamProgressTable`, `EventLogPanel`, `EggPicker`, `useAdminTracking`, `CockpitToolbar` |
| `EasterEggFormModal.tsx` (1 207) | une section par fichier (identité, déclencheur, prérequis, récompense, indices) + `useEggForm` |
| `PlayerTrackingTab.tsx` (1 082), `TrackingView.tsx` (890) | filtres / tableau / détail / hooks de données |
| `organization/page.tsx` (980) | sections `TeamsSection`, `GroupsSection`, `PeriodsSection` |
| `EasterEggsCatalogEditor.tsx` (830), `EasterEggsChronoFrise.tsx` (756) | liste / éditeur / drawer ; `CycleCell`, `CycleDrawer`, `useChronoFrise` |
| `Step4OrganizationStudents.tsx` (716), `ActionRefEditModal.tsx` (661), `CatalogSection.tsx` (610) | formulaire/tableau/import séparés |

**evoe-frontend**
| Fichier | Découpage proposé |
| :--- | :--- |
| `PlayerAvatar.tsx` (1 575) | `AvatarMesh`, `AvatarLabel`, `AvatarBadges`, `useAvatarTexture` |
| `ChatPanel.tsx` (1 471) | `ChatList`, `ChatComposer`, `ChatHeader`, `useChatPanel` (+ `ChatMessageItem` 768 → sous-composants par type de message) |
| `Portal2026.tsx` (1 207), `Arch2070.tsx` (722) | scène / HUD / overlays |
| `ChallengeModal.tsx` (1 128) | liste / détail / réponse / résultat |
| `SpaceInvadersGame.tsx` (1 120) | moteur (`engine.ts`), rendu (`render.ts`), entrées, composant |
| `AgentProfileModal` (860), `AboutModal` (853), `PlayerSearchHUD` (715), `GribouilleBirthdayBubble` (707), `MissionCard3D` (670), `ChronoEggModal` (666), `TemporalEchoModal` (652), `EasterEggVictoryDispatcher` (639) | onglets/sections en sous-composants + hooks |

## Lot 6 — Typage, nettoyage & tests (continu) — E09, E14, E15
1. Interdire `any` en nouveau code (`@typescript-eslint/no-explicit-any: error` sur fichiers touchés) ; résorber en priorité les types de réponses API (types partagés dans `packages/`).
2. Supprimer/centraliser les `console.*` (logger Nest / utilitaire de log).
3. Déplacer ou supprimer `recette-runner.ts`, `run_campaign_*.ts`, `groups.json`, `hash.txt`, `tmp/`, `scratch/` hors de l'arbre applicatif.
4. Corriger les JSDoc obsolètes ; ajouter JSDoc sur hooks/composants publics.
5. Tests : un spec par nouveau service du Lot 2 ; tests composants (Testing Library) pour `EggSelector`, `SciFiEggBadge`.

---

## 8. Ordonnancement & Estimation

| Ordre | Lot | Risque | Durée indicative |
| :-: | :--- | :-: | :-: |
| 1 | Lot 0 — filet de sécurité | Faible | 0,5 j |
| 2 | Lot 1 — sécurité | Moyen (impacte les clients : tokens requis sur admin) | 1 j |
| 3 | Lot 2 — `easter-egg.service.ts` | Moyen | 3 j |
| 4 | Lot 3 — `App.tsx` | Élevé (état partagé) | 3 j |
| 5 | Lot 4 — `MascotBubble3D` + CSS | Moyen | 2 j |
| 6 | Lot 5 — autres > 600 l. | Faible à moyen | ~8 j |
| 7 | Lot 6 — dette continue | Faible | continu |

**Critères d'acceptation globaux :** 0 fichier > 600 l. dans `apps/*/src` (hors `.css` générés) ; builds `backend-v2`, `evoe-frontend`, `admin-sosplanete-v2` verts ; suite de tests verte ; réponses d'API identiques (Lot 0) ; 0 route `admin/*` sans guard.

## 9. Checklist de validation
- [x] Analyse basée uniquement sur des faits observables (comptages, extraits de code, routes).
- [x] Aucune modification de code applicatif.
- [x] Rapport stocké dans `.docs/4-reports/audits/`.
- [x] Version analysée identifiée (monorepo v2.3.0).

## 🔗 Next Step
Valider/ajuster ce plan, puis exécuter lot par lot (recommandé : **Lot 0 → Lot 1** immédiatement, la faille S1/S2 étant indépendante du découpage), avec **/refactoring** pour les lots de split et **/debug** pour les correctifs de sécurité.

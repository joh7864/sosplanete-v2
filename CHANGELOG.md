# Journal des Modifications (Changelog)

Toutes les modifications notables apportées à ce projet sont documentées dans ce fichier.
Le format est basé sur [Keep a Changelog](https://keepachangelog.com/fr/1.0.0/), et ce projet adhère à [Semantic Versioning](https://semver.org/lang/fr/).

---

## [2.4.0] - 2026-11-05

### 🛠 Refactoring Majeur & Modularité
- **Refactoring de `App.tsx` :** Découpage du composant racine de `apps/evoe-frontend` de 3 366 lignes à **519 lignes** (seuil < 600 lignes validé).
  - Extraction de 7 hooks métier : `useBirthdayCelebration`, `useDashboardLifecycle`, `useDeviceOrientation`, `useEarthOracle`, `useEasterEggFlow`, `useGuideNavigation`, `usePlayerInteractions`.
  - Extraction des composants conteneurs : `DashboardCanvas` (Canvas Three.js & portails), `TopHud`, `DashboardModalsHost`, `PortraitOrientationOverlay`.
- **Refactoring de `MascotBubble3D.tsx` :** Découpage du composant de 2 241 lignes à **468 lignes** (seuil < 600 lignes validé).
  - Extraction des formulaires (`useMascotForm`), viewport (`useViewportDimensions`), vignettes (`MascotSchemaThumbnail`) et panneau verrouillé (`MascotLockedPanel`).
- **Architecture CSS Modulaire :** Éradication du fichier monolithique `App.css` (3 078 lignes ➔ 7 lignes).
  - Création du système de tokens unifié `src/styles/tokens.css`.
  - Éclatement en 10 modules thématiques : `layout.css`, `codex.css`, `dashboard2070.css`, `radar2070.css`, `profile-modal.css`, `profile-tabs.css`, `profile-easter-eggs.css`, `mobile-nav.css`, `widgets.css`, `mascot.css`.
- **Réduction de la dette technique :** Fichiers tolérés dans `.size-baseline.json` réduits de 42 à **39 fichiers**.

### 🐛 Corrections (Fixes)
- **Élimination de la boucle infinie HTTP 429 (Too Many Requests) :**
  - Stabilisation du polling dans `useDashboardLifecycle.ts` avec `useRef` pour `fetchEvoeData` et `fetchChallenges`.
  - Mémoïsation de `fetchEvoeData` et `fetchChallenges` via `useCallback` dans `useEvoeData.ts`.
  - Mémoïsation de `refreshContext` via `useCallback` dans `AuthContext.tsx`.
- **Corrections de typage et linting :** Correction des signatures d'actions de défis (`challengeTargetTeamId`, `challengePledge`, `onlineUsers`) et des liens Markdown de la documentation.

### ✨ Fonctionnalités (Features)
- **Cycle de vie du Dashboard :** Suspension intelligente du polling lors de la consultation des mini-jeux ou lorsque l'onglet est masqué, avec rattrapage automatique à la réactivation.
- **Cockpit d'Administration Easter Eggs :** Intégration du module de tracking et des panneaux de consultation des codes découverts.
- **Support Responsive & Orientation :** Détection native du mode portrait mobile avec overlay d'incitation au mode paysage et dock tactile.

### 🛡️ Sécurité & Conformité
- Renforcement des autorisations via guards `AdminOnly` sur les routes de configuration et d'administration.
- Validation des payloads avec `class-validator` et `ValidationPipe` NestJS.

---

## [2.3.0] - 2026-11-03

### ✨ Fonctionnalités
- Intégration du système de cycles temporels Easter Eggs.
- Ajout de la frise chronologique Chrono-Egg et des énigmes de 2070.
- Implémentation du mini-jeu d'arcade Space Invaders dans la salle d'arcade.

### 🛡️ Sécurité
- Initialisation du filet de sécurité (Lot 0 & Lot 1) : 14 tests de caractérisation du moteur de cycles.
- Mise en place du garde-fou de taille de fichier `npm run check:size`.

---

## [1.2.0] - 2026-09-03

### ✨ Fonctionnalités
- Initialisation du monorepo SOSPlanète v2 (`backend-v2`, `evoe-frontend`, `admin-sosplanete-v2`).
- Support multi-tenant des années scolaires et des instances.

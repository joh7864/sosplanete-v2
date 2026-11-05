# 📊 Métriques de Développement — Projet SOSPlanète v2

**Date d'analyse :** 2026-11-05  
**Version cible :** `v2.4.0`  
**Périmètre :** Monorepo complet (`backend-v2`, `evoe-frontend`, `admin-sosplanete-v2`, `sosplanete-v1`)  

---

## 📈 1. Synthèse de l'Activité Git

| Indicateur | Valeur | Tendance & Analyse |
| :--- | :---: | :--- |
| **Total des commits** | **416** | Évolution active du monorepo SOSPlanète v2 |
| **Commits `✨ Feat`** | **146** (35.1 %) | Développement des fonctionnalités temporelles, cockpit et mini-jeux |
| **Commits `🐛 Fix`** | **134** (32.2 %) | Corrections post-recette, robustesse et élimination boucle 429 |
| **Commits `🛠 Refactor`** | **15** (3.6 %) | Refactorings majeurs (App.tsx, MascotBubble3D, App.css modulaire) |
| **Commits `📦 Chore / Version`** | **13** (3.1 %) | Synchronisation monorepo, versioning SemVer v2.4.0 |
| **Autres commits** | **108** (26.0 %) | Tests, documentation d'architecture, syncs et optimisations |
| **Ratio Fix / Feat** | **0.92** | 🟡 Ratio soutenu par l'intensification des phases de recette et stabilisation |

### 👥 Répartition des Contributeurs
- **Bot / Agent Antigravity :** 378 commits (90.9 %)
- **joh6478 :** 38 commits (9.1 %)

### 📅 Activité Récente (Dernières évolutions clés)
- **2026-11-05 :** Stabilisation du cycle de vie et polling `useDashboardLifecycle` (élimination du 429 Too Many Requests).
- **2026-11-05 :** Finalisation de la refonte CSS modulaire (Phase 3) : `App.css` découpé de 3 078 à 7 lignes, `mascot.css` extrait, design tokens unifiés.
- **2026-11-05 :** Finalisation du découpage de `App.tsx` (3 366 -> 519 lignes) et `MascotBubble3D.tsx` (2 241 -> 468 lignes).
- **2026-11-05 :** Initialisation et harmonisation des versions du monorepo en `v2.4.0`.
- **2026-11-04 :** Extraction modulaire des composants HUD, Codex, Canvas 3D et overlays Easter Eggs.

---

## 💻 2. Volumétrie et Répartition du Code

Le monorepo totalise **552 fichiers de code source** pour un volume global de **121 996 lignes de code** (hors `node_modules`, `.next`, `dist`, `build`, `coverage`, `OldFiles`).

```
                              RÉPARTITION PAR APPLICATION (LIGNES DE CODE)
  ┌───────────────────────┬────────────┬─────────────┬──────────────┬──────────────────┐
  │ Application           │ Fichiers   │ Lignes      │ Part Lignes  │ Stack Principale │
  ├───────────────────────┼────────────┼─────────────┼──────────────┼──────────────────┤
  │ evoe-frontend         │ 126        │ 42 814      │ 35.1 %       │ Vite / R3F 3D    │
  │ admin-sosplanete-v2   │ 108        │ 33 648      │ 27.6 %       │ Next.js 16 App   │
  │ backend-v2            │ 177        │ 28 772      │ 23.6 %       │ NestJS / Prisma  │
  │ sosplanete-v1         │ 141        │ 16 762      │ 13.7 %       │ Vite / Legacy    │
  ├───────────────────────┼────────────┼─────────────┼──────────────┼──────────────────┤
  │ TOTAL MONOREPO        │ 552        │ 121 996     │ 100.0 %      │ Multi-stack      │
  └───────────────────────┴────────────┴─────────────┴──────────────┴──────────────────┘
```

---

## 📏 3. Analyse de la Taille des Fichiers de Code

Conformément à la règle de gouvernance des 600 lignes :

| Palier de taille | Nombre de fichiers | Pourcentage | Statut |
| :--- | :---: | :---: | :--- |
| **< 300 lignes** | **406** | 73.6 % | 🟢 Excellente modularité unitaire |
| **300 à 600 lignes** | **103** | 18.7 % | 🟢 Conforme à la limite max |
| **> 600 lignes** | **43** | 7.8 % | 🟡 39 en dette tolérée (`.size-baseline.json`), 4 v1 legacy |

### 🏆 Avancées Majeures de Réduction de Dette (v2.4.0)
1. **[App.tsx](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/evoe-frontend/src/App.tsx) :** 3 366 lignes ➔ **519 lignes** (🟢 sous le seuil des 600 lignes).
2. **[MascotBubble3D.tsx](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/evoe-frontend/src/components/ui/MascotBubble3D.tsx) :** 2 241 lignes ➔ **468 lignes** (🟢 sous le seuil des 600 lignes).
3. **[App.css](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/evoe-frontend/src/App.css) :** 3 078 lignes ➔ **7 lignes** (🟢 monolithique éradiqué, modularisé dans `src/styles/`).
4. **Dette résiduelle `.size-baseline.json` :** Réduite de 42 à **39 fichiers** tolérés.

---

## 🧩 4. Fichiers Orphelins & Code Mort

- **Scan des fichiers non référencés :** 0 fichier orphelin détecté dans `apps/evoe-frontend/src`, `apps/admin-sosplanete-v2/src` et `apps/backend-v2/src` (tous les fichiers source sont importés ou rattachés à des points d'entrée/routes).
- **TODO / FIXME :** 0 occurrence active.
- **Appels console de debug :** 384 occurrences répertoriées (à canaliser vers le service de télémétrie/logger NestJS).
- **Typages non stricts (`any`) :** 810 occurrences répertoriées sur le monorepo.

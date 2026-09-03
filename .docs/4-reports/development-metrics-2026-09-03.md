# 📊 Métriques de Développement — Projet SOSPlanète v2

**Date d'analyse :** 2026-09-03  
**Version cible :** `v1.2.0`  
**Périmètre :** Monorepo complet (`backend-v2`, `evoe-frontend`, `admin-sosplanete-v2`, `sosplanete-v1`)  

---

## 📈 1. Synthèse de l'Activité Git

| Indicateur | Valeur | Tendance & Analyse |
| :--- | :---: | :--- |
| **Total des commits** | **298** | Historique complet du projet v2 |
| **Commits `✨ Feat`** | **138** (46.3 %) | Fort dynamisme de développement fonctionnel |
| **Commits `🐛 Fix`** | **103** (34.6 %) | Stabilisation et corrections post-implémentation |
| **Commits `🛠 Refactor`** | **2** (0.7 %) | Refactorings explicites dédiés |
| **Commits `📦 Chore / Version`** | **17** (5.7 %) | Bumps de version et initialisations de packages |
| **Autres commits** | **38** (12.7 %) | Documentation, synchronisations Blyx et configurations |
| **Ratio Fix / Feat** | **0.75** | 🟢 Ratio d'équilibre sain (recommandé < 0.85) |

### 👥 Répartition des Contributeurs
- **Bot / Agent Antigravity :** 260 commits (87.2 %)
- **joh6478 :** 38 commits (12.8 %)

### 📅 Activité Récente (10 derniers jours)
- **2026-09-03 :** 1 commit (Blyx Sync)
- **2026-09-02 :** 8 commits (Initialisation packages v1.2.0, harmonisation indicateurs d'économie, corrections leaderboard)
- **2026-09-01 :** 1 commit
- **2026-08-31 :** 4 commits
- **2026-08-30 :** 1 commit
- **2026-08-29 :** 8 commits (Version v1.1.2, corrections dashboard 2026 & leaderboard)
- **2026-08-28 :** 21 commits (Sprint intensif : FTUX Onboarding Guide, tracking service, CSS layout)
- **2026-08-27 :** 3 commits
- **2026-08-25 :** 4 commits
- **2026-08-24 :** 2 commits

---

## 💻 2. Volumétrie et Répartition du Code

Le monorepo totalise **419 fichiers de code source** pour un volume de **77 218 lignes de code** (hors `node_modules`, `.next`, `dist`, `build`, `coverage`, `OldFiles`).

```
                              RÉPARTITION PAR APPLICATION (LIGNES DE CODE)
  ┌───────────────────────┬────────────┬─────────────┬──────────────┬──────────────────┐
  │ Application           │ Fichiers   │ Lignes      │ Part Lignes  │ Stack Principale │
  ├───────────────────────┼────────────┼─────────────┼──────────────┼──────────────────┤
  │ admin-sosplanete-v2   │ 92         │ 23 809      │ 30.8 %       │ Next.js 16 App   │
  │ evoe-frontend         │ 43         │ 18 323      │ 23.7 %       │ Vite / R3F 3D    │
  │ backend-v2            │ 142        │ 18 294      │ 23.7 %       │ NestJS / Prisma  │
  │ sosplanete-v1         │ 142        │ 16 792      │ 21.8 %       │ Vite / Legacy    │
  ├───────────────────────┼────────────┼─────────────┼──────────────┼──────────────────┤
  │ TOTAL MONOREPO        │ 419        │ 77 218      │ 100.0 %      │ Multi-stack      │
  └───────────────────────┴────────────┴─────────────┴──────────────┴──────────────────┘
```

---

## 📏 3. Analyse de la Taille des Fichiers de Code

Conformément aux standards de qualité Clean Code du projet :

| Palier de Taille | Nombre de Fichiers | Pourcentage | Statut |
| :--- | :---: | :---: | :--- |
| **< 300 lignes** *(Conforme Clean Code)* | **333** | **79.5 %** | 🟢 Excellente granularité globale |
| **300 à 600 lignes** *(Attention / À surveiller)* | **63** | **15.0 %** | 🟡 Composants et services complexes |
| **> 600 lignes** *(Critique / Fichiers volumineux)* | **23** | **5.5 %** | 🔴 Nécessite refactorisation modulaire |

### 🚨 Top 10 des Fichiers les Plus Volumineux (> 600 lignes)

1. [App.tsx](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/evoe-frontend/src/App.tsx) — **2 416 lignes** (Frontend Evoe)
2. [App.css](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/evoe-frontend/src/App.css) — **2 251 lignes** (Frontend Evoe)
3. [PlaneteAnimee.jsx](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/sosplanete-v1/src/components/planete/PlaneteAnimee.jsx) — **1 909 lignes** (Legacy v1)
4. [evoe.service.ts](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/backend-v2/src/modules/stimulation/evoe/evoe.service.ts) — **1 871 lignes** (Backend v2)
5. [ChatPanel.tsx](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/evoe-frontend/src/components/ChatPanel.tsx) — **1 410 lignes** (Frontend Evoe)
6. [ChallengeModal.tsx](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/evoe-frontend/src/components/ui/ChallengeModal.tsx) — **1 164 lignes** (Frontend Evoe)
7. [legacy-api.service.ts](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/backend-v2/src/modules/legacy-api/legacy-api.service.ts) — **1 078 lignes** (Backend v2)
8. [page.tsx](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/admin-sosplanete-v2/src/app/dashboard/organization/page.tsx) — **1 023 lignes** (Admin v2)
9. [TrackingView.tsx](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/admin-sosplanete-v2/src/components/tracking/TrackingView.tsx) — **940 lignes** (Admin v2)
10. [Portal2026.tsx](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/evoe-frontend/src/components/Portal2026.tsx) — **881 lignes** (Frontend Evoe)

---

## 🎯 4. Recommandations de Vélocité et Dette Technique

1. **Prioriser le découpage des 5 composants géants** d'`evoe-frontend` (`App.tsx`, `ChatPanel.tsx`, `ChallengeModal.tsx`) pour faciliter la maintenance et les tests unitaires.
2. **Maintenir le ratio Fix/Feat sous 0.80** lors des prochains sprints.
3. **Mettre en place un script `npm run metrics`** unifié à la racine du monorepo pour automatiser la génération hebdomadaire de ces statistiques.

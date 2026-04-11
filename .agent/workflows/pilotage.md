---
description: WORKFLOW - Suivi de l'avancement du projet
---

# 🎯 Workflow : Pilotage & Dashboard

> [!IMPORTANT]
> Ce workflow est le garant de la visibilité projet. Il doit être exécuté pour synchroniser la réalité du terrain avec le dashboard de pilotage.

## 🏗️ Phase 1 : Collecte des Métriques
Extraire les données réelles du projet via les commandes automatiques.
// turbo
```bash
npm run status
```
Cela met à jour les KPIs de Vélocité, Bundle Size, et Dette Technique.

## 🏗️ Phase 2 : Mise à jour de la Roadmap
- Analyser l'état des User Stories dans `.docs/3-fct/`.
- Mettre à jour les statuts (🟢 DONE, 🟡 IN PROGRESS, ⚪ TODO, 🔴 BLOCKED).

## 🏗️ Phase 3 : Actualisation du Dashboard
Mettre à jour le fichier `dashboard.md` avec :
- Les indicateurs de performance (KPI).
- Le calcul de la **Vélocité Réelle** (Story Points réalisés / Heure) en s'appuyant sur la matrice `.docs/1-pilotage/complexity-matrix.md` et les données de `.docs/history/time-analysis.md`.
- Les graphiques Mermaid (Burn-up, Burndown).
- Le tableau de santé applicative.

## 📦 Livrables
- **`.docs/1-pilotage/dashboard.md`** : Source de vérité du pilotage.

## ✅ Checklist de Validation
- [ ] La vélocité (Ratio Story Points/Heure) est calculée précisément via la matrice de complexité.
- [ ] Tous les graphiques Mermaid sont passants.
- [ ] La roadmap fonctionnelle est synchronisée avec la réalité Git.

## 🔗 Next Step
> Communiquer l'état d'avancement via une notification de fin de tâche.

---
description: Workflow - Architecte pour concevoir une solution technique robuste et pérenne.
---

# 🏛️ Workflow : Architecture & Stratégie

> [!CAUTION]
> **ZÉRO GÉNÉRATION DE CODE D'IMPLÉMENTATION**
> Ce workflow est réservé à la conception.
> - Seuls les diagrammes (Mermaid) et documents (`implementation_plan.md`, `task.md`) sont autorisés.
> - Le code sera généré uniquement via le workflow **/code**.

## 🏗️ Phase 1 : Analyse & Discovery
- Analyser le besoin métier (Le "Pourquoi").
- Cartographier l'impact sur l'existant (Fichiers, Composants).
- Identifier les points de risque (Performance, Sécurité, Offline).

## 🏗️ Phase 2 : Architecture Technique & Data
- **Modèle de Données** : Extensions IndexedDB (Dexie) ou nouveaux types.
- **Flux** : Schématiser le transit de la donnée (Server Action -> Context -> UI).
- **Sécurité** : Validation Zod, frontières de confiance.
- **PWA** : Impact sur le Service Worker ou la mise en cache.

## 🏗️ Phase 3 : Design System & UX Premium
Questions obligatoires à trancher :
- **Splash Screen** : Quel effet "Wahoo" au lancement ? Quel visuel thématique ?
- **Thème** : Couleurs dominantes, Dark/Light mode.
- **Micro-interactions** : Animations Framer Motion, transitions fluides.

## 🏗️ Phase 4 : Stratégie d'Implémentation (Phasing)
Découper le travail en étapes atomiques :
1. **Setup & Refacto** : Préparation.
2. **Core Logic** : Modèles, Services, API.
3. **UI Components** : Composants "Dumb".
4. **Integration** : Composants "Smart" & Intégration.
5. **Polish** : Animations et peaufinage.

## 📦 Livrables
- **`.docs/2-architecture/implementation_plan.md`** : Stratégie et impact.
- **`.docs/2-architecture/task.md`** : Tâches granulaires (< 1h) avec estimations.
- **`.docs/1-pilotage/dashboard.md`** : Mise à jour des KPIs s'il y a lieu.

## ✅ Checklist de Validation
- [ ] `implementation_plan.md` complet avec section "User Review Required".
- [ ] `task.md` contient uniquement des tâches < 1h avec estimations.
- [ ] Schémas Mermaid inclus pour les logiques complexes.

## 🔗 Next Step
> Passer à l'initialisation technique avec **/scaffold** ou au développement avec **/code**.
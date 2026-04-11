---
description: Unified Quality Pipeline (Lint, TypeCheck, Test, Build)
---

# 🛡️ Workflow : Pipeline de Qualité (Full)

> [!IMPORTANT]
> Ce workflow assure la conformité technique complète avant toute livraison ou release. C'est le juge de paix du projet.

## 🏗️ Phase 1 : Analyse Statique & Types
Vérification de la sécurité du typage et des standards de style.
// turbo
```bash
npx eslint --fix
npm run type-check
```

## 🏗️ Phase 2 : Tests & Couverture
Exécution de la suite complète Vitest.
// turbo
```bash
npm run test:coverage
```
> [!NOTE]
> Cible : 100% de couverture sur les nouveaux services et composants critiques.

## 🏗️ Phase 3 : Build & Bundle Export
Vérification de l'intégrité de la compilation Next.js.
// turbo
```bash
npm run quality
```

## 🏗️ Phase 4 : Rapport de Santé
Synthèse des résultats pour mise à jour du dashboard.

## 📦 Livrables
- Rapport de validation dans `.docs/4-reports/`.
- Mise à jour des compteurs de santé dans `dashboard.md`.

## ✅ Checklist de Validation
- [ ] Lint OK (Zéro warning).
- [ ] Typescript OK (Zéro erreur).
- [ ] Tests OK (Passants + Couverture satisfaisante).
- [ ] Build OK (Compilation réussie).

## 🔗 Next Step
> Mettre à jour le pilotage avec **/pilotage** ou préparer la sortie avec **/release**.
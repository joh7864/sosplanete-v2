---
description: Pipeline de validation allégé (Lint + TypeCheck + Build)
---

# 🛡️ Workflow : Pipeline de Qualité (Light)

> [!IMPORTANT]
> Version accélérée du pipeline de qualité, focalisée sur l'intégrité du build et la propreté du code sans exécution des tests lourds.

## 🏗️ Phase 1 : Analyse Statique
// turbo
```bash
npx eslint --fix
npm run type-check
```

## 🏗️ Phase 2 : Validation du Build
Vérification que l'application peut être exportée.
// turbo
```bash
npm run build
```

## 🏗️ Phase 3 : Rapport Flash
Confirmation rapide du statut technique.

## 📦 Livrables
- Log de validation dans le terminal.
- Mise à jour facultative du dashboard.

## ✅ Checklist de Validation
- [ ] Lint OK.
- [ ] Types OK.
- [ ] Build OK.

## 🔗 Next Step
> Utiliser le workflow **/pilotage** pour confirmer l'état d'avancement.
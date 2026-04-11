---
description: Workflow - Cycle complet de release (Qualité -> Versioning -> Build -> Report)
---

# 🚀 Workflow : Release Management

> [!IMPORTANT]
> Ce workflow orchestre le cycle complet de livraison d'une version stable. L'ordre est critique : le bump de version doit précéder le build de production pour que le bundle embarque la bonne version.

## 🏗️ Phase 1 : Validation Qualité (Lint, Types, Tests)
Vérifier l'absence de régression **sans build**. Le build sera lancé en Phase 3, après le bump.
// turbo
```bash
npx eslint --fix
npm run type-check
npm run test:coverage
```

## 🏗️ Phase 2 : Versioning & Historisation
Appliquer le bump de version sémantique **avant** le build pour que le bundle de production embarque la bonne version.
// turbo
```bash
/bump-version
```

## 🏗️ Phase 3 : Build Final de Validation
Compiler le bundle de production avec la version cible désormais intégrée.
// turbo
```bash
npm run build
```

## 🏗️ Phase 4 : Historisation, Vélocité & Audit Global
Extraire les métriques de temps, calculer la vélocité de l'itération (Story Points) et générer le rapport de santé de fin de cycle.
// turbo
```bash
/history
/audit-global
```

## 🏗️ Phase 5 : Finalisation & Archivage
- Vérifier que le dossier `.docs/4-reports/` contient le rapport d'audit final.
- S'assurer que le `CHANGELOG.md` et le `dashboard.md` reflètent la nouvelle version.

## 📦 Livrables
- Version stable dans `package.json`.
- Changelog à jour.
- Historique et analyse de vélocité à jour (`.docs/history/`).
- Ensemble des rapports d'audit archivés.

## ✅ Checklist de Validation
- [ ] La version dans le build correspond au `package.json`.
- [ ] Build de production validé avec la bonne version.
- [ ] L'historique des requêtes et le temps passé ont été recompilés (`/history`).
- [ ] La vélocité (SP/Heure) de la nouvelle release a été calculée et documentée.
- [ ] Tous les KPIs dans `dashboard.md` sont à jour.
- [ ] La documentation technique est alignée avec la version.

## 🔗 Next Step
> Commiter les changements et informer l'utilisateur du succès de la release.

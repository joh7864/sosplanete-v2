---
description: Génère les rapports de qualité, métriques et audits du projet avec horodatage
---

# 📊 Workflow : Audit Global & Rapports

> [!IMPORTANT]
> Ce workflow centralise la génération de tous les rapports de santé et de performance du projet. Chaque document doit être horodaté pour assurer une traçabilité parfaite.

## 🏗️ Phase 1 : Métriques de Développement
Générer les statistiques d'activité via les scripts internes.
// turbo
```bash
npm run metrics
```
L'analyse doit couvrir les commits, le ratio fix/feat, et la vélocité estimée.

## 🏗️ Phase 2 : Audits Techniques & Design
Lancer les audits spécialisés pour évaluer la qualité du code et de l'UI.
- **Audit Code** : Utiliser `/audit-codebase`.
- **Audit UI/UX** : Utiliser `/audit-design`.

## 🏗️ Phase 3 : Santé Technique & Sécurité
Vérifier l'état global des dépendances et de la compilation.
// turbo
```bash
npx eslint --fix
npm run build
npm outdated
```

## 🏗️ Phase 4 : Mise à jour du Changelog
Compiler les changements depuis la dernière version.
- Grouper par types : ✨ Feat, 🐛 Fix, 🛠 Refactor.
- Mettre à jour `CHANGELOG.md` avec la nouvelle version.

## 📦 Livrables
Les documents suivants doivent être créés dans `.docs/4-reports/` :
- **`development-metrics-YYYY-MM-DD.md`** : Statistiques d'activité.
- **`health-check-YYYY-MM-DD.md`** : Snapshot technique (Lint, Build, Deps).
- **`audits/tech-audit-report-v[version].md`** : Audit approfondi.

## ✅ Checklist de Validation
- [ ] Tous les fichiers incluent la date `YYYY-MM-DD`.
- [ ] La version correspond au `package.json`.
- [ ] Le dashboard est synchronisé via `npm run status`.
- [ ] Le `CHANGELOG.md` est à jour pour la version cible.

## 🔗 Next Step
> Utiliser **/pilotage** pour communiquer les nouveaux chiffres sur le dashboard.
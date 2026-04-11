---
description: Workflow - Gestion des versions (SemVer) et Changelog
---

# 🏷️ Workflow : Versioning & Changelog

> [!IMPORTANT]
> La gestion de version suit la norme **SemVer 2.0.0**. Chaque montée de version doit être accompagnée d'une mise à jour rigoureuse du `CHANGELOG.md` en Français.

## 🏗️ Phase 1 : Analyse de l'Impact (Bump)
Déterminer le type de changement selon les commits réalisés :
- **PATCH** (0.0.x) : Correctifs de bugs (Fix).
- **MINOR** (0.x.0) : Nouvelles fonctionnalités rétro-compatibles (Feat).
- **MAJOR** (x.0.0) : Changements cassants (Breaking changes).

## 🏗️ Phase 2 : Mise à jour du package.json
Exécuter la commande correspondante pour mettre à jour la version sans créer de tag Git automatique.
// turbo
```bash
# Remplacer [type] par patch, minor ou major
npm version [type] --no-git-tag-version
```

## 🏗️ Phase 3 : Rédaction du Changelog
Mettre à jour le fichier `CHANGELOG.md` avec la nouvelle version et la date.
- Créer une section `## [X.Y.Z] - YYYY-MM-DD`.
- Catégoriser les changements :
  - 🚀 **Ajouté** (Features)
  - 🔄 **Modifié** (Updates)
  - 🐛 **Corrigé** (Fixes)
  - 🗑️ **Supprimé** (Cleanup)

## 📦 Livrables
- `package.json` et `package-lock.json` à jour.
- `CHANGELOG.md` documentant la nouvelle release.

## ✅ Checklist de Validation
- [ ] La version dans `package.json` est correcte.
- [ ] Le `CHANGELOG.md` est rédigé en Français.
- [ ] `npm install` lancé pour synchroniser le lockfile.

## 🔗 Next Step
> Procéder à la release complète avec **/release**.
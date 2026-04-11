---
description: Workflow d'initialisation de la structure documentaire du projet (.docs)
---

# 🚀 Workflow : Initialisation Projet

> [!CAUTION]
> **ZÉRO GÉNÉRATION DE CODE**
> Ce workflow est strictement réservé à la mise en place de l'infrastructure documentaire. Ne jamais modifier les fichiers source de l'application (`app/`, `lib/`, etc.).

## 🏗️ Phase 1 : Création de l'Arborescence
Générer la structure physique pour accueillir la documentation standardisée.
// turbo
```bash
mkdir .docs
mkdir .docs/1-pilotage
mkdir .docs/2-architecture
mkdir .docs/3-fct
mkdir .docs/3-fct/features
mkdir .docs/4-reports
```

## 🏗️ Phase 2 : Initialisation des Fichiers Clés
Créer les premiers artefacts de pilotage et de vision.
- **`README.md`** : Description globale du projet.
- **`dashboard.md`** (dans `1-pilotage/`) : Premier jet du suivi.
- **`backlog.md`** (dans `1-pilotage/`) : Initialisation de la backlog avec les US et les Story Points (SP).

## 📦 Livrables
- Arborescence `.docs/` complète.
- Dossiers prêts à recevoir les spécifications et rapports.

## ✅ Checklist de Validation
- [ ] Dossier `.docs` présent à la racine.
- [ ] Sous-dossiers `1-pilotage`, `2-architecture`, `3-fct` et `4-reports` créés.
- [ ] Git ignore bien les fichiers temporaires de documentation si nécessaire.

## 🔗 Next Step
> Définir la vision produit avec le workflow **/product**.

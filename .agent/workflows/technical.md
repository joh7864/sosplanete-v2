---
description: Workflow — Technical Mapping Specification
---

# 🗺️ Workflow : Cartographie Technique

> [!IMPORTANT]
> L'objectif est la compréhension rapide et visuelle du système. Ce workflow extrait la structure réelle du projet pour générer des schémas de référence.

## 🏗️ Phase 1 : Analyse de l'Arborescence
- Mapper les couches applicatives (UI, Domain, Data, Infra).
- Identifier les points d'entrée et les flux critiques.

## 🏗️ Phase 2 : Cartographie Data & Architecture
Générer des diagrammes Mermaid pour :
- **L'Architecture Globale** : Découpage modulaire et features.
- **Le Modèle de Données** : Entités et relations réelles (basé sur le code).

## 🏗️ Phase 3 : Cartographie des Flux
- Schématiser les flux d'authentification, de persistance et de navigation.
- Identifier les points de couplage fort entre modules.

## 📦 Livrables
Le dossier **`.docs/2-architecture/technical_mapping/`** doit contenir :
- **`technical-mapping.md`** : Document de synthèse avec schémas Mermaid intégrés.
- **Schémas exports** : Versions visuelles des diagrammes s'il y a lieu.

## ✅ Checklist de Validation
- [ ] Lecture possible en moins de 30 secondes.
- [ ] Représentation fidèle de l'existant (pas d'optimisation).
- [ ] Style cohérent entre tous les diagrammes.

## 🔗 Next Step
> Servir de référence pour le workflow **/architecte**.
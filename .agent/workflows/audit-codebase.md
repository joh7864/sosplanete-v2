---
description: Workflow — Tech Lead Specification
---

# 🛡️ Workflow : Audit Codebase (Tech Lead)

> [!CAUTION]
> **LECTURE SEULE STRICTE**
> Ce workflow est un audit de conformité. Aucune modification de code ou suggestion d'implémentation n'est autorisée à ce stade.

## 🏗️ Phase 1 : Analyse du Contexte Technical
- Identifier la stack, les versions et les dépendances critiques.
- Mapper l'architecture globale (couches, patterns).
- Recenser les contraintes imposées par le projet.

## 🏗️ Phase 2 : Audit de Qualité & Robustesse
Évaluer le code selon les critères :
- **Clarté & SOLID** : Responsabilité unique, nommage, lisibilité.
- **Gestion d'Erreurs** : Robustesse face aux cas limites.
- **Code Mort** : Identification de la redondance ou de l'inutilisé.

## 🏗️ Phase 3 : Audit de Sécurité & Conformité
- Vérifier la validation des entrées (Zod).
- Analyser la gestion des données sensibles.
- Contrôler le respect strict des règles TypeScript et CSS/UI du projet.

## 🏗️ Phase 4 : Documentation In-Code
- Évaluer la pertinence des commentaires JSDoc.
- Vérifier que le code est auto-explicatif.

## 📦 Livrables
- **`.docs/4-reports/audits/tech-audit-report-v[version].md`** : Rapport d'audit détaillé incluant la synthèse exécutive et la liste des écarts.

## ✅ Checklist de Validation
- [ ] Analyse basée uniquement sur des faits observables.
- [ ] Aucun jugement personnel.
- [ ] Rapport stocké dans le bon dossier `.docs/`.
- [ ] Version analysée clairement identifiée.

## 🔗 Next Step
> Passer à l'audit visuel avec **/audit-design** ou à la correction avec **/debug**.
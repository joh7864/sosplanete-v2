---
description: Workflow — Design Review Specification
---

# 🎨 Workflow : Audit Design (UI/UX)

> [!CAUTION]
> **AUDIT DE CONFORMITÉ UNIQUEMENT**
> Ce workflow ne doit pas être utilisé pour du redesign créatif, mais pour vérifier la fidélité au Design System et aux standards UX Premium.

## 🏗️ Phase 1 : Référentiel Design
- Consulter le design system et les guidelines dans `.docs/`.
- Identifier les règles explicites (couleurs, typographies, espacements).

## 🏗️ Phase 2 : Conformité Visuelle & UI
- Vérifier la cohérence des composants.
- Contrôler les alignements, la hiérarchie visuelle et la lisibilité.
- S'assurer du respect des tokens de thématique.

## 🏗️ Phase 3 : Expérience Utilisateur (UX)
- Analyser la clarté des parcours critiques.
- Vérifier la présence de feedbacks (Loading, Success, Error).
- Tester la prévisibilité des interactions.

## 🏗️ Phase 4 : Accessibilité & Ergonomie
- Contrôler la taille des zones interactives (> 44px).
- Vérifier les contrastes et la navigation clavier.
- Valider l'approche Responsive / Mobile-First.

## 📦 Livrables
- **`.docs/4-reports/audits/design-review-report-v[version].md`** : Liste structurée des problèmes identifiés classés par sévérité.

## ✅ Checklist de Validation
- [ ] Chaque écart est localisé précisément.
- [ ] La sévérité (Mineur/Majeur/Bloquant) est indiquée.
- [ ] Aucun changement de code effectué.

## 🔗 Next Step
> Utiliser **/code** pour corriger les défauts identifiés.
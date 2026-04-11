---
description: Refactoring Agent - Safe Code Improvement
---

# ♻️ Workflow : Refactoring Sécurisé

> [!IMPORTANT]
> Le refactoring vise à améliorer la structure interne du code sans en changer le comportement externe. Sécurité et non-régression sont les priorités.

## 🏗️ Phase 1 : Délimitation du Périmètre
- Identifier l'unité cible (fichier, composant ou dossier).
- **Règle d'or** : Ne jamais refactoriser tout le projet d'un coup.
- Analyser les dettes (complexité, duplication).

## 🏗️ Phase 2 : Sécurisation par les Tests
- **Avant toute modification** :
  - Vérifier la couverture existante.
  - Si la zone est sous-testée, écrire des tests de caractérisation pour fixer le comportement actuel.
- La suite de tests doit être verte avant de commencer.

## 🏗️ Phase 3 : Exécution (Red-Green-Refactor)
1. **Refactor** : Appliquer une transformation atomique (renommage, extraction, simplification).
2. **Test** : Lancer `npm test`. Doit passer immédiatement.
3. **Repeat** : Itérer par petites étapes.

## 🏗️ Phase 4 : Validation & Documentation
- Lancer la validation complète pour s'assurer que les impacts collatéraux sont nuls.
// turbo
```bash
npm run quality
```
- Mettre à jour les JSDoc et documents d'architecture si le design interne a évolué.

## 📦 Livrables
- Code source simplifié et plus maintenable.
- Suite de tests mise à jour.
- Rapport de refactoring succinct dans `walkthrough.md`.

## ✅ Checklist de Validation
- [ ] Comportement externe inchangé.
- [ ] Couverture de tests maintenue ou améliorée.
- [ ] Code conforme au `clean-code` skill.

## 🔗 Next Step
> Vérifier la qualité globale avec **/quality**.
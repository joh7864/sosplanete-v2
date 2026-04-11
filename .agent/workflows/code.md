---
description: Workflow - Génération de code "Zero Defaut" (Clean Code, TDD, Validation Stricte).
---

# 💻 Workflow : Développement Logiciel

> [!IMPORTANT]
> Ce workflow garantit que tout code produit respecte les standards de qualité élevés du projet : **Zero Build Error**, **Zero Lint Warning**, et **100% Tests Passants**.

## 🏗️ Phase 1 : Imprégnation & Pilotage
1. **Auto-Détection** : Vérifier la présence de `.docs/blyx_cockpit/`.
   - **Mode Blyx** : Charger le skill `blyx-governance`. La VA acquise par palier sera reportée.
   - **Mode Standard** : Charger le skill `velocity-tracking` pour le suivi des SP.
2. **Sources Tech** : 
   - **Clean Code** : `.agent/skills/clean-code/SKILL.md`.
   - **UX/UI** : `.agent/skills/ux-ui/SKILL.md`.

## 🏗️ Phase 2 : Planification (Think first)
1. **Découpage** : Identifier les composants, hooks et utilitaires.
2. **Stratégie de Test** : Définir comment valider fonctionnellement la tâche.
3. **Réutilisation** : Vérifier si des utilitaires existants (`lucide-react`, `date-fns`) peuvent être utilisés.

## 🏗️ Phase 3 : Implémentation Rigoureuse
Générer le code en suivant les règles strictes :
- ❌ **PAS de `any`** : Utiliser `unknown` ou des types précis.
- ❌ **PAS de `@ts-ignore`** : Sauf justification majeure en commentaire français.
- ❌ **PAS de `console.log`** : Utiliser le `logger` du projet.
- ✅ **Test-First** : Prévoir les tests unitaires (`.test.tsx`) parallèlement au code.

## 🏗️ Phase 4 : Validation "Zero Defaut"
Ne JAMAIS clore une tâche sans passer les tests de qualité.
// turbo
```bash
npm run quality
```
Si un check échoue (Lint, Types, Build, Tests), corriger immédiatement.

## 📦 Livrables
- Code source propre et typé.
- Tests unitaires et d'intégration.
- **`walkthrough.md`** : Preuve visuelle et logs de validation dans `.docs/4-reports/walkthroughs/`.

## ✅ Checklist de Validation
- [ ] Le code compile sans erreur (`npm run build`).
- [ ] Aucun warning ESLint ou erreur TypeScript.
- [ ] Tous les tests passent (`npm test`).
- [ ] Mode (Blyx/Standard) détecté et synchronisé.

## 🔗 Next Step
1. **Synchronisation** : 
   - SI Mode Blyx : Exécuter `/blyx_sync` pour mettre à jour le cockpit.
   - SINON : Exécuter `/velocity` pour documenter la vélocité.
2. **Qualité** : Valider avec `/quality`.
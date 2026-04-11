---
description: Workflow - Génération de code "Zero Defaut" (Clean Code, Validation Minimale).
---

# ⚡ Workflow : Développement Rapide (Light)

> [!IMPORTANT]
> Ce workflow est une version allégée du workflow `/code`, optimisée pour les correctifs mineurs ou les tâches simples, tout en maintenant les standards build/lint.

## 🏗️ Phase 1 : Cadrage Rapide
- Comprendre l'impact local du changement.
- Respecter les principes SOLID/DRY.
- S'aligner sur l'architecture App Router.

## 🏗️ Phase 2 : Implémentation Propre
- ✅ Types explicites obligatoires (pas de `any`).
- ✅ Commentaires explicatifs en Français (Pourquoi, pas Comment).
- ✅ Utilisation des hooks et utils existants.

## 🏗️ Phase 3 : Validation de Sécurité
// turbo
```bash
npm run quality-light
```
Vérifie que le build et le lint sont au vert. Les tests unitaires sont recommandés mais pas bloquants dans ce mode.

## 📦 Livrables
- Code source intégré et validé.
- Mise à jour mineure de la documentation si nécessaire.

## ✅ Checklist de Validation
- [ ] Le code compile parfaitement.
- [ ] Le lint est propre (Zero warning).
- [ ] Pas de régression visuelle flagrante.

## 🔗 Next Step
> Passer au workflow **/quality-light** pour une vérification finale.

---
name: code-review
description: Checklist de validation impitoyable pour garantir la qualité "Zero Defaut".
---

# Code Review Checklist - "Zero Defaut"

## 🛡️ 1. Qualité & Robustesse (Obligatoire)
- [ ] **Build** : `npm run build` passe localement ?
- [ ] **Lint** : `npm run lint` retourne 0 erreur, 0 warning ?
- [ ] **Tests** : `npm test` passe à 100% ? Nouveaux tests ajoutés pour le nouveau code ?
- [ ] **Types** : Aucun usage de `any` ? Aucun `ts-ignore` non justifié ?

## 🔒 2. Sécurité
- [ ] **Input Validation** : Toutes les données entrantes (params URL, forms, API) sont validées par Zod ?
- [ ] **Server Actions** : Pas de mutation directe en client ? Auth check présent ?
- [ ] **Secrets** : Aucune clé API ou token en dur dans le code ?

## 🚀 3. Performance
- [ ] **Server Components** : Le code est exécuté côté serveur par défaut ?
- [ ] **Images** : Utilisation de `<Image />` avec dimensions explicites ?
- [ ] **Bundle Size** : Pas d'import de librairie lourde inutile ? (ex: lodash complet)
- [ ] **React** : `useMemo` / `useCallback` utilisés aux bons endroits (pas prématurément) ?

## 💎 4. UX/UI & Design
- [ ] **Mobile First** : Les zones de clic sont > 44px ?
- [ ] **Responsive** : Testé sur mobile, tablette et desktop ?
- [ ] **Glassmorphism** : Respect des classes utilitaires (`backdrop-blur-xl`, `bg-white/10`) ?
- [ ] **Feedback** : État de chargement (Skeleton) et d'erreur géré élégamment ?

## 🧹 5. Clean Code
- [ ] **Nommage** : Variables en anglais, camelCase ? Composants en PascalCase ?
- [ ] **Commentaires** : En FR, expliquent le POURQUOI, pas le COMMENT ?
- [ ] **Structure** : Pas de fonction > 50 lignes ? Pas de fichier > 200 lignes ?
- [ ] **DRY** : Pas de duplication de logique métier ?
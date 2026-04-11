---
description: Rédaction de spécifications fonctionnelles détaillées (Product Owner).
---

# ✍️ Workflow : Spécifications Fonctionnelles (Premium Blyx)

> [!IMPORTANT]
> Ce workflow produit une documentation "Zero Defaut" exploitable par l'ingénierie.
> Rôle : **Product Owner** | Scope : **1 fonctionnalité / US**
> Respecter scrupuleusement l'arborescence `.docs/3-fct/features/`.

## 🏗️ Phase 1 : Imprégnation & Mode (Blyx Standard)
1. **Auto-Détection** : Vérifier la présence du dossier `.docs/blyx_cockpit/`.
   - **Mode Blyx** : Charger le skill `blyx-governance`. Utiliser les IDs séquentiels et Fibonacci (S/M/C, F/I/D).
   - **Mode Standard** : Charger le skill `velocity-tracking`. Utiliser les Story Points classiques (1, 3, 8).
2. **Identification IDs** : 
   - SI Mode Blyx : Repérer le **dernier numéro d'US** utilisé dans l'Epic (ex: `US-H2.3`) pour déduire le prochain (ex: `US-H2.4`).
   - SINON : Utiliser des IDs simples ou basés sur le `functional_architecture.md`.

## 🏗️ Phase 2 : Clarification & Valeur
- Reformuler le besoin en termes de valeur utilisateur.
- Décomposer en sous-capacités fonctionnelles.
- Identifier les cas nominaux et les cas limites (**Edge Cases**).

## 🏗️ Phase 3 : Définition & Estimation (Fibonacci)
Rédiger la spec en incluant :
1. **Description Fonctionnelle** : Règles de gestion, parcours utilisateur.
2. **Critères d'Acceptation** : Conditions claires pour valider l'US.
3. **Estimation Premium (SP)** :
   - Mode Blyx : Suivre `.agent/skills/blyx-governance/SKILL.md`.
   - Mode Standard : Suivre `.agent/skills/velocity-tracking/SKILL.md`.

## 🏗️ Phase 4 : Signature Premium (UX/UI)
- **Effet "Wahoo"** : Animations attendues (skill `motion-design`).
- **Accessibilité** : Standard WCAG (skill `accessibility`).
- **Offline-First** : Comportement PWA (skill `pwa-static`).

## 📦 Livrables
- **`.docs/3-fct/features/v2/feature-[name].md`** : Spécification complète avec IDs Blyx.
- **Mise à jour `functional_architecture.md`** : Inscription des nouvelles US.

- [ ] Mode (Blyx/Standard) détecté.
- [ ] IDs conformes à l'historique (si Blyx) ou à la structure standard.
- [ ] Estimation SP renseignée.
- [ ] Synchronisation `/blyx_sync` effectuée (si Blyx actif).

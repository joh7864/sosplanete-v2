# 🤖 Guide des Workflows Antigravity (Unified v2.15+)

Ce répertoire est le **moteur de gouvernance** du projet. Il fusionne la rigueur analytique d'Antigravity avec le pilotage opérationnel de Blyx.

> [!IMPORTANT]
> **Cohérence Antigravity ↔️ Blyx**
> 1. **Pilotage** : Le dossier `blyx_agent/` est le maître du cockpit (Journal, Backlog).
> 2. **Spécification** : `/spec` utilise désormais la matrice Fibonacci pour une précision maximale du CELER dans Blyx.
> 3. **Qualité** : `/quality` est le juge de paix avant toute mise à jour du cockpit.

---

## 🚀 Utilisation Rapide

| Commande | Usage Principal | Lien Blyx |
| :--- | :--- | :--- |
| `/product` | **Idéation** | Création de la vision produit. |
| `/spec` | **Spécification** | Génère les IDs d'US séquentiels pour Blyx. |
| `/architecte` | **Design Tech** | Plan d'implémentation. |
| `/code` | **Développement** | TDD & Zero Defaut. |
| `/blyx_sync` | **Synchronisation** | Mise à jour du cockpit (Journal, VA, Celer). |
| `/velocity` | **Analyse** | Rapport analytique post-mortem. |

---

## 🛡️ Gouvernance & Standards

- **Zéro Défaut** : Aucun code n'est validé sans un `npm run quality` réussi (support `// turbo`).
- **Idempotence** : Chaque prompt est haché pour éviter les doublons dans le journal Blyx.
- **Fibonacci** : Utilisation stricte de 1, 2, 3, 5, 8 pour la complexité des tâches.

---

## 🏛️ Arborescence `.agent`

- `workflows/` : Commandes slash (incluant `blyx_agent/`).
- `skills/` : Bibliothèques de connaissances (UX, Code, PWA).
- `instructions/` : Règles de sécurité et styles transverses.

---
*Cette structure est optimisée pour minimiser la consommation de jetons tout en garantissant un niveau de qualité premium.*

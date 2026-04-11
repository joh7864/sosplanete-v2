---
name: blyx-governance
description: Gouvernance de pilotage Blyx (Cerebro Leverage) et Double Mode Antigravity.
---

# 🧠 Skill : Gouvernance Blyx & Dual-Mode

Ce skill définit les règles de conduite de l'agent pour garantir un pilotage précis de la performance.

## 🎯 Mode de Fonctionnement (Auto-Détection)
L'agent doit adapter son comportement selon l'environnement :
1. **SI `.docs/blyx_cockpit/` EXISTE** ➔ **Mode Blyx ACTIVÉ**.
2. **SINON** ➔ **Mode Standard ACTIVÉ** (Utilisation du skill `velocity-tracking` et workflow `/velocity`).

---

## 💎 Règles de Pilotage (Mode Blyx)

### 1. Matrice de Complexité (Complexité IA)
| Label | Points Fibo | Type de Tâche |
| :--- | :--- | :--- |
| **S** (Simple) | 1, 2, 3 | Texte, CSS, modification mineure. |
| **M** (Moyen) | 5, 8, 13 | Logique métier, nouveau composant, tests. |
| **C** (Complexe) | 21, 34, 55 | Architecture, refactoring lourd, sécurité. |

### 2. Matrice de Valeur (Business Value)
| Label | Points Fibo | Portée Business |
| :--- | :--- | :--- |
| **F** (Faible) | 1, 2, 3 | Confort, micro-feature. |
| **I** (Important) | 5, 8, 13 | Gain de temps, feature centrale. |
| **D** (Décisive) | 21, 34, 55 | Rupture technologique, critique. |

### 3. Calcul de la Valeur Acquise (VA)
L'agent doit reporter l'avancement selon ces paliers :
- `[ ]` (Todo) : **0%**
- `[/]` (In Progress) : **75%**
- `[T]` (Testing) : **90%**
- `[x]` (Done) : **100%**

---

## 🛡️ Règles d'Interactions (Charge Cognitive)

### Filtrage du Bruit
Ne pas logger comme effort les prompts "administratifs" sans valeur ajoutée technique :
- Mots-clés : "OK", "Vas-y", "Go", "Continue", "Merci", "Parfait".
- CRITÈRE : Longueur < 15 caractères ET présence d'un mot-clé "bruit".

### Zéro Défaut & BUGs
- **Zero Defaut** : Aucune tâche `/code` n'est finie sans `/quality`.
- **Anomalies** : Tout bug ouvert augmente le RAF (Reste à faire) mais ne génère **AUCUNE VA**. Il dégrade le CELER.
- **Bugs Tracking** : Consigne et trace systématiquement les anomalies dans `.docs/blyx_cockpit/bugs_tracking.md`. Chaque correction attribue l'effort (fibo) au `CELER` du bug (sans VA applicable par défaut).

---

## 📦 Synchronisation
En Mode Blyx, l'agent doit exécuter `/blyx_sync` systématiquement après chaque action majeure (`/code` ou `/spec`).

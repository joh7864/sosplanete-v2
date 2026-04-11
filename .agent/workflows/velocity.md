---
description: WORKFLOW - Analyse de la vélocité et production du Burndown Chart
---

# 🚀 Workflow : Analyse de Vélocité & Burndown (Blyx Enhanced)

> [!IMPORTANT]
> Ce workflow définit les standards de complexité et permet de mesurer la vélocité réelle par rapport aux estimations stockées dans Blyx.

## 📊 Matrice de Complexité (Story Points - SP)
L'évaluation se base sur la charge cognitive pour l'agent. **C'est cette valeur qui doit être saisie dans la colonne "Complexité" du Backlog Blyx.**

| Complexité | Points | Critères pour l'Agent |
| :--- | :--- | :--- |
| **Simple** | **1 SP** | Modification d'un seul fichier, style CSS, texte. |
| **Moyen** | **3 SP** | Nouveau composant métier, logique de validation, multi-fichiers. |
| **Complexe** | **8 SP** | Feature de A à Z, refactoring d'architecture. |

## ⏱️ Source de Données (Blyx Ecosystem)
Pour générer les rapports, l'IA se base sur les fichiers suivants :
1. **Effort Réel** : `.docs/blyx_cockpit/journal_prompts.json` (Historique des sessions).
2. **Valeur Produite** : `.docs/blyx_cockpit/backlog_roadmap.md` (Statut des US).

## 📊 Processus d'Analyse Post-Sync
Après chaque exécution de `/blyx_sync`, si une étape majeure est franchie :

### 1. Calcul de Vélocité
`Vélocité = (Total SP terminés) / (Temps total passé extrait du journal)`.
*Cible : ~ 3 à 5 SP / heure.*

### 2. Burndown Chart
Générer un graphique Mermaid montrant le reste à faire (Burn-down) basé sur le backlog.

## 📦 Livrables
- **`.docs/4-reports/velocity-vX.X.X.md`** : Rapport analytique complétant le cockpit Blyx.

## ✅ Checklist
- [ ] Données extraites de `journal_prompts.json` (Blyx).
- [ ] Complexité vérifiée par rapport aux Story Points saisies.
- [ ] Graphique Mermaid inclus dans le rapport.

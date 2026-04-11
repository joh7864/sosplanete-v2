---
description: Workflow - Reconstitution et analyse de l'historique du projet par prompt
---

# 🕰️ Workflow : Historique & Analyse du Temps (History)

> [!IMPORTANT]
> Ce workflow permet de reconstituer l'histoire du projet prompt par prompt afin de comptabiliser de manière précise toutes les tâches exécutées, d'évaluer le temps passé, et de raccrocher ces métriques aux US et EPICs.

## 🏗️ Phase 1 : Collecte et Horodatage des Conversations
- Ramener dans le projet toutes les conversations (prompts de l'agent/utilisateur) qui lui sont relatives.
- Extraire et structurer les données depuis les logs ou l'historique de l'agent.
- Horodater précisément chaque conversation et chaque prompt (date, heure de début, heure de fin).

## 🏗️ Phase 2 : Analyse et Évaluation du Temps (Exhaustivité & Complexité)
- Évaluer précisément le temps passé sur chaque prompt et chaque session de développement.
- **Détailler de manière exhaustive toutes les tâches individuelles exécutées** au cours des sessions.
- Calculer le temps total par fonctionnalité, par composant ou par bug corrigé.
- **Évaluer la complexité** de chaque US/tâche en Story Points (SP) selon une échelle de Fibonacci (1, 2, 3, 5, 8).
- **Raccrocher EXPLICITEMENT chaque tâche aux User Stories (US) et EPICs existants** (`.docs/3-fct/`), en indiquant systématiquement les points de complexité.

## 🏗️ Phase 3 : Stockage et Consolidation
- Créer le dossier `.docs/history/` s'il n'existe pas.
- Générer un rapport détaillé par ordre chronologique (`project-history.md`) incluant un **tableau exhaustif des tâches avec l'US associée, le temps précis et la complexité (SP)**.
- Mettre à jour l'analyse globale et détaillée par US (`time-analysis.md`) avec calcul du ratio temps/complexité (Vélocité en SP/heure).
- Mettre à jour les métriques de vélocité réelle dans le dashboard récapitulatif du projet (Story Points vs Temps Réel).

## 📦 Livrables
- **`.docs/history/`** : Dossier contenant les archives des conversations et les rapports de temps.
- **`.docs/history/project-history.md`** : Historique exhaustif des sessions et liste détaillée de *toutes* les sous-tâches reliées aux US.
- **`.docs/history/time-analysis.md`** : Analyse du temps passé, avec ventilation globale (Epic) et granulaire par US.

## ✅ Checklist de Validation
- [ ] Toutes les conversations pertinentes ont été récupérées et horodatées.
- [ ] Le temps passé a été calculé avec précision pour chaque tâche.
- [ ] L'exhaustivité des tâches est respectée (aucune action technique majeure omise).
- [ ] **Une valeur de complexité en Story Points (SP) est attribuée à chaque US.**
- [ ] Chaque tâche est explicitement et correctement associée à une US ou un EPIC existant.
- [ ] Les livrables sont générés et stockés dans le dossier `.docs/history/`.

## 🔗 Next Step
> Mettre à jour le `dashboard.md` global avec les nouvelles métriques de vélocité réelle issues de cette analyse.

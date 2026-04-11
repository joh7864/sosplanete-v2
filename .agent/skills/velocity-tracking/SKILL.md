---
name: velocity-tracking
description: Gouvernance de la vélocité Agent, distinction Temps Actif/Calendaire et régularité des prédictions.
---

# ⏱️ Velocity & Time Tracking Standards (Agent-Mode)

Ce skill définit les règles strictes pour l'évaluation, le suivi et la prédiction du temps de développement dans un contexte d'assistance IA (Agent Antigravity).

## 🧮 Principes Fondamentaux

### 1. Distinction Temps Actif vs Temps Calendaire
- **Temps Calendaire (Clock Time) :** La durée totale écoulée entre le début et la fin d'une session (inclut les pauses, le sommeil, les temps d'attente).
- **Temps Actif (Active Time) :** Temps de réalisation technique effectif (réflexion de l'agent, génération de code, validation utilisateur).
- **RÈGLE :** Seul le **Temps Actif** est utilisé pour calculer la vélocité réelle afin de garantir des prédictions fiables.

### 2. Vélocité Établie
- Pour ce projet, la vélocité de croisière est fixée à **7.0 Story Points (SP) par heure active**.
- Cette valeur doit être utilisée comme constante pour toute nouvelle estimation afin d'assurer la **régularité des prédictions**.

### 3. Matrice de Complexité (Fibonacci)
Toute tâche (User Story) doit être estimée avant réalisation selon l'échelle :
- **1 SP** : Trivial (Texte, CSS simple).
- **2 SP** : Faible (Composant UI, petite logique).
- **3 SP** : Moyenne (Feature standard, API simple).
- **5 SP** : Élevée (Logique métier complexe, mutations multiples).
- **8 SP** : Critique (Refonte archi, Risque technique élevé).

### 4. Pondération des Tâches de Support
- **Analyse/Réponse technique simple** : 0.25 SP (~2-3 min).
- **Documentation/Rapport mineur** : 0.5 SP (~4-5 min).

## 🛠️ Maintenance des Artefacts de Pilotage

Après chaque session ou demande majeure, l'agent doit synchroniser les fichiers suivants :

1. **[.docs/1-pilotage/backlog.md](file:///.docs/1-pilotage/backlog.md)** : État des US et SP totaux.
2. **[.docs/1-pilotage/dashboard.md](file:///.docs/1-pilotage/dashboard.md)** : Résumé de la vélocité et du temps actif cumulé.
3. **[.docs/1-pilotage/time-estimation.md](file:///.docs/1-pilotage/time-estimation.md)** : Planning prévisionnel basé sur la vélocité de 7 SP/h.
4. **[.docs/history/time-analysis.md](file:///.docs/history/time-analysis.md)** : Analyse de performance de la session.

## 📈 Méthode de Prédiction
Pour toute nouvelle demande :
1. Évaluer la complexité en SP.
2. Diviser par la vélocité établie (7.0).
3. Annoncer le temps de réalisation estimé en minutes.
   - *Exemple : Une tâche de 3 SP = (3/7)*60 ≈ 25 minutes.*

## 🤝 Engagement de Régularité
L'objectif n'est pas d'être "en avance", mais d'être **prévisible**. L'agent s'interdit de modifier arbitrairement sa vélocité cible sans une analyse documentée d'un changement de productivité (ex: stabilisation d'un nouveau workflow).

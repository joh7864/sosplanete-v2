---
name: project-reporting
description: Centralisation et automatisation de tous les rapports de suivi (Métriques, Santé, Audits, Status).
---

# Project Reporting & Tracking Standards

Ce skill définit la gouvernance et les outils pour assurer la visibilité sur l'avancement, la qualité et la santé du projet **Teelov**.

## 📊 Types de Rapports

### 1. Métriques de Développement (`development-metrics`)
- **Fréquence :** Hebdomadaire ou fin de sprint.
- **Contenu :** Volume de code, activité Git, nombre de composants, état de la documentation.
- **Génération :** `npm run metrics`.
- **Destination :** `.docs/4-reports/development-metrics-YYYY-MM-DD.md`.

### 2. Santé Technique (`health-check`)
- **Fréquence :** Quotidienne ou avant chaque commit significatif.
- **Contenu :** Statut Lint (0 défaut), Type Check (Succès), Build (Succès).
- **Génération :** Processus manuel ou automatisé par workflow.
- **Destination :** `.docs/4-reports/health-check-YYYY-MM-DD.md`.

### 3. Audits Spécialisés (Tech & Design)
- **Fréquence :** À chaque version majeure/mineure (X.Y.0).
- **Technique :** Utilisation de `/audit-codebase`.
- **Design :** Utilisation de `/audit-design`.
- **Destination :** `.docs/4-reports/audits/`.

### 4. Dashboard de Statut (`PROJECT_STATUS`)
- **Fréquence :** En temps réel (après chaque audit).
- **Contenu :** Matrice de fonctionnalités (V2/V3), synthèse santé, liens vers derniers rapports.
- **Génération :** `npm run status`.
- **Destination :** `.docs/1-pilotage/dashboard.md`.

## 🛠 Automatisation & Workflows

Toutes les générations de rapports doivent être déclenchées par le workflow unifié :
1. **Commande :** `/audit-global`
2. **Effet :** Lance les métriques, vérifie la santé, met à jour le changelog et actualise le dashboard PROJECT_STATUS.

## 📝 Journal des Modifications (Changelog)
- Suivre STRICTEMENT le format [Keep a Changelog](https://keepachangelog.com/fr/1.0.0/).
- Grouper par : `✨ Features`, `🐛 Corrections`, `🛡️ Fiabilité/Dette`, `🛠 Maintenance`.

## 🤝 Gouvernance Antigravity
En tant qu'agent, tu dois TOUJOURS :
1. Maintenir le dashboard `PROJECT_STATUS.md` à jour après chaque modification importante.
2. Signaler immédiatement tout passage au rouge du `health-check`.
3. Vérifier que chaque nouvelle feature a son artefact de documentation dans `.docs/features/`.

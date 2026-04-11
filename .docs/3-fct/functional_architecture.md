# 🗺️ Architecture Fonctionnelle - sos-planete (v2 Avancée)

Ce document cartographie les capacités avancées du nouveau backend.

## 🌳 Structure des Capacités

### 1. Gouvernance Système [SYS_ADMIN]
- **US-01.1** : Gestion des Rôles (AS vs AM).
- **US-01.2** : Gestion des Instances (Espaces Écoles).
- **US-05.1** : Référentiel Global des Actions (Impact Weights).
- **US-05.2** : Données de calcul annuelles (Common Data).

### 2. Gestion des Espaces [BIZ_ADMIN]
- **US-02.1** : Organisation Locale (CRUD Teams, Groups, Players).
- **US-03.1** : Mapping Catalogue (Lien action locale vers référentiel global).
- **US-07.1** : Gestion des Périodes (Auto-opening/closing, Override).

### 3. Gamification & Engagement [PLAY]
- **US-04.1** : Enregistrement des actions (ActionDone par période).
- **US-06.1** : Moteur de déblocage des Animaux (Progression Curve).

## 📊 Matrice de Traçabilité US (v2)

| ID | Titre | Etat | Complexité | Valeur |
| :--- | :--- | :--- | :--- | :--- |
| US-01 | Roles & Instances | [ ] | 8 | 34 |
| US-02 | Organisation Espace | [ ] | 13 | 21 |
| US-03 | Management Catalogue | [ ] | 8 | 13 |
| US-04 | Stockage Actions | [ ] | 5 | 21 |
| US-05 | Référentiel Global | [ ] | 13 | 55 |
| US-06 | Moteur Animaux | [ ] | 21 | 89 |
| US-07 | Gestion Temporelle | [ ] | 8 | 21 |

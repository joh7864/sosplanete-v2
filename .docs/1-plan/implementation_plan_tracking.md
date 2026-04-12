# Plan de Mise en Œuvre : Suivi Hebdomadaire (Suivi jeux) - v2

Le but est de créer une page de suivi des actions qui calculera en temps réel les performances des enfants sur un nombre de périodes défini, le tout intégré de manière homogène à l'interface SOS Planète.

## Design & UI Premium
**Thème : Light Glass Premium**
Pour respecter l'homogénéité de l'application tout en conservant l'aspect "Wahou" de la maquette initiale, nous allons utiliser un design "Apple-style" épuré :
- **Cartes** : Utilisation du `.glass-card` (blanc ultra-pur avec 85% d'opacité, flou de 20px).
- **Consistance** : Nous conserverons exactement la même disposition et le même niveau de détail que dans la maquette (badges, micro-graphiques, icônes) mais sur le fond crème (`#F8FAF5`) de l'application.
- **Accents** : Les indicateurs de performance utiliseront les verts SOS Planète (émeraude/sauve) pour un rendu vibrant et naturel.

![Concept Initial (Structure à préserver)](/C:/Users/User/.gemini/antigravity/brain/fb15174b-d129-4d38-a8be-33b74af8d5d1/tracking_dashboard_mockup_1776011028169.png)

## Configuration & Base de Données

### 1. Paramétrage de l'Espace (Instance)
Les paramètres "Suivi" seront globaux à l'espace et configurés par le gestionnaire.
- **Nouveaux champs dans le modèle `Instance`** :
  - `gameStartDate` : Date officielle du début du jeu.
  - `gamePeriodsCount` : Nombre de périodes (semaines) à suivre (ex: 24).

### 2. Stockage des Données
- Intégration des données `exporttestng` directement dans la table `ActionDone` pour une lecture consolidée.

## Navigation & Frontend

### 1. Menu latéral
- Nouvelle entrée : **"Suivi jeux"**.

### 2. Page de Suivi `/dashboard/tracking`
- **KPI Bar** : Cartes premium identiques au concept interactif.
- **Matrice de Performance (Le Tableau)** : 
  - **En-têtes de colonnes** : Au lieu de "S1", chaque colonne affichera les **dates de début et de fin de période** (ex: `03/02 - 09/02`).
  - **Interactivité** : Défilement horizontal fluide pour parcourir les N périodes.
  - **Totaux** : Ligne de totalisation en bas comme sur la fiche organisation.
- **Visualisation** : Graphique d'évolution hebdomadaire (Recharts) intégré en bas de page.

## Travaux Préliminaires
- [ ] Modifier le schéma Prisma (`gameStartDate`, `gamePeriodsCount`).
- [ ] Mettre à jour l'interface de configuration de l'espace.
- [ ] Créer le service d'agrégation temporel (calcul des dates de périodes).

---
> [!TIP]
> **Le secret du "Premium"** : Même en mode clair, nous utiliserons des ombres très douces (`box-shadow`) et des dégradés subtils pour que les cartes "décollent" visuellement de la page, gardant ainsi l'effet de profondeur que vous avez aimé sur le concept dark.

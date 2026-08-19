# 👆 Visite Guidée Interactive In-App (FTUX Onboarding)

> **Concept** : Un tutoriel interactif intégré directement dans l'application avec **un curseur / main animée (👆)** qui guide l'agent pas-à-pas, met en lumière les éléments clés (effet *Spotlight*) et affiche des **infobulles explicatives holographiques** avec boutons `[ Suivant ➔ ]` et `[ Passer ]`.

---

## 📌 Résumé des 7 Étapes du Guide Interactif

* **Étape 1** : 🚀 **Identité & Mission** *(Vignette agent, équipe, bio-stabilité)*
* **Étape 2** : 🌍 **Passerelle 2026** *(Terre 3D & orbes de secteurs en orbite)*
* **Étape 3** : ⚡ **Le Codex & Impulsion** *(Missions réelles, bouton "Impulser +AT")*
* **Étape 4** : 🌕 **Base Lunaire & Défis** *(Lune 3D ⚔️, chrono 24h/48h & gages)*
* **Étape 5** : 📊 **Accomplissement (%) & Saut Temporel 2070** *(Barre de progression, commutateur [2026 ➔ 2070] & Radar planétaire)*
* **Étape 6** : 🏆 **Podium 3D & Profils** *(Podium des scores & dossiers agents)*
* **Étape 7** : 📡 **Com-Link & WhatsApp** *(Chat d'équipage & alertes sur mobile)*

---

## ⚙️ Intégrations & Nouveaux Éléments UI

### 1. Bouton d'Aide `?` (Relancer le Guide)
* **Emplacement** : Icône **`?`** positionnée dans le HUD supérieur, **juste à gauche du bouton Déconnexion / Quitter** (`LogOut`).
* **Fonctionnement** : Un clic sur ce bouton réinitialise le guide et relance la visite guidée depuis l'Étape 1.

---

### 2. Barre de « % d'Accomplissement des Missions » & Commutateur [ 2026 ➔ 2070 ]
* **Commutateur d'époque préservé** : Le bouton de bascule `[ 2026 ➔ 2070 ]` reste actif en permanence pour voyager librement entre le présent et le futur.
* **Barre d'accomplissement** : Jauge néon affichée en haut d'écran à côté de la temporalité.

#### 🧮 Algorithmes de calcul proposés :

* **Formule A : Taux d'Accomplissement de l'Équipage (Pédagogique)**
  $$\text{Accomplissement (\%)} = \min\left(100\%, \frac{\text{Nombre d'actions impulsées par l'équipage}}{\text{Nombre de joueurs} \times \text{Quota cible par période}} \times 100\right)$$
  *Exemple* : 50 joueurs × 3 missions = 150 missions cibles. Si 102 missions sont impulsées ➔ **68% d'accomplissement**.

* **Formule B : Ratio d'Assiduité & Extrapolation Temporelle (Modèle Impact)**
  S'appuie sur le moteur d'impact existant (`impact.service.ts`) qui combine :
  - La durée effective du jeu par rapport au calendrier annuel (`annualRatio = 1 + (52 / gameDuration - 1) * weight`)
  - Le ratio d'assiduité (`assiduiteRatio = actionsDone / totalPossible`)
  - La pondération multi-impacts : 60% CO₂, 20% Eau, 20% Déchets.
  $$\text{Accomplissement (\%)} = \text{safeEffortRatio} \times 100\%$$

---

## 🎯 Architecture du Système de Visite Guidée

1. **Déclenchement automatique & Replay** :
   - Se lance automatiquement lors de la **1ère connexion** de l'agent (`hasSeenOnboarding` mémorisé).
   - Relançable via l'icône **`?`** à gauche du bouton Quitter.
2. **Mécanique Visuelle** :
   - **Voile sombre (Spotlight Backdrop)** : Assombrit le reste de l'écran et met en surbrillance l'élément ciblé.
   - **Main / Pointeur animé (👆)** : Se déplace avec une animation fluide vers chaque zone d'intérêt.
   - **Infobulle Cybernétique (Tooltip Card)** : Affiche le titre, le texte explicatif concis, l'étape `[X / 7]` et les actions `[ Précédent ]` / `[ Suivant ➔ ]`.

---

## 🧭 Déroulé Détaillé des 7 Étapes

---

### 🌟 Étape 1 / 7 : La Mission de l'Arche & Identité de l'Agent
* **Cible Spotlight** : Encart supérieur gauche (Avatar de l'agent, nom, équipe élémentaire Eau/Feu/Air/Terre).
* **Position de la main 👆** : Pointe sur la vignette et la jauge de bio-stabilité.
* **Infobulle** :
  - **Titre** : 🚀 *Bienvenue à bord, Agent !*
  - **Explication** : *"Vous appartenez à l'équipe [Nom de l'équipe]. Chaque éco-geste accompli dans votre quotidien alimente le générateur de l'Arche pour restaurer l'avenir planétaire."*
  - **Bouton** : `[ Découvrir la Passerelle ➔ ]`

---

### 🌍 Étape 2 / 7 : La Passerelle 2026 & Les Secteurs Écologiques
* **Cible Spotlight** : La Terre 3D et les orbes de secteurs écologiques en orbite (*Eau, Énergie, Biodiversité...*).
* **Position de la main 👆** : Se déplace en survolant les sphères orbitales autour de la Terre.
* **Infobulle** :
  - **Titre** : 🌍 *Les Secteurs Écologiques*
  - **Explication** : *"Chaque sphère en orbite représente une thématique d'éco-gestes. Cliquez sur un orbe pour ouvrir les missions correspondantes."*
  - **Bouton** : `[ Suivant ➔ ]`

---

### 📋 Étape 3 / 7 : Le Codex & L'Impulsion des Éco-Missions
* **Cible Spotlight** : Le panneau latéral gauche **Codex** (avec zoom sur le bouton *« Impulser (+AT) »*).
* **Position de la main 👆** : Pointe vers le bouton d'impulsion d'une mission.
* **Infobulle** :
  - **Titre** : ⚡ *Impulser une Mission (+AT)*
  - **Explication** : *"Quand vous réalisez une action éco-responsable dans la vraie vie, cliquez sur 'Impulser'. Vous gagnez des points AT et réduisez l'empreinte carbone collective de l'équipage."*
  - **Bouton** : `[ Suivant ➔ ]`

---

### ⚔️ Étape 4 / 7 : La Base Lunaire & Les Défis PvP
* **Cible Spotlight** : La **Lune 3D 🌕** en orbite haute avec son symbole d'épées ⚔️.
* **Position de la main 👆** : Pointe sur la Lune et sur les badges des avatars.
* **Infobulle** :
  - **Titre** : 🌕 *L'Arène des Défis Temporels*
  - **Explication** : *"Défiez les équipes adverses ! Cliquez sur la Lune pour voir les défis reçus/envoyés ou lancer un défi avec un chrono (24h/48h) et un gage d'équipe."*
  - **Bouton** : `[ Suivant ➔ ]`

---

### 📊 Étape 5 / 7 : Accomplissement des Missions (%) & Projections 2070
* **Cible Spotlight** : La **Barre de % d'accomplissement des missions**, le commutateur d'époque **`[ 2026 ➔ 2070 ]`** et le Radar Planétaire.
* **Position de la main 👆** : Pointe sur la jauge d'accomplissement puis sur le switch 2070.
* **Infobulle** :
  - **Titre** : 📊 *Accomplissement & Projections 2070*
  - **Explication** : *"Suivez la barre de % d'accomplissement des missions. Plus l'équipage complète ses objectifs, plus le futur de la planète se refroidit en 2070 et devient à nouveau un havre vivable."*
  - **Bouton** : `[ Suivant ➔ ]`

---

### 🏆 Étape 6 / 7 : Le Podium 3D & Dossiers d'Agents
* **Cible Spotlight** : Le bouton *Podium / Classement* et les avatars flottants.
* **Position de la main 👆** : Pointe vers les rangs #1, #2, #3 et le podium 3D.
* **Infobulle** :
  - **Titre** : 🏆 *Podium & Progression*
  - **Explication** : *"Consultez le classement général en temps réel et cliquez sur un avatar pour inspecter sa fiche d'agent, ses badges et son palmarès."*
  - **Bouton** : `[ Suivant ➔ ]`

---

### 💬 Étape 7 / 7 : Le Com-Link & La Liaison WhatsApp
* **Cible Spotlight** : L'icône du **Com-Link** (chat) et l'icône **WhatsApp**.
* **Position de la main 👆** : Pointe vers le bouton d'ouverture des transmissions.
* **Infobulle** :
  - **Titre** : 📡 *Transmissions & Alertes Mobile*
  - **Explication** : *"Échangez avec votre équipe via le Com-Link spatial et recevez les alertes de défis directement sur votre groupe WhatsApp dédié."*
  - **Bouton** : `[ Terminer la Visite 🚀 ]`

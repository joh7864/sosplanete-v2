# 👆 Visite Guidée Interactive In-App (FTUX Onboarding — 13 Étapes)

> **Concept** : Un tutoriel interactif intégré directement dans l'application avec **effet Spotlight** et **infobulles explicatives holographiques** (`[ Précédent ]`, `[ Suivant ➔ ]` et `[ Passer ]`).  
> **Source de vérité** : Synchronisé avec `OnboardingGuide.tsx`, l'administration `FTUXSettings.tsx` et la configuration système.  
> **Confidentialité** : Les mécaniques d'Easter Eggs et énigmes demeurent strictement confidentielles et ne sont pas dévoilées dans ce guide.

---

## 📌 Résumé des 13 Étapes du Guide Interactif

* **Étape 1** : 🚀 **Identité de l'Agent & Bio-stabilité** (`hud-agent-profile`)
* **Étape 2** : 🌍 **La Passerelle 2026 & Secteurs Écologiques** (`sector-orb-guide`)
* **Étape 3** : ⚡ **Le Codex & Impulsion d'une Mission** (`hud-active-mission-card`)
* **Étape 4** : ⚡ **La Puissance des Impulsions Temporelles (IT)** (`mission-card-it-counter`)
* **Étape 5** : 🔍 **Recherche d'Agents & Cartographie 3D** (`hud-player-search`)
* **Étape 6** : 🌕 **L'Arène des Défis Temporels** (`hud-moon-arena`)
* **Étape 7** : 📊 **Terre 2070 : % Régénérée** (`hud-completion-bar`)
* **Étape 8** : ⏳ **Commutateur Temporel : Cap sur 2070** (`hud-epoch-switch`)
* **Étape 9** : 🔮 **Extrapolation 2070 & Bilan d'Impact** (`panel-extrapolation-2070`)
* **Étape 10** : 🚀 **Radar Temporel & Niveaux de Propulsion** (`panel-radar-2070`)
* **Étape 11** : 🏆 **Podium 3D & Progression** (`btn-podium-leaderboard`)
* **Étape 12** : 💬 **Com-Link & Messagerie d'Équipage** (`chat-panel-container`)
* **Étape 13** : ⚙️ **Menu Système, WhatsApp & Paramètres** (`hud-system-menu`)

---

## 🧭 Déroulé Détaillé des 13 Étapes

### 🌟 Étape 1 / 13 : Identité de l'Agent & Bio-stabilité
* **Cible Spotlight** : `hud-agent-profile` (Encart supérieur gauche : avatar, pseudo, bio-stabilité et équipe).
* **Position** : `bottom`
* **Infobulle** :
  - **Titre** : 🚀 *Bienvenue à bord, Agent !*
  - **Explication** : *"Vous appartenez à l'équipage de l'Arche Temporelle. Votre bio-stabilité et votre identité d'agent s'affichent ici. Vos éco-gestes réels restaurent l'avenir planétaire !"*

---

### 🌍 Étape 2 / 13 : La Passerelle 2026 & Les Secteurs Écologiques
* **Cible Spotlight** : `sector-orb-guide` (Terre 3D et orbes cristallines en orbite : Eau, Énergie, Biodiversité...).
* **Position** : `bottom`
* **Infobulle** :
  - **Titre** : 🌍 *La Passerelle & Les Secteurs Écologiques*
  - **Explication** : *"Voici la Terre entourée de ses orbes cristallines de secteurs écologiques (Eau, Énergie, Biodiversité, Recyclage...). Cliquez sur un orbe 3D pour ouvrir ses éco-missions."*

---

### 📋 Étape 3 / 13 : Le Codex & Impulsion d'une Mission
* **Cible Spotlight** : `hud-active-mission-card` (Panneau latéral gauche du Codex et carte d'action).
* **Position** : `left`
* **Infobulle** :
  - **Titre** : ⚡ *Le Codex & Impulsion d'une Mission*
  - **Explication** : *"Quand vous accomplissez une action éco-responsable dans la vraie vie, cliquez sur 'Impulser'. Vous gagnez des points IT (Impulsions Temporelles) et réduisez l'empreinte carbone collective de l'équipage."*

---

### ⚡ Étape 4 / 13 : La Puissance des Impulsions Temporelles (IT)
* **Cible Spotlight** : `mission-card-it-counter` (Compteur d'énergie vitale IT).
* **Position** : `left`
* **Infobulle** :
  - **Titre** : ⚡ *La Puissance des Impulsions Temporelles (IT)*
  - **Explication** : *"Les IT représentent la puissance de l'énergie vitale envoyée vers le futur. Chaque éco-geste réel accompli génère des IT. Plus vous accumulez d'IT, plus le futur se régénère rapidement et évolue dans le bon sens !"*

---

### 🔍 Étape 5 / 13 : Recherche d'Agents & Cartographie 3D
* **Cible Spotlight** : `hud-player-search` (Bouton et loupe de recherche d'agent dans le header).
* **Position** : `bottom`
* **Infobulle** :
  - **Titre** : 🔍 *Recherche d'Agents & Cartographie 3D*
  - **Explication** : *"Retrouvez vos camarades et inspectez leurs vaisseaux spatiaux ! La recherche rapide permet de cibler n'importe quel explorateur avec une rotation cinématique et un anneau holographique au sol."*

---

### ⚔️ Étape 6 / 13 : L'Arène des Défis Temporels
* **Cible Spotlight** : `hud-moon-arena` (La Lune 3D en orbite haute ou badges joueurs).
* **Position** : `bottom`
* **Infobulle** :
  - **Titre** : 🌕 *L'Arène des Défis Temporels*
  - **Explication** : *"Cliquez sur la Lune en orbite ou le badge d'un joueur pour entrer dans l'arène des défis. Défiez les équipes adverses avec un chrono (24h/48h) et un gage d'équipe !"*

---

### 📊 Étape 7 / 13 : TERRE 2070 : % RÉGÉNÉRÉE
* **Cible Spotlight** : `hud-completion-bar` (Jauge d'accomplissement planétaire).
* **Position** : `bottom`
* **Infobulle** :
  - **Titre** : 📊 *TERRE 2070 : % RÉGÉNÉRÉE*
  - **Explication** : *"Suivez la jauge de régénération planétaire en direct. Plus votre équipage accomplit d'éco-gestes réels, plus le score d'accomplissement augmente et plus la Terre se refroidit à l'horizon 2070 !"*

---

### ⏳ Étape 8 / 13 : Projection Temporelle : Cap sur 2070
* **Cible Spotlight** : `hud-epoch-switch` (Commutateur temporel 2026 <-> 2070).
* **Position** : `bottom`
* **Infobulle** :
  - **Titre** : ⏳ *Projection Temporelle : Cap sur 2070*
  - **Explication** : *"Basculez à tout moment vers l'ère 2070 pour explorer la Terre régénérée dans le futur et visualiser en direct l'impact à long terme des actions de votre équipage !"*

---

### 🔮 Étape 9 / 13 : Extrapolation 2070 & Bilan d'Impact
* **Cible Spotlight** : `panel-extrapolation-2070` (Panneau récapitulatif d'impact mondial en 2070).
* **Position** : `right`
* **Infobulle** :
  - **Titre** : 🔮 *Extrapolation 2070 & Bilan d'Impact*
  - **Explication** : *"Explorez le tableau d'extrapolation 2070 ! Visualisez le recul du Jour de Dépassement Mondial, la glace arctique préservée et les équivalences en piscines d'eau potable et camions évités."*

---

### 🚀 Étape 10 / 13 : Radar Temporel & Évolution des Vaisseaux
* **Cible Spotlight** : `panel-radar-2070` (Radar des 5 niveaux de propulsion).
* **Position** : `left`
* **Infobulle** :
  - **Titre** : 🚀 *Radar Temporel & Évolution des Vaisseaux*
  - **Explication** : *"Chaque vaisseau possède 5 niveaux d'évolution. Vous franchissez des paliers technologiques selon votre progression globale de régénération (Friction, Voiles Photovoltaïques, Fusion, Résonance, Singularité)."*

---

### 🏆 Étape 11 / 13 : Podium 3D & Progression
* **Cible Spotlight** : `btn-podium-leaderboard` (Podium holographique 3D des vaisseaux).
* **Position** : `left`
* **Infobulle** :
  - **Titre** : 🏆 *Podium 3D & Progression*
  - **Explication** : *"Consultez le classement général sur le podium holographique 3D et cliquez sur n'importe quel avatar d'agent pour inspecter sa fiche, ses badges et son palmarès."*

---

### 💬 Étape 12 / 13 : Com-Link & Messagerie d'Équipage
* **Cible Spotlight** : `chat-panel-container` (Panneau de messagerie temps réel WebSockets).
* **Position** : `left`
* **Infobulle** :
  - **Titre** : 💬 *Com-Link & Messagerie d'Équipage*
  - **Explication** : *"Ouvrez le Com-Link spatial pour dialoguer en direct avec votre équipage, coordonner vos actions éco-responsables et débriefer vos stratégies de mission !"*

---

### ⚙️ Étape 13 / 13 : Options Système, WhatsApp & Paramètres
* **Cible Spotlight** : `hud-system-menu` (Bulle universelle d'options HUD).
* **Position** : `left`
* **Infobulle** :
  - **Titre** : ⚙️ *Options Système, WhatsApp & Paramètres*
  - **Explication** : *"Accédez en un clic à la bulle d'options pour rejoindre le canal WhatsApp d'équipe, relancer ce guide, ajuster la qualité 3D ou consulter le Journal de bord !"*

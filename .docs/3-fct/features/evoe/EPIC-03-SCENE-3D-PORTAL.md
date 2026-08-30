# 🪐 EPIC-03 : Passerelle Temporelle & Scène 3D Principale (QG 2026)

## 📋 Présentation
Cet Epic couvre le moteur de rendu 3D Three.js / React Three Fiber de la passerelle QG 2026, incluant le globe terrestre, la Lune interactive, la disposition des avatars 3D, les vaisseaux spatiaux d'équipe, le ruban des secteurs orbitaux et la gestion de l'orientation écran.

---

### 📖 US-EVOE-07 : Rendu 3D Cosmique & Contrôle Caméra
- **En tant qu'** Agent Temporel,
- **Je veux** interagir avec l'espace 3D cosmique (Terre, Lune, environnement stellaire),
- **Afin d'** explorer visuellement l'état du système et de mon équipe.

#### ⚙️ Règles de Gestion & Fonctionnement
1. Le canvas 3D utilise `@react-three/fiber` et `@react-three/drei` (`OrbitControls`, `Canvas`, post-processing néon).
2. La Terre 3D est affichée au centre avec textures, nuages animés et shader d'atmosphère.
3. La Lune 3D gravite en orbite et sert de point d'ancrage visuel pour l'Arène des Défis.
4. L'utilisateur peut faire pivoter la caméra en glissant (drag), zoomer avec la molette/pinch, ou réinitialiser la vue.
5. Des particules d'étoiles et un champ cosmique en mouvement perpétuel sont générés par `CosmicEnvironment.tsx`.

#### 🧪 Critères d'Acceptation (Gherkin)
- **Scénario 1 : Rendu fluide de la Terre 3D**
  - **Given** l'utilisateur connecté sur la passerelle 2026.
  - **When** la scène 3D se charge.
  - **Then** la Terre tourne sur elle-même et réagit aux contrôles de la souris/toucher tactile sans saccades.
- **Scénario 2 : Clic sur la Lune des Défis**
  - **Given** la Lune 3D visible dans le cosmos.
  - **When** le joueur clique sur la Lune.
  - **Then** l'onglet des Défis (`challenges`) s'ouvre dans le panneau latéral.

---

### 📖 US-EVOE-08 : Affichage 3D des Avatars des Joueurs
- **En tant qu'** Agent Temporel,
- **Je veux** voir les avatars 3D des agents de mon nexus disposés en arc de cercle sur la passerelle,
- **Afin de** visualiser mes coéquipiers et rivaux.

#### ⚙️ Règles de Gestion & Fonctionnement
1. Les avatars des joueurs présents dans l'instance sont positionnés selon une disposition trigonométrique autour de la passerelle.
2. Chaque avatar arbore un modèle 3D (`PlayerAvatar.tsx`) avec son pseudo et sa couleur d'équipe.
3. Un badge visuel ou effet holographique distingue l'avatar du joueur actuellement connecté.
4. Le clic sur un avatar ouvre la fiche de profil de l'agent (`AgentProfileModal`).

#### 🧪 Critères d'Acceptation (Gherkin)
- **Scénario 1 : Clic sur l'avatar d'un coéquipier**
  - **Given** la liste des avatars affichée dans la scène 3D.
  - **When** l'utilisateur clique sur l'avatar d'un autre joueur.
  - **Then** la modale de profil de cet agent s'ouvre avec ses statistiques de jeu.

---

### 📖 US-EVOE-09 : Vaisseaux d'Équipe & Effets de Propulsion
- **En tant qu'** Agent Temporel,
- **Je veux** observer le vaisseau spatial de mon équipe et ceux des autres classes dans l'espace,
- **Afin de** constater visuellement notre niveau d'avancement technologique.

#### ⚙️ Règles de Gestion & Fonctionnement
1. Chaque équipe de l'école est représentée par un modèle de vaisseau spatial 3D (`Vessel2070.tsx` / `VesselEngines.tsx`).
2. Les moteurs du vaisseau émettent des traînées de particules et flammes dont la couleur et l'intensité varient selon le niveau technologique (Niveau 1 : braises charbon/fioul -> Niveau 5 : halo quantique/violet).
3. Le clic direct sur un vaisseau 3D déclenche l'ouverture du radar de propulsion centré sur l'équipe correspondante.

#### 🧪 Critères d'Acceptation (Gherkin)
- **Scénario 1 : Clic sur un vaisseau spatial**
  - **Given** les vaisseaux d'équipe en orbite.
  - **When** le joueur clique sur le vaisseau de la "Team Alpha".
  - **Then** le volet Radar de Propulsion s'ouvre et scrolle automatiquement jusqu'à la section de la "Team Alpha".

---

### 📖 US-EVOE-10 : Ruban des Secteurs Orbitaux & Orbes Thématiques
- **En tant qu'** Agent Temporel,
- **Je veux** sélectionner un pôle écologique via le ruban orbital d'orbes,
- **Afin de** filtrer instantanément le codex sur les missions de cette thématique.

#### ⚙️ Règles de Gestion & Fonctionnement
1. Le ruban orbital (`OrbitalSectorRibbon.tsx`) affiche les orbes représentatifs des grands pôles :
   - 💧 **Ressources vitales** (Eau, Alimentation, Maison)
   - 🧬 **Bio-génétique** (Biodiversité, Animaux)
   - ⚡ **Énergie** (Électricité, Énergie)
   - ♻️ **Recyclage** (Déchets)
   - 🚀 **Propulsion** (Transports)
   - 💻 **Numérique**
   - 🎓 **Académie Temporelle** (École)
2. Le clic sur une orbe sélectionne le secteur, ouvre le Codex si replié et active le carrousel 3D filtré.

#### 🧪 Critères d'Acceptation (Gherkin)
- **Scénario 1 : Sélection d'un secteur orbital**
  - **Given** la passerelle ouverte.
  - **When** l'utilisateur clique sur l'orbe "Bio-génétique".
  - **Then** le Codex s'ouvre sur l'onglet missions avec le filtre "Bio-génétique" sélectionné.

---

### 📖 US-EVOE-11 : Orientation Écran & Adaptation Responsive Mobile
- **En tant qu'** Agent Temporel sur smartphone ou tablette,
- **Je veux** une interface adaptée avec carrousels tactiles et gestion de l'orientation,
- **Afin de** jouer confortablement quel que soit mon appareil.

#### ⚙️ Règles de Gestion & Fonctionnement
1. Par défaut, l'application incite à l'utilisation en mode Paysage (Landscape) pour une expérience 3D optimale.
2. Un bouton de bascule (`allowPortrait`) permet d'autoriser l'orientation Portrait avec persistance dans `localStorage`.
3. Sur mobile, un carrousel simplifié (`MobileContextCarousel.tsx`) et une barre de recherche pliable facilitent la consultation.

#### 🧪 Critères d'Acceptation (Gherkin)
- **Scénario 1 : Autorisation du mode portrait**
  - **Given** un utilisateur sur mobile ouvrant le menu de configuration d'affichage.
  - **When** il active le switch "Autoriser mode portrait".
  - **Then** l'overlay de verrouillage paysage disparaît et le choix est conservé en stockage local.

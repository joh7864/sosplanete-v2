# ⚡ EPIC-07 : Radar de Propulsion & Niveaux Technologiques

## 📋 Présentation
Cet Epic couvre le système technologique des moteurs spatiaux des équipes, les 5 paliers d'évolution (Friction -> Singularité), le radar de propulsion (`EvoeRadarMeter.tsx`), l'interaction 3D vaisseau -> radar et la fonction de réinitialisation/recalcul.

---

### 📖 US-EVOE-24 : Radar des Niveaux de Propulsion d'Équipe
- **En tant qu'** Agent Temporel,
- **Je veux** ouvrir le Radar de Propulsion pour visualiser l'état technologique des moteurs de chaque équipe,
- **Afin de** suivre l'efficacité énergétique et la puissance des vaisseaux de l'école.

#### ⚙️ Règles de Gestion & Fonctionnement
1. Le Radar de Propulsion (`EvoeRadarMeter.tsx`) affiche une jauge pour chaque équipe de l'école.
2. Les paliers technologiques sont régis par les seuils officiels d'avancement (`PROPULSION_THRESHOLDS`) :
   - **Niveau 1 (0%)** : *Friction Thermique* (Charbon / Fioul spatial)
   - **Niveau 2 (25%)** : *Voiles Photovoltaïques* (Solaire / Vents Stellaires)
   - **Niveau 3 (45%)** : *Fusion Magnétique* (Tokamak / Nucléaire Propre)
   - **Niveau 4 (65%)** : *Résonance Quantique* (Énergie du Vide)
   - **Niveau 5 (85%)** : *Singularité Protonique* (Trou Noir Artificiel)
3. La jauge calcule la progression en % vers le niveau suivant.

#### 🧪 Critères d'Acceptation (Gherkin)
- **Scénario 1 : Passage au palier technologique supérieur**
  - **Given** une équipe ayant accumulé suffisamment d'impact pour atteindre 50% de complétion.
  - **When** le radar de propulsion est affiché.
  - **Then** l'équipe est au "Niveau 3 : Fusion Magnétique" et la jauge indique la progression restante vers le Niveau 4.

---

### 📖 US-EVOE-25 : Réinitialisation et Recalcul Forcé de Propulsion
- **En tant qu'** Administrateur / Agent Temporel autorisé,
- **Je veux** pouvoir forcer le recalcul des niveaux technologiques des équipes,
- **Afin de** synchroniser instantanément les réacteurs après des imports de données ou modifications de règles.

#### ⚙️ Règles de Gestion & Fonctionnement
1. Le bouton de synchronisation des réacteurs déclenche un appel API `POST /evoe/propulsion/reset/:instanceId`.
2. Le backend recalcule les totaux d'actions de toutes les équipes de l'instance pour l'année scolaire en cours et met à jour la table `EvoeTeamTechnology`.
3. Le radar et les effets 3D de réacteurs dans le cosmos se mettent à jour automatiquement.

#### 🧪 Critères d'Acceptation (Gherkin)
- **Scénario 1 : Recalcul forcé réussi**
  - **Given** de nouvelles actions importées en base.
  - **When** l'agent clique sur "Synchroniser les Réacteurs".
  - **Then** l'animation de recalcul se lance, l'API confirme la mise à jour et les jauges s'ajustent.

---

### 📖 US-EVOE-26 : Focus Vaisseau Spatial 3D vers le Radar
- **En tant qu'** Agent Temporel explorant l'espace 3D,
- **Je veux** cliquer directement sur un vaisseau spatial pour zoomer sur la fiche technique de son équipe,
- **Afin d'** obtenir un accès rapide et ergonomique aux informations d'une classe.

#### ⚙️ Règles de Gestion & Fonctionnement
1. Dans la scène 3D (`Portal2026.tsx`), chaque vaisseau d'équipe est cliquable (`onPointerDown`).
2. Le clic déclenche `handleVesselClick(teamId)`.
3. Le panneau latéral du Radar s'ouvre (`showRadar = true`) et effectue un défilement doux (`scrollIntoView({ behavior: 'smooth' })`) directement sur la carte de l'équipe sélectionnée.

#### 🧪 Critères d'Acceptation (Gherkin)
- **Scénario 1 : Clic 3D et auto-scroll**
  - **Given** la vue 3D avec les vaisseaux en orbite.
  - **When** le joueur clique sur le vaisseau de l'équipe 3.
  - **Then** le Radar de propulsion s'ouvre et la carte de l'équipe 3 est immédiatement mise en évidence au centre de l'écran.

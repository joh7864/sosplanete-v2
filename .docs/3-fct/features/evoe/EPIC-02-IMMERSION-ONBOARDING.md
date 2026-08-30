# 🛸 EPIC-02 : Immersion, Briefing & Onboarding Temporel

## 📋 Présentation
Cet Epic couvre l'intégration narrative du jeu, le briefing vidéo introductif de la mission SOS Planète / Evoe et la visite guidée interactive en 11 étapes (Onboarding Guide).

---

### 📖 US-EVOE-05 : Briefing Temporel Initial
- **En tant qu'** Agent Temporel se connectant pour la première fois,
- **Je veux** visionner le briefing temporel avec la vidéo de mission et l'histoire SF,
- **Afin de** comprendre les enjeux de la mission 2026/2070 et le fonctionnement du nexus.

#### ⚙️ Règles de Gestion & Fonctionnement
1. Au premier chargement de la passerelle après connexion, la modale `TemporalBriefing` s'ouvre si la clé `evoe_skip_briefing_<childId>` n'est pas définie à `true` dans le `localStorage`.
2. Le briefing comprend un en-tête stylisé cyberpunk/néon avec terminal de transmission.
3. Un lecteur vidéo ou message holographique recontextualise la crise écologique et l'Arche 2070.
4. Une option « Ne plus afficher ce briefing au démarrage » est disponible sous forme de checkbox.
5. Le bouton « Entrer dans la Passerelle Temporelle » ferme la modale et enregistre le choix de mémorisation.

#### 🧪 Critères d'Acceptation (Gherkin)
- **Scénario 1 : Première ouverture du briefing**
  - **Given** un joueur nouvellement connecté sans historique dans le navigateur.
  - **When** la page principale se charge.
  - **Then** la modale de Briefing Temporel apparaît au premier plan avec l'effet de transmission.
- **Scénario 2 : Fermeture avec mémorisation**
  - **Given** le joueur cochant « Ne plus afficher ce briefing ».
  - **When** il clique sur « Entrer dans la Passerelle Temporelle ».
  - **Then** la modale se ferme et ne se réouvre plus lors des rechargements ultérieurs.

---

### 📖 US-EVOE-06 : Onboarding Interactif & Visite Guidée (11 Étapes)
- **En tant qu'** Agent Temporel découvrant l'interface spatiale,
- **Je veux** lancer une visite guidée pas à pas qui me montre et met en valeur chaque module clé,
- **Afin de** maîtriser les commandes de la passerelle, du codex, des défis et de la projection 2070.

#### ⚙️ Règles de Gestion & Fonctionnement
1. Un bouton d'aide / visite guidée (icône `Compass` ou `OnboardingGuide`) permet de déclencher le tutoriel à tout moment.
2. Le tutoriel est séquencé en **11 étapes interactives** :
   - **Étape 1** : Bienvenue & Profil Agent (avatar, stats, personnalisation).
   - **Étape 2** : Passerelle 3D & Orbes des Secteurs.
   - **Étape 3** : Le Codex des Missions & Impulsion d'actions écologiques.
   - **Étape 4** : Puissance des Indicateurs (CO2, Eau, Déchets, Énergie).
   - **Étape 5** : L'Arène des Défis (Lune 3D & Défis PvP inter-équipes).
   - **Étape 6** : Jauge de Santé Planétaire (Terre 2026 / 2070).
   - **Étape 7** : Projection Temporelle (Bascule vers 2070).
   - **Étape 8** : Extrapolation Mondiale 2070 (Bilan d'impact mondial).
   - **Étape 9** : Vaisseaux & Niveaux de Propulsion Technologique (Friction -> Singularité).
   - **Étape 10** : Podium & Leaderboard 3D.
   - **Étape 11** : Comm-Link (Messagerie temps réel & synergies).
3. À chaque étape, la caméra 3D ou l'état de l'interface bascule automatiquement vers la vue adéquate (`era`, `view2026`, ouverture/fermeture du codex ou du radar).
4. Des boutons « Suivant », « Précédent » et « Passer » permettent de naviguer librement ou d'interrompre le guide.

#### 🧪 Critères d'Acceptation (Gherkin)
- **Scénario 1 : Navigation fluide dans le guide**
  - **Given** le guide d'onboarding ouvert à l'étape 1 (Époque 2026).
  - **When** l'utilisateur avance jusqu'à l'étape 7 (Projection Temporelle).
  - **Then** l'interface bascule automatiquement en époque 2070 avec l'effet de transition.
- **Scénario 2 : Fermeture du guide**
  - **Given** le guide ouvert.
  - **When** l'utilisateur clique sur « Passer » ou la croix de fermeture.
  - **Then** le guide se ferme et la passerelle redevient interactive.

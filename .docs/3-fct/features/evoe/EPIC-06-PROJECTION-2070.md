# ⏳ EPIC-06 : Projection Temporelle 2070 & Extrapolation Mondiale

## 📋 Présentation
Cet Epic couvre la bascule vers le futur (époque 2070), la transformation 3D du globe terrestre (Terre régénérée vs Terre en crise selon les actions), l'extrapolation mondiale d'impact (calculs planétaires) et l'Oracle Terrestre (intelligence narrative d'avertissement et de conseils).

---

### 📖 US-EVOE-20 : Bascule d'Époque (2026 <-> 2070)
- **En tant qu'** Agent Temporel,
- **Je veux** cliquer sur le sélecteur d'époque pour basculer entre le présent (2026) et le futur projeté (2070),
- **Afin de** visualiser les conséquences à long terme de nos actions actuelles.

#### ⚙️ Règles de Gestion & Fonctionnement
1. Le bouton de bascule d'époque (`era === '2026' ? '2070' : '2026'`) est accessible dans la barre d'outils supérieure.
2. La transition déclenche un effet d'animation visuel plein écran (distorsion temporelle, flash quantique via Framer Motion).
3. En mode 2026 : affichage de la passerelle QG avec la Terre actuelle, les avatars d'élèves, les orbes de secteurs et le Codex.
4. En mode 2070 : affichage du portail futuriste (`Portal2070.tsx`), de l'Arche spatiale (`Arch2070.tsx`), de la Terre régénérée et du panneau d'extrapolation planétaire.

#### 🧪 Critères d'Acceptation (Gherkin)
- **Scénario 1 : Bascule vers 2070**
  - **Given** la passerelle en mode 2026.
  - **When** l'utilisateur clique sur le commutateur "2070".
  - **Then** l'effet de distorsion se joue et l'environnement 3D bascule sur le portail 2070 avec l'Arche temporelle.

---

### 📖 US-EVOE-21 : Terre 2070 & Jauge de Régénération Planétaire
- **En tant qu'** Agent Temporel en mode 2070,
- **Je veux** voir le niveau de régénération de la Terre sous forme de pourcentage et de shader 3D évolutif,
- **Afin d'** évaluer la guérison de la planète grâce aux éco-actions de l'école.

#### ⚙️ Règles de Gestion & Fonctionnement
1. La Terre 2070 utilise un shader personnalisé : plus le taux de régénération est élevé, plus la texture passe d'un aspect désertique/magmatique à une biosphère luxuriante et bleue.
2. Une jauge radiale / barre de progression affiche le « % Planétaire Régénéré ».
3. La valeur provient de l'agrégation des actions de l'instance par rapport aux objectifs de la période (`dashboardStatus.instanceRegenerationRate`).

#### 🧪 Critères d'Acceptation (Gherkin)
- **Scénario 1 : Visualisation de la régénération**
  - **Given** une instance ayant réalisé un grand nombre d'actions (taux de régénération à 78%).
  - **When** la scène 2070 est affichée.
  - **Then** la jauge indique "78% Régénéré" et le globe 3D affiche une surface verdoyante avec atmosphère saine.

---

### 📖 US-EVOE-22 : Extrapolation Globale d'Impact (Bilan Mondial)
- **En tant qu'** Agent Temporel en mode 2070,
- **Je veux** ouvrir le panneau d'extrapolation mondiale (`showExtrapolation`),
- **Afin de** comprendre ce que donneraient les actions de notre école si elles étaient appliquées par toute la population humaine.

#### ⚙️ Règles de Gestion & Fonctionnement
1. Le panneau d'extrapolation calcule les données via l'API `GET /evoe/extrapolation/metrics`.
2. Les métriques affichées sont :
   - **Économie CO2 mondiale projetée** : exprimée en tonnes (t) ou kilotonnes (kt).
   - **Économie d'Eau mondiale projetée** : exprimée en mètres cubes (m³) ou mégalitres (ML).
   - **Déchets évités à l'échelle Terre** : exprimés en tonnes (t).
   - **Nombre de citoyens virtuels équivalents**.
3. Des cartes interactives et graphiques de comparaison permettent de mesurer le levier d'action globale.

#### 🧪 Critères d'Acceptation (Gherkin)
- **Scénario 1 : Affichage des métriques d'extrapolation**
  - **Given** l'époque 2070 active.
  - **When** le joueur clique sur le bouton "Bilan d'Extrapolation Mondiale".
  - **Then** le volet d'extrapolation s'ouvre et affiche les économies projetées avec les unités formatées (`fmtMass`, `fmtVolume`).

---

### 📖 US-EVOE-23 : Oracle Terrestre & Messages Prophétiques
- **En tant qu'** Agent Temporel,
- **Je veux** interagir avec l'Oracle Terrestre pour recevoir des analyses contextuelles et des conseils écologiques,
- **Afin de** guider ma stratégie de jeu et d'impact.

#### ⚙️ Règles de Gestion & Fonctionnement
1. L'Oracle Terrestre analyse le niveau de santé actuel de la planète et génère un texte dynamique avec animation « machine à écrire » (`earthOracleTyping`).
2. Les messages varient selon les seuils (Alerte rouge si température/impact critique, Encouragement si synergie forte, Félicitations si objectif dépassé).

#### 🧪 Critères d'Acceptation (Gherkin)
- **Scénario 1 : Déclenchement de l'Oracle**
  - **Given** la passerelle temporelle active.
  - **When** le composant Oracle Terrestre est sollicité.
  - **Then** le texte s'affiche lettre par lettre avec son indicateur de niveau de gravité.

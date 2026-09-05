# Plan d'Implémentation : Système d'Easter Eggs & Énigmes SF "Sherlock Holmes 2070"

Ce document définit l'architecture logicielle, la modélisation de données, le parcours utilisateur et le plan d'exécution pour l'introduction des **Easter Eggs & Énigmes SF** dans **Evoe** (SOS Planète v2).

---

## 1. Vue d'Ensemble & Lore du Système

### A. Le Concept Narratif 2070
- **Origine des Transmissions** : Les énigmes sont envoyées directement depuis la station orbitale par des **humains de l'an 2070** (scientifiques et citoyens de l'Arche) afin de dynamiser, stimuler et tester la sagacité des **agents temporels de 2026**.
- **Diffusion Simultanée** : Dès l'ouverture de la période d'activation, l'énigme est transmise **à tous les joueurs en même temps**.
- **Fenêtre Temporelle & Expiration** : L'énigme reste active pendant la durée du cycle ($N$ périodes, par défaut **2 périodes**). Si une énigme n'a pas été résolue à la fin de cette fenêtre, elle **se ferme automatiquement** (mais pourra être reprogrammée ultérieurement dans une période future).

### B. Parcours Joueur & Mécaniques de Jeu
1. **Badge Œuf de Pâques SF dans le HUD** : Un micro-œuf holographique animé apparaît au coin inférieur droit de l'avatar du joueur (en haut à gauche de l'écran).
2. **Modale d'Enquête SF & Cadenas / Énigme Visuelle** :
   - Un clic ouvre la fiche d'investigation : texte d'ambiance 2070, indices progressifs, support d'image/schéma.
   - **Champ de Saisie / Cadenas Numérique SF (4 chiffres / mots-clés)** : Pour les énigmes de logique (ex: décoder la combinaison à 4 chiffres du cadenas de l'Arche créée par l'AM), un pavé de saisie interactif holographique permet de tester sa réponse avec validation en temps réel.
3. **Déclenchement d'Exploration (Triggers)** : Pour les énigmes d'exploration, réalisation d'actions secrètes dans l'application (clics sur le globe 2026, commandes Comm-Link, raccourci clavier, switch temporel, etc.).
4. **Effet WOOOW Individuel & Partage** : L'effet visuel/sonore se déclenche **uniquement sur l'écran du joueur**. Une fois découvert, le joueur dispose d'un bouton pour **partager un indice ou la solution** (options : *À un joueur spécifique*, *À mon équipe [par défaut]*, ou *À tous les joueurs*).
5. **Validation d'Équipe & Points IT** : Dès que le **nombre de joueurs requis** (paramétré par l'AM, ex: 2, 3 ou 4 joueurs par équipe) a résolu l'énigme dans la limite des $M$ équipes gagnantes autorisées :
   - L'équipe remporte les **Points IT**.
   - Le vaisseau de l'équipe avance immédiatement sur la Timeline 2070.
6. **Leaderboard Détectives Temporels** : Un classement dédié honore les meilleurs enquêteurs (nombre d'énigmes résolues, rapidité de découverte, points apportés à leur équipe).

```mermaid
graph TD
    A["Humains de 2070 : Envoi Enigme Périodique"] --> B["Diffusion simultanée à tous les joueurs 2026"]
    B --> C["Badge Œuf SF animé sur Avatar HUD (Dashboard)"]
    C -->|Clic| D["Modale Énigme SF (Texte + Image Schéma + Indices)"]
    D --> E1["Option A : Saisie du code cadenas 4 chiffres / réponse dans la modale"]
    D --> E2["Option B : Exploration UI (Globe 2026, Comm-Link, Konami...)"]
    E1 --> F["Effet WOOOW sur son écran + Validation individuelle"]
    E2 --> F
    F --> G["Option de partage d'indice / code (Équipe par défaut)"]
    F --> L["Mise à jour du Leaderboard des Détectives Temporels 🏆"]
    G --> H{"Nombre de joueurs requis atteint dans l'équipe ?"}
    H -->|Oui (dans la limite des places max)| I["Attribution Points IT à l'Équipe 🚀 + Propulsion Vaisseau 2070"]
    H -->|Non| J["Progression incrémentée (ex: 2/3 joueurs)"]
    D --> K{"Fin de la fenêtre temporelle (N périodes) ?"}
    K -->|Non résolu| M["Fermeture de l'énigme (Réinjection future possible)"]
```

---

## 2. Modélisation des Données (Prisma / PostgreSQL)

### A. Nouvelles Tables

```prisma
enum EasterEggTriggerType {
  RIDDLE_ANSWER_INPUT    // Champ de saisie d'un code (4 chiffres...) ou mot de passe dans la modale
  KONAMI_CODE           // ↑↑↓↓←→←→BA
  COMM_LINK_COMMAND     // /1985, /matrix, /party...
  CLICK_REPEATED        // Clics répétés sur élément (Globe 2026, console...)
  SCREEN_EDGE           // Survol recoin / bord d'écran 3D
  TIMELINE_WARP         // Switchs temporels rapides (<15s)
  METRIC_SEQUENCE       // Clics ordonnés sur compteurs profil
  LOGO_HOLD             // Maintien 3s sur logo EVOE
  CUSTOM_ACTION         // Action custom
}

enum DifficultyLevel {
  EASY
  MEDIUM
  HARD
  LEGENDARY
}

model EvoeEasterEgg {
  id              Int                  @id @default(autoincrement())
  code            String               @unique // ex: EE_CADENAS_4CH_ARCHE, EE_KONAMI_80S
  title           String               // Titre public (ex: "Le Cadenas Quantique à 4 Chiffres")
  senderLore      String               // Message des humains de 2070 (Sherlock SF)
  clues           Json                 // Tableau d'indices progressifs ["Indice 1...", "Indice 2..."]
  imageUrl        String?              // Image/schéma d'énigme visuelle (ex: infographie cadenas)
  triggerType     EasterEggTriggerType @default(RIDDLE_ANSWER_INPUT)
  expectedAnswer  String?              // Réponse attendue (ex: "4207", "CYBERPUNK")
  caseSensitive   Boolean              @default(false)
  triggerConfig   Json?                // {"command": "/1985", "target": "globe2026", "clicks": 7, etc.}
  complexity      DifficultyLevel      @default(MEDIUM)
  rewardPointsIT  Int                  @default(50)
  orderIndex      Int                  @default(0) // Ordre de passage déplaçable en Drag & Drop
  isActive        Boolean              @default(true)
  createdAt       DateTime             @default(now())
  updatedAt       DateTime             @updatedAt

  instances       EvoeEasterEggInstance[]
  playerProgress  EvoeEasterEggPlayerProgress[]
  teamRewards     EvoeEasterEggTeamReward[]

  @@map("evoe_easter_egg")
}

model EvoeEasterEggInstance {
  id                  Int           @id @default(autoincrement())
  instanceYearId      Int
  easterEggId         Int
  periodStartId       Int           // Période de début
  periodEndId         Int           // Période d'expiration (Start + Frequency - 1)
  isClosed            Boolean       @default(false)
  unlockedAt          DateTime      @default(now())
  closedAt            DateTime?

  easterEgg           EvoeEasterEgg @relation(fields: [easterEggId], references: [id], onDelete: Cascade)
  instanceYear        InstanceYear  @relation(fields: [instanceYearId], references: [id], onDelete: Cascade)

  @@unique([instanceYearId, easterEggId, periodStartId])
  @@map("evoe_easter_egg_instance")
}

model EvoeEasterEggPlayerProgress {
  id            Int           @id @default(autoincrement())
  easterEggId   Int
  childId       Int
  periodId      Int
  discoveredAt  DateTime      @default(now())
  resolutionTimeSeconds Int?   // Temps mis depuis l'ouverture de l'énigme
  answerSubmitted String?      // Réponse validée
  metadata      Json?

  easterEgg     EvoeEasterEgg @relation(fields: [easterEggId], references: [id], onDelete: Cascade)
  child         Child         @relation(fields: [childId], references: [id], onDelete: Cascade)

  @@unique([easterEggId, childId, periodId])
  @@map("evoe_easter_egg_player_progress")
}

model EvoeEasterEggTeamReward {
  id                Int           @id @default(autoincrement())
  easterEggId       Int
  teamId            Int
  periodId          Int
  awardedPointsIT   Int
  rank              Int           // 1ère équipe gagnante, 2ème équipe...
  completedAt       DateTime      @default(now())
  playersCount      Int           // Nombre de joueurs ayant validé
  teamTotalPlayers  Int           // Effectif total de l'équipe

  easterEgg         EvoeEasterEgg @relation(fields: [easterEggId], references: [id], onDelete: Cascade)
  team              Team          @relation(fields: [teamId], references: [id], onDelete: Cascade)

  @@unique([easterEggId, teamId, periodId])
  @@map("evoe_easter_egg_team_reward")
}
```

### B. Paramètres de Configuration (`GameConfig` / `InstanceYear`)
- `easterEggsEnabled`: `Boolean @default(true)` (Activation globale de la fonctionnalité).
- `easterEggFrequency`: `Int @default(2)` (Fréquence en périodes : toutes les $N$ périodes).
- `easterEggRequiredPlayers`: `Int @default(2)` (Nombre absolu de joueurs requis par équipe pour décrocher la récompense).
- `easterEggMaxWinningTeams`: `Int @default(0)` (0 = toutes les équipes qui atteignent le quota, ou 1, 2, 3 pour limiter aux $M$ premières équipes).

---

## 3. Spécifications Fonctionnelles & Expérience Utilisateur (UI/UX)

### A. Badge HUD sur l'Avatar (`SciFiEggBadge.tsx`)
- **Emplacement** : Fixé en bas à droite de l'avatar du joueur dans le bandeau supérieur (`#hud-agent-profile`).
- **États Visuels** :
  - **Non Résolu** : Œuf néon cyan/doré pulsant avec micro-onde de lévitation et pastille `!`.
  - **Résolu par l'Agent** : Teinte vert émeraude avec coche `✓`.
  - **Validé par l'Équipe** : Halo doré éclatant avec micro-particules.
  - **Expiré** : Retrait du badge si le cycle est écoulé.

### B. Modale d'Énigme SF avec Champ Cadenas 4 Chiffres (`EasterEggModal.tsx`)
- **Design** : Glassmorphism sombre premium (`backdrop-filter: blur(16px)`), liserés holographiques dorés et cyans.
- **Sections de la Modale** :
  1. **En-tête de Transmission 2070** : Nom de l'émetteur + Titre de l'énigme.
  2. **Message d'Alerte (Lore SF)** : Récit d'ambiance Sherlock Holmes 2070.
  3. **Zone Schéma / Énigme Visuelle** : Affichage de l'infographie de l'énigme (ex: schéma du cadenas à 4 chiffres avec ses règles de déduction) avec bouton Zoom / Lightbox HD.
  4. **Module Interactif de Réponse (Cadenas SF à 4 Chiffres)** :
     - Si l'énigme requiert une saisie : interface de 4 cases / pavé numérique holographique avec curseur fluide.
     - Bouton *"Déverrouiller le Cadenas"* / *"Soumettre ma déduction"*.
     - Feedback immédiat : animation de secousse cyber-rouge en cas d'erreur (*"Combinaison incorrecte - Analysez les indices"*), ou flash vert émeraude avec déverrouillage sonore en cas de succès !
  5. **Indices Débloquables** : Boutons *"Révéler l'indice 1"*, *"Révéler l'indice 2"*.
  6. **Jauge d'Équipe en Nombre Réel de Joueurs** :
     - Affichage : `2 / 3 joueurs requis dans votre équipe (Effectif : 4 membres)`.
     - Jauge segmentée animée indiquant les agents de l'équipe ayant déjà percé le secret.
     - Badge de récompense : `+60 Points IT` | Mention des places gagnantes restantes (*ex: 1ère équipe / 2 places éligibles*).
  7. **Module de Partage Post-Découverte** :
     - Dès résolution : section de transmission Comm-Link avec sélection du destinataire :
       - `Mon Équipe` *(par défaut)*
       - `Un Joueur spécifique` *(menu déroulant des agents)*
       - `Tous les Joueurs` *(Canal Global)*
     - Choix du contenu : `Indice cryptique` ou `Code solution`.

### C. Le Leaderboard "Détectives Temporels" (`EasterEggLeaderboardModal.tsx`)
Accessible depuis le menu du Leaderboard ou directement depuis la modale d'énigme :
- **Podium des 3 Meilleurs Détectives de l'Année** :
  - Rang 1 (Couronne de Sherlock 2070), Rang 2, Rang 3.
- **Tableau Complet des Joueurs** :
  - Pseudo, Avatar, Badge d'Équipe.
  - Nombre total d'Easter Eggs découverts.
  - Nombre de découvertes en "Première Ligne" (*First Solver*).
  - Total de Points IT apportés à leur équipe respective.
- **Classement Inter-Équipes des Énigmes** :
  - Équipes ayant résolu le plus grand nombre d'énigmes dans les temps avec leur vitesse moyenne de résolution.

---

## 4. Cockpit d'Administration & Suivi AM (`apps/admin-sosplanete-v2`)

### A. Paramètres de Gamification (`Settings > Easter Eggs`)
- **Interrupteur général** : Activer / Désactiver les Easter Eggs.
- **Fréquence d'apparition** : Nombre de périodes par cycle ($N = 1, 2, 3, 4$ périodes, par défaut **2**).
- **Seuil d'Équipe Requis** : **Nombre de joueurs requis** par équipe (sélecteur numérique : 1, 2, 3, 4, 5... joueurs).
- **Limite des Équipes Gagnantes** : Nombre d'équipes pouvant remporter les points par cycle (*Illimité / Toutes*, *1 seule*, *2*, *3*).

### B. Éditeur d'Énigmes avec Réordonnancement Drag & Drop
- **Liste des Cartes d'Énigmes Déplaçables à la Souris** :
  - Réorganisation intuitive de l'ordre de passage des énigmes dans l'année par glisser-déposer (Drag & Drop visuel).
- **Formulaire de Création / Modification** :
  - Titre, Code unique, Niveau de difficulté, Points IT attribués.
  - Lore & Message d'ambiance 2070.
  - Indices textuels progressifs.
  - **Upload d'Image / Infographie d'Énigme** (visuel du cadenas, schéma spatial).
  - **Type de Déclencheur** :
    - *Saisie de Réponse / Code Cadenas 4 Chiffres* (avec champ de la réponse attendue et option casse).
    - *Globe 2026 (7 clics)*, *Comm-Link (/1985, /matrix...)*, *Konami Code*, *Maintien Logo EVOE*, *Bascule 15s*, etc.
  - Statut Actif / Inactif.

### C. Cockpit de Suivi en Temps Réel pour l'AM
1. **Suivi d'Avancement par Équipe (Période Active)** :
   - Tableau dynamique :
     - *Équipe Air* : 3 / 2 requis (Effectif 4) — 🏆 **Gagné (+60 IT - 1er rang)**
     - *Équipe Terre* : 2 / 2 requis (Effectif 4) — 🏆 **Gagné (+60 IT - 2ème rang)**
     - *Équipe Feu* : 1 / 2 requis (Effectif 4) — ⏳ En cours
     - *Équipe Eau* : 0 / 2 requis (Effectif 4) — ❌ Non démarré
2. **Journal des Détections Individuelles** :
   - Liste horodatée des agents ayant résolu l'énigme, réponses saisies, et temps de résolution.
3. **Actions Rapides AM** :
   - Clôturer l'énigme en cours manuellement.
   - Forcer la diffusion d'un indice supplémentaire dans le Comm-Link.
   - Relancer une énigme passée.

---

## 5. Catalogue d'Énigmes & Easter Eggs (10 Triggers + Énigme Cadenas 4 Chiffres)

| # | Titre de l'Énigme | Message Lore 2070 (Sherlock SF) | Déclencheur (Trigger) | Support Visuel / Schéma | Difficulté | Points IT | Effet WOOOW Déclenché |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **1** | **Le Cadenas à 4 Chiffres de l'Arche** | *"Les scientifiques de 2070 ont scellé une capsule d'énergie. Déduisez le code secret à 4 chiffres grâce aux 5 règles d'exclusion..."* | **Saisie du code à 4 chiffres dans la modale** | **Infographie Cadenas & Règles de Déduction** | Moyen | **60 IT** | Flash vert émeraude, déverrouillage cyber du cadenas & confettis |
| **2** | **Le Protocole des Anciens** | *"Depuis 2070, nous avons exhumé un code de commandes pré-spatiales : une séquence de flèches et de lettres..."* | Konami Code (`↑↑↓↓←→←→BA`) | Optionnel | Facile | **40 IT** | Mode Synthwave 80s CRT + musique chiptune |
| **3** | **La Matrice de l'Arche** | *"Nos liaisons subissent une interférence verte. Tapez le protocole d'infiltration dans le Comm-Link..."* | Commande `/matrix` dans le Comm-Link | Optionnel | Facile | **40 IT** | Cascade de caractères Matrix vert fluo |
| **4** | **Le Réveil du Cœur 2026** | *"Les capteurs de l'Arche captent un signal si vous frappez 7 fois le globe de votre camp de base..."* | **7 clics rapides sur la Terre 2026** | Schéma sismique | Moyen | **60 IT** | Pulsation d'ondes vertes et pluie de biomasse |
| **5** | **L'Apesanteur Artificielle** | *"Un mot de passe inverse les générateurs gravitationnels de la station..."* | Commande `/antigravity` ou secouer mobile | Optionnel | Moyen | **60 IT** | Flottement en apesanteur des cartes et avatars |
| **6** | **La Fréquence des 5 Échos** | *"Un schéma d'ondes musicales relie vos 3 bilans de ressources vitales dans votre fiche profil..."* | Clics ordonnés sur les 3 cartes du profil : **Carbone ➔ Eau ➔ Déchets ➔ Carbone ➔ Eau** | Schéma 5 notes | Moyen | **70 IT** | 5 notes mythiques (Rencontres du 3e Type) + halo |
| **7** | **L'Impulsion du Grand Décollage** | *"Le sceau supérieur d'EVOE renferme une poussée d'urgence : maintenez la pression..."* | **Maintenir 3s le clic sur le logo EVOE** | Optionnel | Moyen | **60 IT** | Décollage fusée du logo avec tremblement |
| **8** | **Le Spectre de la Console Centrale** | *"La console holographique du Codex renferme un diagnostic crypté si vous l'interrogez 5 fois de suite..."* | **5 clics consécutifs sur la console centrale 2026** | Schéma console | Moyen | **60 IT** | Hologramme cyber avec citation SF personnalisée |
| **9** | **Le Paradoxe Temporel 1985** | *"Doc et Marty nous ont légué une commande temporelle légendaire, ou un saut frénétique entre les ères..."* | Saisir `/1985` dans le chat **OU** 5 switchs d'époque en **<15s** | Schéma DeLorean | Difficile | **90 IT** | Éclair temporel, traînée de feu et flash cinématique |
| **10** | **Le Message de la Constellation** | *"Une anomalie stellaire triangulaire est visible dans les coordonnées de l'espace profond..."* | **Cliquer sur 3 étoiles précises du fond 3D** | Carte stellaire HD | Difficile | **100 IT** | Survol d'une soucoupe volante / Tardis avec effet Doppler |
| **11** | **Le Mot de Passe Crypté** | *"Une énigme textuelle à double sens : trouvez le mot de passe écologique manquant..."* | **Saisie du mot-clé dans la modale** | Image indice SF | Moyen | **50 IT** | Déverrouillage holographique |

---

## 6. Plan de Découpage des Développements

| Phase | Composant / Module | Périmètre Détaillé |
| :--- | :--- | :--- |
| **Phase 1** | **Backend & Prisma** | Schéma Prisma (`EvoeEasterEgg`, `EvoeEasterEggInstance`, `EvoeEasterEggPlayerProgress`, `EvoeEasterEggTeamReward`), migrations, endpoints joueur (GET actif, POST vérification code/réponse, POST validation trigger, POST partage, GET leaderboard) et endpoints admin CRUD. |
| **Phase 2** | **UI Dashboard & HUD** | Composant `SciFiEggBadge.tsx` sur l'avatar du dashboard, gestion des états visuels (actif, résolu, validé équipe). |
| **Phase 3** | **Modale d'Énigme (`EasterEggModal.tsx`)** | Interface glassmorphism avec Lore 2070, affichage d'image/schéma HD, **champ interactif de réponse/cadenas à 4 chiffres avec validation**, indices décryptables, jauge d'équipe en effectif réel, et interface de partage. |
| **Phase 4** | **Leaderboard Détectives Temporels** | Modale dédiée avec podium Top 3, classement individuel, badges de rapidité et classement des équipes. |
| **Phase 5** | **Moteur de Triggers (`useEasterEggTriggers`)** | Gestionnaires d'événements pour les triggers d'exploration (Globe 2026, Comm-Link `/1985`, `/matrix`, Konami, maintien logo, switch 15s, 5 notes, console 2026). |
| **Phase 6** | **Administration SOS Planète v2** | - Paramètres globaux (fréquence, nombre de joueurs requis, limite d'équipes gagnantes).<br>- **Éditeur d'énigmes avec Drag & Drop de l'ordre de passage** et upload d'image.<br>- Cockpit de suivi AM en temps réel avec indicateurs par équipe et historiques. |
| **Phase 7** | **Temps Réel & Intégration Comm-Link** | Notifications Sockets, propulsion des vaisseaux 2070 lors de la victoire d'équipe, et messages automatiques d'indices/félicitations dans le chat. |

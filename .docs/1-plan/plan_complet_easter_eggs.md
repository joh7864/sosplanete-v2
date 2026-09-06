# 🕵️ Plan d'Implémentation Complet : Easter Eggs SF "Sherlock 2070" (Zéro Modale)

> **Dernière mise à jour :** 06 Septembre 2026  
> **Arbitrage Clé :** ZÉRO MODALE. Toute l'expérience repose sur l'interaction avec le **micro-œuf du HUD**, les apparitions de la **Mascotte 3D (Groot sur hoverboard)**, et le **Comm-Link**.

---

## 🎯 1. Parcours Joueur & Mécanique à 100% dans l'Univers 3D

```mermaid
graph TD
    A["Étape 1 : Micro-œuf inactif (HUD)"] -->|Prérequis atteint en sous-marin| B["Étape 2 : Œuf illuminé (Disponible)"]
    B -->|1er Clic Joueur| C["Mascotte 3D arrive : Message Lore + 1er Indice (Bulle BD)"]
    C --> D["Démarrage Minuteur Masqué (firstInteractionAt)"]
    D --> E["Œuf change de couleur : 'En cours de recherche'"]
    E -->|Le joueur explore par lui-même| F{"Le joueur reclique sur l'œuf"}
    F -->|Temps NON écoulé| G["Mascotte revient avec Message + 1er Indice (Rappel)"]
    F -->|Temps ÉCOULÉ (hh:mm)| H["Mascotte revient avec 2ème INDICE EXPLICITE"]
    E -->|Action secrète trouvée (Trigger)| I["Effet WOOOW individuel"]
    I --> J["Comm-Link s'ouvre avec le message pré-rempli pour l'équipe"]
    J --> K{"Nombre minimum de joueurs atteint dans l'équipe ?"}
    K -->|Oui| L["Bannière : Victoire Temporelle ! +XX Points IT remportés par l'équipe XXX !"]
    L --> M["Propulsion du vaisseau sur le Radar 2070"]
```

### Les 4 États Visuels de l'Œuf dans le HUD :
1. **État 1 — Silencieux (Prérequis non atteint)** : Micro-œuf inactif et non cliquable.
2. **État 2 — Prêt à être découvert** : L'œuf pulse. Clic du joueur ➔ la Mascotte 3D arrive au centre avec le message lore et le premier indice dans sa bulle. Le chrono `firstInteractionAt` démarre en coulisses.
3. **État 3 — En cours de recherche (Message déjà vu)** : L'œuf change de couleur pour signaler que la chasse est ouverte.  
   *(Règle stricte : **aucun changement visuel supplémentaire**, même quand le minuteur expire. C'est au joueur de penser de lui-même à recliquer sur l'œuf).*
   - *Si le joueur reclique avant la fin du temps* : la mascotte revient et réaffiche le message initial + indice 1 (rappel).
   - *Si le joueur reclique après la fin du temps (`hh:mm`)* : la mascotte revient avec le **2ème indice explicite** dans sa bulle !
4. **État 4 — Résolu par l'agent** : L'œuf passe en vert émeraude avec coche `✓` (et halo doré d'équipe dès que le quota d'équipe est atteint).

---

## 📊 2. Synthèse de l'Avancement

| Module / Périmètre | Statut | Avancement | Composants & Fichiers |
| :--- | :---: | :---: | :--- |
| **1. Modélisation & Base de Données** | ✅ Terminé | **100%** | Prisma Schema, Migrations PostgreSQL, Seeds |
| **2. API Backend (Joueur & Admin)** | ✅ Terminé | **100%** | `easter-egg.controller.ts`, `easter-egg.service.ts` |
| **3. Badge HUD & Mascotte 3D** | ✅ Terminé | **100%** | `SciFiEggBadge.tsx`, `MascotBubble3D.tsx`, `App.tsx` |
| **4. Système de Déclencheurs (11 Triggers)** | ✅ Terminé | **100%** | `useEasterEggTriggers.ts`, `Portal2026.tsx`, `ChatPanel.tsx` |
| **5. Minuteur du 2ème Indice & Reclic Œuf** | 🟡 En cours | **60%** | Backend & Mascotte OK, **Reclic joueur à brancher** |
| **6. Effets Visuels & Ciel d'Étoiles 3D** | 🟡 En cours | **30%** | Triggers OK, **Design étoiles & exploration à affiner** |
| **7. Leaderboard Détectives (dans Leaderboard)** | 🔴 À Faire | **20%** | Endpoint backend OK, **Onglet à ajouter dans `LeaderboardModal.tsx`** |
| **8. Administration & Cockpit AM** | 🔴 À Faire | **15%** | Endpoints backend OK, **Interface AM à coder** |
| **9. Temps Réel (Sockets & Comm-Link)** | 🔴 À Faire | **25%** | Pré-remplissage Comm-Link et bannière victoire équipe |

---

## 🔴 3. Plan d'Action Détaillé (Ce qui reste à faire)

### Chantier 1 : La Mécanique du Minuteur, de l'Œuf & Saisie dans la Bulle

- [ ] **1.1. Logique de Reclic sur l'Œuf (`App.tsx` / `SciFiEggBadge.tsx`)** :
  - **Couleur "Recherche en cours"** activée après le 1er clic de découverte.
  - **Aucune altération visuelle de l'œuf à l'expiration du temps** : l'initiative appartient entièrement au joueur.
  - Au clic du joueur sur l'œuf :
    - Si `isExplicitHintVisible === false` : Réapparition de la mascotte avec **message + indice 1**.
    - Si `isExplicitHintVisible === true` : Réapparition de la mascotte avec le **2ème indice explicite**.
- [ ] **1.2. Énigmes à Code / Cadenas : Option A (Mini-saisie dans la Bulle)** :
  - Intégrer directement au bas de la bulle de BD de la mascotte un mini-pavé de saisie compact holographique (4 cases / champ cyber) permettant de tester sa réponse sans aucune modale.
- [ ] **1.3. Vignette infographie optionnelle dans la Bulle** :
  - Si `imageUrl` est renseignée : affichage d'une vignette schéma dans la bulle, agrandissable au clic.

---

### Chantier 2 : Le Cockpit d'Administration AM (`apps/admin-sosplanete-v2`)

- [ ] **2.1. Page dédiée "Easter Eggs & Énigmes SF" dans l'Admin** :
  - Entrée de menu dans l'administration (`EasterEggsManager.tsx`).
- [ ] **2.2. Onglet 1 : Paramètres Généraux de la Saison** :
  - Interrupteur général : Activer / Désactiver les Easter Eggs.
  - Fréquence de parution : toutes les $N$ périodes (défaut : 2).
  - **Nombre minimum de joueurs requis par équipe** pour remporter les points.
  - Limite des équipes gagnantes : *Toutes* (0), ou limité aux $M$ premières équipes.
- [ ] **2.3. Onglet 2 : Éditeur d'Énigmes avec Drag & Drop** :
  - Réorganisation intuitive par glisser-déposer de l'ordre de passage.
  - Formulaire de création / modification :
    - Titre, Code unique, Niveau de difficulté, Points IT.
    - Récit d'ambiance 2070 (message cryptique + indice 1).
    - **2ème indice explicite** avec son délai de déblocage paramétrable en **`hh:mm`**.
    - Upload d'infographie optionnelle.
    - Type de déclencheur parmi les 11 disponibles.
    - Réponse attendue (si mot-clé ou code).
    - Statut Actif / Inactif.
- [ ] **2.4. Onglet 3 : Cockpit de Suivi en Temps Réel (AM)** :
  - **Bouton d'ouverture manuelle** : L'AM peut ouvrir/déclencher un Easter Egg manuellement sur la période en cours.
  - Tableau dynamique d'avancement par équipe (*Équipe Air : 3/2 min. requis - 🏆 Gagné*).
  - Journal horodaté des agents découvreurs.
  - Boutons d'action rapide : clôturer manuellement, forcer le 2ème indice, relancer.

---

### Chantier 3 : La Voûte d'Étoiles 3D & Effets Visuels "WOOOW"

- [ ] **3.1. Ciel d'Étoiles & Constellation 3D interactive (`Portal2026.tsx`)** :
  - **Positionnement vertical** : Baisser la hauteur du groupe d'étoiles pour qu'au moins une des étoiles du triangle soit immédiatement visible dans le ciel lors du premier affichage du dashboard 2026.
  - **Exploration par le joueur** : Le joueur doit faire pivoter/orienter la vue 3D pour repérer les 2 autres étoiles du triangle et les rendre cliquables.
  - **Design "Étoile" Premium** : Étoiles scintillantes avec lueur (flare/croisillons lumineux) au lieu de simples sphères.
  - **Voûte céleste naturelle** : Ajouter quelques étoiles décoratives éparses dans l'espace afin que le ciel soit riche et que le triangle d'étoiles ne soit pas excessivement flagrant.
- [ ] **3.2. Effets Visuels de Victoire (Overlays temporaires de 3-4s)** :
  - Pluie digitale Matrix (`/matrix`), filtre CRT rétro Synthwave 80s (Konami Code), effet apesanteur des cartes (`/antigravity`), propulsion réacteurs sous le logo (Maintien logo), flash temporel (`/1985`).

---

### Chantier 4 : Leaderboard Détectives Temporels (dans `LeaderboardModal.tsx`)

*Pas de bouton flottant en plus : intégration directe dans la modale de classement existante.*

- [ ] **4.1. Nouvel onglet "🕵️ Détectives Temporels" dans le Leaderboard Général** :
  - Ajout d'un sélecteur d'onglet dans `LeaderboardModal.tsx`.
- [ ] **4.2. Podium Top 3 & Classement Individuel** :
  - Cartes Or, Argent, Bronze avec couronne Sherlock 2070.
  - Nombre d'énigmes résolues et points IT rapportés à l'équipe.
- [ ] **4.3. Classement Inter-Équipes** :
  - Classement des équipes ayant le meilleur taux de résolution et la plus grande vélocité.

---

### Chantier 5 : Intégration Temps Réel & Comm-Link (Sockets)

- [ ] **5.1. Pré-remplissage exact dans le Comm-Link post-découverte** :
  - Dès qu'un joueur réussit l'action secrète : le Comm-Link s'ouvre automatiquement sur le salon de son équipe avec le texte exact pré-rempli dans l'input de chat :  
    `"J'ai découvert l'enigme de l'Easter Egg ! ; reste à la résoudre"`  
    *(Le joueur n'a plus qu'à valider l'envoi).*
- [ ] **5.2. Célébration Collective & Propulsion du Vaisseau** :
  - Dès que le nombre minimum de joueurs requis est atteint dans l'équipe :
    - Bannière dorée plein écran pour tous les membres de l'équipe :  
      `"🏆 Victoire Temporelle ! +60 Points IT remportés par l'équipe [Nom Équipe] !"`
    - Émission de la propulsion du vaisseau de l'équipe sur le Radar 2070.

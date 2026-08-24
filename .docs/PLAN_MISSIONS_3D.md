# Plan d'Implémentation : Carrousel Spatial 3D des Missions (Concept 1)

Ce document décrit l'architecture et les étapes pour remplacer le panneau de missions 2D actuel par une expérience de carrousel holographique 3D, sans perdre le dashboard "Camp de Base" (Terre + Avatars).

## 1. Objectifs de l'UX/UI
- **Immersion 3D** : Remplacer le panneau `Codex` 2D plat par une vue HUD 3D avec des cartes flottantes façon "Cover Flow".
- **Navigation inter-catégories** : Ajouter un "Ruban Orbital" (barre de navigation en haut) permettant de switcher instantanément de secteur (Électricité, Eau, etc.) avec une transition cinématique de caméra.
- **Camp de Base préservé** : Le dashboard actuel (Terre + Avatars) reste la vue principale. L'ouverture des missions déclenche une "plongée" (Warp) de la caméra vers un HUD tactique.

## 2. Modifications Architecturales (Composants React)

### A. Le Composant `MissionsCarousel3D` (NOUVEAU)
Un nouveau composant qui remplacera l'onglet "Missions" classique.
- **Technologie** : HTML/CSS avancé avec `framer-motion` superposé sur la scène 3D pour garantir la netteté du texte (performances mobiles) tout en créant une illusion 3D parfaite.
- **Cartes Tactiques** : Chaque mission sera une `MissionCard3D` avec effet "tilt" interactif (réagissant au swipe), rendu "glassmorphism" et bordures néon.
- **Mécanique Cover Flow** : Calcul de la position (Z-index, Scale, TranslateX) et de l'inclinaison de chaque carte pour créer l'arc holographique.

### B. Le Composant `OrbitalSectorRibbon` (NOUVEAU)
- Barre de navigation affichée au sommet de l'écran lorsque le mode "Missions" est actif.
- Contient les icônes lumineuses des 6 secteurs.
- Permet de changer instantanément la catégorie active `selectedSector` sans fermer l'interface.

### C. Gestion de la Caméra (`Portal2026.tsx`)
- Détecter le passage en mode "Missions".
- Animer la caméra 3D depuis la position de l'Orbe (Macro) vers un point de vue "Micro" (centré, fond étoilé sombre, Terre en léger flou cinétique au loin).
- Gérer l'animation "Warp" lors du clic sur le Ruban Orbital (la caméra fait un rapide mouvement panoramique pendant que les nouvelles cartes apparaissent en cascade).

## 3. Étapes d'Implémentation Proposées

1. **Étape 1 : Création de la Fiche Mission "Premium" statique**
   - Développer le composant `MissionCard3D.tsx` isolé avec ses effets visuels (Néons, reflets, typographie futuriste).
2. **Étape 2 : Moteur de Carrousel et Ruban de Navigation**
   - Implémenter le ruban supérieur `OrbitalSectorRibbon`.
   - Connecter la liste des missions au `MissionsCarousel3D` avec la gestion du swipe mobile fluide.
3. **Étape 3 : Transition de Caméra 3D et États Globaux**
   - Modifier `Portal2026` pour la transition d'ouverture (zoom in) et de fermeture (zoom out vers les Avatars).
4. **Étape 4 : Animations de Gameplay**
   - Connecter le bouton "Impulser" et créer l'effet d'énergie/particules lors de la complétion d'une mission.

## 4. Questions Ouvertes (Espace pour vos annotations)

💡 *Vous pouvez annoter directement ci-dessous pour valider ou ajuster ces détails.*

- [ ] **Technologie de Rendu** : Recommandez-vous de faire les cartes en HTML/CSS surpuissant (Framer Motion) par-dessus la 3D (meilleur pour la lisibilité sur mobile), ou en pur 3D WebGL (Three.js) ? *(Recommandation : HTML/CSS superposé).*
  - *Votre annotation :* ...

- [ ] **Effet de Changement de Secteur** : Lorsqu'on clique sur le Ruban Supérieur pour passer de l'Eau à l'Électricité, voulez-vous que la Terre pivote en arrière-plan, ou juste un effet "Glitch/Warp" ultra rapide sur les cartes ?
  - *Votre annotation :* ...

- [ ] **Bouton Impulser** : Doit-il déclencher un flash de lumière plein écran avant de marquer la mission "Terminée" et de revenir au dashboard, ou voulez-vous rester dans le carrousel pour enchaîner les missions ?
  - *Votre annotation :* ...

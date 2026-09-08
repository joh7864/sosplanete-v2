# 🕵️ Plan d'Implémentation Complet : Easter Eggs SF "Sherlock 2070" (Zéro Modale)

> **Dernière mise à jour :** 06 Septembre 2026  
> **Arbitrage Clé :** ZÉRO MODALE. Toute l'expérience repose sur l'interaction avec le **micro-œuf du HUD**, les apparitions de la **Mascotte 3D (Groot sur hoverboard)**, et le **Comm-Link**.

---

## 🎯 1. Parcours Joueur & Mécanique à 100% dans l'Univers 3D

```mermaid
graph TD
    A["Étape 1 : Micro-œuf initial BLEUTÉ (#38bdf8)"] -->|Prérequis remplis en sous-marin| B["Étape 1b : Œuf cliquable (Reste BLEUTÉ, zéro indicateur visuel)"]
    B -->|1er Clic Joueur| C["Mascotte 3D arrive : Message Lore + 1er Indice (Bulle BD)"]
    C --> D["Démarrage Minuteur Masqué (firstInteractionAt)"]
    D --> E["Œuf passe en ORANGE (#f97316) : 'Enquête en cours'"]
    E -->|Actions désimpulsées par le joueur| A
    E -->|Le joueur explore par lui-même| F{"Le joueur reclique sur l'œuf"}
    F -->|Temps NON écoulé| G["Mascotte revient : Message Lore + 1er Indice (Rappel)"]
    F -->|Temps ÉCOULÉ (hh:mm)| H["Mascotte revient : 2ème INDICE EXPLICITE (Sans trahir la réponse)"]
    E -->|Déclencheur trouvé ou bon code PIN| I["Effet WOOOW individuel + Œuf passe au VERT (#10b981)"]
    I --> J["Comm-Link s'ouvre pré-formaté sur le salon privé de l'équipe"]
    J --> K{"Nombre minimum de joueurs atteint dans l'équipe ?"}
    K -->|Non (< min. joueurs)| L1["0 Point IT pour l'instant — Le joueur alerte son équipe pour atteindre le quota"]
    K -->|Oui (>= min. joueurs)| L2["Attribution des Points IT d'équipe + Halo doré & Célébration collective"]
    L2 --> M["Propulsion du vaisseau sur le Radar 2070"]
    E -->|Fin de période sans découverte individuelle| N["L'œuf reste Orange pour ce joueur"]
    N --> P{"Au moins un joueur de toute l'instance a trouvé le déclencheur ?"}
    P -->|Non (0 découverte globale)| Q1["Easter Egg non consommé : reconduit automatiquement par défaut pour la période suivante (ou ordre AM)"]
    P -->|Oui (>= 1 découverte)| Q2["Easter Egg consommé : passage à l'Easter Egg suivant au cycle suivant"]
```

### Les 4 États Visuels & Cycle de Vie de l'Œuf dans le HUD :

1. **État 1 — Initial & Totalement Silencieux (Bleuté `#38bdf8`)** :
   - **Avant les prérequis** : Micro-œuf bleuté inerte, clic muet, curseur normal (`default`).
   - **Quand les prérequis sont remplis** : L'œuf **reste strictement bleuté** ! Aucune pastille rouge `!`, aucun tooltip, aucune animation trahissant la complétion. C'est au joueur de penser par lui-même à cliquer. Seul le curseur se transforme en main (`pointer`) au survol.
   - **Invalidation en cas de désimpulsion** : Si le joueur annule/désimpulse ses actions et ne satisfait plus les prérequis, l'état retombe immédiatement à l'initial (œuf inerte, réinitialisation de l'avancement pour ne pas conserver d'indice débloqué illégitimement).

2. **État 2 — Enquête en cours (Orange `#f97316`)** :
   - Déclenché au **1er clic** effectif du joueur (avec prérequis valides).
   - La Mascotte 3D arrive au centre avec le message d'archive 2070 et le **1er indice** (schéma de déduction).
   - L'œuf passe en **orange** et le reste.
   - Le chrono masqué `firstInteractionAt` démarre en coulisses.
   - **Règle stricte** : **aucun changement visuel supplémentaire**, même quand le minuteur expire. L'initiative revient entièrement au joueur de recliquer sur l'œuf.
     - *Reclic avant expiration* : la mascotte revient et réaffiche le message initial + indice 1 (rappel).
     - *Reclic après expiration (`hh:mm`)* : la mascotte revient avec le **2ème indice explicite** dans sa bulle (orientant la déduction sans donner directement la solution).

3. **État 3 — Résolu par le joueur (Vert `#10b981`)** :
   - Dès que le joueur découvre le déclencheur ou saisit la bonne combinaison :
     - Animation de validation individuelle et l'œuf passe au **vert**.
     - Le **Comm-Link s'ouvre automatiquement pré-formaté sur le salon privé de son équipe** (`team`).
     - **Attribution des points IT conditionnée au quota d'équipe** :
       - Si le quota minimum de joueurs de l'équipe n'est **pas encore atteint** : aucun point IT n'est distribué immédiatement (`0 IT`). Le message pré-formaté invite ses coéquipiers à valider à leur tour :  
         `"J'ai trouvé la solution du Cadenas 2070 ! Venez vite valider votre code pour débloquer les points IT de l'équipe ! 🚀"`
       - Dès que le quota minimum de joueurs de l'équipe est **atteint** : attribution collective des points IT (`+60 IT`), halo doré d'équipe sur l'œuf et bannière de célébration.

4. **État 4 — Fin de Période & Règle de Reconduction Automatique** :
   - Si un joueur n'a pas trouvé le déclencheur avant la clôture de la période, son œuf reste **orange**.
   - **Reconduction automatique par défaut** : Si **aucun joueur de toute l'instance/promo (toutes équipes confondues, même hors de son équipe)** n'a découvert le déclencheur de l'Easter Egg, cet Easter Egg est considéré comme **non consommé**. Il est alors **automatiquement reconduit pour la période suivante par défaut** (ou selon la priorité réordonnée par l'AM dans le back-office).

5. **Règles Spécifiques Périodes & Multi-Énigmes** :
   - **Absence d'Easter Egg sur la période** : Si aucun Easter Egg n'est actif ou programmé pour la période en cours (paramètres généraux désactivés, période clôturée manuellement par l'AM sans énigme, ou catalogue inactif), **le micro-œuf n'apparaît absolument pas dans le HUD** (`SciFiEggBadge` retourne `null`, aucun artefact ni mascotte dans le DOM).
   - **Multi-Easter Eggs sur la même période** : Si l'AM active plusieurs Easter Eggs sur une même période (ex: ajout d'une énigme supplémentaire via le cockpit), les joueurs progressent de manière **séquentielle** :
     - Le joueur découvre et interagit avec la 1ère énigme active de la période.
     - **Dès que la première est résolue par le joueur, le système bascule automatiquement sur la suivante** pour ce joueur.
     - Dès que toutes les énigmes de la période sont résolues, le joueur conserve l'état résolu (œuf vert).
   - **Fréquence de parution (Cycle de 2 périodes)** : Par défaut, on ne passe à l'Easter Egg suivant du catalogue automatique que toutes les 2 périodes (paramétrable dans l'admin), sauf demande explicite ou forçage de l'AM.

---

## 📊 2. Synthèse de l'Avancement

| Module / Périmètre | Statut | Avancement | Composants & Fichiers |
| :--- | :---: | :---: | :--- |
| **1. Modélisation & Base de Données** | ✅ Terminé | **100%** | Prisma Schema, Migrations PostgreSQL, Seeds |
| **2. API Backend (Joueur & Admin)** | ✅ Terminé | **100%** | `easter-egg.controller.ts`, `easter-egg.service.ts` |
| **3. Badge HUD & Mascotte 3D** | ✅ Terminé | **100%** | `SciFiEggBadge.tsx`, `MascotBubble3D.tsx`, `App.tsx` |
| **4. Système de Déclencheurs (11 Triggers)** | ✅ Terminé | **100%** | `useEasterEggTriggers.ts`, `Portal2026.tsx`, `ChatPanel.tsx` |
| **5. Minuteur du 2ème Indice & Reclic Œuf** | ✅ Terminé | **100%** | Reclic joueur, timer masqué, 2ème indice non spoil, Comm-Link branché |
| **6. Effets Visuels & Ciel d'Étoiles 3D** | ✅ Terminé | **100%** | Voûte céleste 3D, triangle d'exploration, overlays WOOOW personnalisés |
| **7. Leaderboard Détectives (dans Leaderboard)** | 🔴 À Faire | **20%** | Endpoint backend OK, **Onglet à ajouter dans `LeaderboardModal.tsx`** |
| **8. Administration & Cockpit AM** | ✅ Terminé | **100%** | Page dédiée AM, éditeur catalogue DnD, cockpit temps réel |
| **9. Temps Réel (Sockets & Comm-Link)** | 🟡 En cours | **60%** | Pré-remplissage Comm-Link OK, notifications Sockets équipe à finaliser |

---

## 🔴 3. Plan d'Action Détaillé

### Chantier 1 : La Mécanique du Minuteur, de l'Œuf & Saisie dans la Bulle

- [x] **1.1. Logique de Reclic sur l'Œuf & Couleurs Stricte (`App.tsx` / `SciFiEggBadge.tsx` / `easter-egg.service.ts`)** :
  - **Couleur initiale Bleutée (`#38bdf8`)** : maintenue avant et après remplissage des prérequis. Zéro pastille rouge `!`, zéro tooltip. Seul le curseur passe en main au survol.
  - **Passage à l'Orange (`#f97316`)** : uniquement après le 1er clic effectif d'ouverture du lore.
  - **Désimpulsion d'actions** : invalidation immédiate, réinitialisation de `firstInteractionAt` en base et verrouillage du 2ème indice.
  - **Aucune altération visuelle de l'œuf à l'expiration du temps** : initiative totale au joueur pour recliquer.
  - **2ème indice explicite affiné** : guide la déduction (élimination des chiffres 9, 5, 1, 3 via règle 4) sans trahir directement la solution `"4207"`.
- [x] **1.2. Énigmes à Code / Cadenas : Saisie Compacte dans la Bulle** :
  - Intégré directement au bas de la bulle de BD de la mascotte : pavé 4 cases PIN cyber, shake erreur, validation API en direct.
- [x] **1.3. Vignette infographie non-modale & Centrage** :
  - Panneau de déduction positionné à droite de la bulle, centré verticalement (`top: 50%`, `y: -50%`, `left: calc(100% + 18px)`), cohabitant sans bloquer la bulle de BD.
- [x] **1.4. Quota d'Équipe & Ouverture Comm-Link (`App.tsx`)** :
  - Les points IT sont attribués **uniquement si le quota de joueurs de l'équipe est atteint**.
  - Le Comm-Link s'ouvre automatiquement sur le salon d'équipe avec le message pré-rempli invitant l'équipe à valider.
- [x] **1.5. Règle de Reconduction Inter-Périodes (`easter-egg.service.ts`)** :
  - Vérification des découvertes globales sur toute la promo/instance : si `globalDiscoveriesCount === 0`, report automatique de l'œuf non consommé sur la période suivante par défaut (ou selon réorganisation AM).

---

### Chantier 2 : Le Cockpit d'Administration AM (`apps/admin-sosplanete-v2`)

- [x] **2.1. Page dédiée "Easter Eggs & Énigmes SF" dans l'Admin** :
  - Entrée de menu dans l'administration (`DashboardLayout.tsx`) avec icône étincelles `Sparkles`.
  - Page principale dédiée `apps/admin-sosplanete-v2/src/app/dashboard/easter-eggs/page.tsx` avec barre d'onglets intuitive et intégration `TopBar`.
- [x] **2.2. Onglet 1 : Paramètres Généraux de la Saison (`EasterEggsSeasonSettings.tsx`)** :
  - Interrupteur général : Activer / Désactiver les Easter Eggs.
  - Fréquence de parution : toutes les $N$ périodes (défaut : 2).
  - **Nombre minimum de joueurs requis par équipe** pour remporter les points IT (stepper interactif avec badge esprit d'équipe).
  - Limite des équipes gagnantes : *Toutes* (0), ou limité aux $M$ premières équipes (1, 2, 3...).
  - Synthèse visuelle de la configuration et notification de sauvegarde en direct.
- [x] **2.3. Onglet 2 : Éditeur d'Énigmes avec Drag & Drop (`EasterEggsCatalogEditor.tsx` & `EasterEggFormModal.tsx`)** :
  - Réorganisation fluide par glisser-déposer de l'ordre de passage avec `@dnd-kit` et mise à jour persistante via `POST /evoe/easter-eggs/admin/catalog/reorder`.
  - Formulaire de création / modification complet :
    - Titre, Code unique, Niveau de difficulté (4 paliers colorés), Points IT (+10 à +500).
    - Récit d'ambiance 2070 (message cryptique).
    - **2ème indice explicite** avec son délai de déblocage paramétrable en **`hh:mm`** (heures et minutes converties dynamiquement).
    - Upload d'infographie / schéma visuel déductif via `POST /evoe/easter-eggs/admin/upload-image`.
    - Type de déclencheur parmi les 11 types (avec icônes et descriptions exhaustives).
    - Réponse attendue (code secret ou mot-clé) avec sensibilité à la casse.
    - Statut Actif / Inactif.
- [x] **2.4. Onglet 3 : Cockpit de Suivi en Temps Réel (AM) (`EasterEggsTrackingCockpit.tsx`)** :
  - **Bouton d'ouverture manuelle** : Modale de sélection rapide pour déclencher immédiatement n'importe quelle énigme du catalogue sur la période en cours (`POST /evoe/easter-eggs/admin/open-instance`).
  - Tableau dynamique d'avancement par équipe (*Équipe Air : 1/2 min. requis - En attente*, *Équipe Feu : 2/2 min. requis - Quota validé ! +60 IT*), avec jauge de progression animée et rang d'arrivée.
  - Journal horodaté des agents découvreurs (avatar, pseudo, équipe avec pastille de couleur, heure exacte, temps de résolution et code soumis).
  - Boutons d'action rapide : clôturer manuellement l'œuf en cours (`POST /evoe/easter-eggs/admin/close-instance`), forcer le 2ème indice pour toute la promo (`POST /evoe/easter-eggs/admin/force-hint`), rafraîchissement temps réel automatique toutes les 15s.

---

### Chantier 3 : La Voûte d'Étoiles 3D & Effets Visuels "WOOOW"

- [x] **3.1. Ciel d'Étoiles & Constellation 3D interactive (`Portal2026.tsx`)** :
  - **Positionnement vertical** : Baisser la hauteur du groupe d'étoiles pour qu'au moins une des étoiles du triangle soit immédiatement visible dans le ciel lors du premier affichage du dashboard 2026.
  - **Exploration par le joueur** : Le joueur doit faire pivoter/orienter la vue 3D pour repérer les 2 autres étoiles du triangle et les rendre cliquables.
  - **Design "Étoile" Premium** : Étoiles scintillantes avec lueur (flare/croisillons lumineux) au lieu de simples sphères.
  - **Voûte céleste naturelle** : Ajouter quelques étoiles décoratives éparses dans l'espace afin que le ciel soit riche et que le triangle d'étoiles ne soit pas excessivement flagrant.
  - **Curseur discret & Secret préservé** : Curseur `auto` naturel maintenu au survol des étoiles (aucun curseur 'main' trahissant l'emplacement au balayage souris).
- [x] **3.2. Effets Visuels de Victoire (Overlays temporaires de 3-4s)** :
  - Pluie digitale Matrix (`!matrix` ou `/matrix`), filtre CRT rétro Synthwave 80s (Konami Code), effet apesanteur des cartes (`!antigravity`), propulsion réacteurs sous le logo (Maintien logo), flash temporel (`!1985`), soirée disco orbitale (`!party`).
  - Interception prioritaire dans le chat : zéro message rouge d'erreur socket, nettoyage automatique de l'input.
- [x] **3.3. Gestion Multi-Easter Eggs sur la Période — Proposition 2 (Anneaux Orbitaux d'Énergie)** :
  - **HUD Badge (`SciFiEggBadge.tsx`)** : Anneaux concentriques d'énergie gyroscopiques orbitant autour de l'œuf (1 anneau par énigme de la période : vert émeraude fixe pour les résolues, pointillé en rotation quantique pour l'énigme active en cours).
  - **Bulle BD Mascotte (`MascotBubble3D.tsx`)** : Badge informatif `⚡ Anomalie X / Y` affiché dans l'en-tête de l'énigme active.
  - **Backend (`easter-egg.service.ts`)** : Calcul et envoi synchronisé de `multiEggProgress: { total, solved, currentIndex }`.

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

- [x] **5.1. Pré-remplissage exact dans le Comm-Link post-découverte** :
  - Dès qu'un joueur réussit l'action secrète ou le code PIN : le Comm-Link s'ouvre automatiquement sur le salon privé de son équipe (`team`) avec le texte pré-formaté.
- [ ] **5.2. Célébration Collective & Propulsion du Vaisseau** :
  - Dès que le nombre minimum de joueurs requis est atteint dans l'équipe :
    - Bannière dorée plein écran pour tous les membres de l'équipe :  
      `"🏆 Victoire Temporelle ! +60 Points IT remportés par l'équipe [Nom Équipe] !"`
    - Émission de la propulsion du vaisseau de l'équipe sur le Radar 2070.

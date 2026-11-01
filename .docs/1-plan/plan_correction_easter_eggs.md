# Plan de Correction et d'Amélioration — Système Easter Eggs (v3.0)

> **Projet** : SOS Planète v2 (`sosplanete-v2`)  
> **Date** : 1er novembre 2026 (Version 3.1 — Implémentation complétée et vérifiée)  
> **Statut** : Implémenté et validé (Builds Backend & Frontend Admin réussis)  
> **Fichier local** : [`.docs/1-plan/plan_correction_easter_eggs.md`](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/.docs/1-plan/plan_correction_easter_eggs.md)  
> **Cahier de recette cible** : [`.docs/5-tests/cahier_recette_evoe.md`](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/.docs/5-tests/cahier_recette_evoe.md) & [`.docs/5-tests/cahier_recette_admin.md`](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/.docs/5-tests/cahier_recette_admin.md)

---

## Sommaire
1. [Contexte & Problématique Initiale](#1-contexte--problématique-initiale)
2. [Éclaircissements Clés sur vos Interrogations](#2-éclaircissements-clés-sur-vos-interrogations)
   - [2.1. WebSocket vs Découverte par les Joueurs : Levée d'ambiguïté](#21-websocket-vs-découverte-par-les-joueurs--levée-dambiguïté)
   - [2.2. Périmètre strict de la refonte des icônes : 100% Administration](#22-périmètre-strict-de-la-refonte-des-icônes--100-administration)
   - [2.3. Visibilité de tous les œufs non découverts dans l'Administration](#23-visibilité-de-tous-les-œufs-non-découverts-dans-ladministration)
3. [Nouvelle Fonctionnalité : Onglet "Chrono-Frise" dans l'Administration](#3-nouvelle-fonctionnalité--onglet-chrono-frise-dans-ladministration)
4. [Analyse Approfondie des Dysfonctionnements](#4-analyse-approfondie-des-dysfonctionnements)
   - [4.1. Non-visibilité en direct (reconnexion obligatoire)](#41-non-visibilité-en-direct-reconnexion-obligatoire)
   - [4.2. L'option "Ajouter" remplace au lieu de cumuler](#42-loption-ajouter-remplace-au-lieu-de-cumuler)
   - [4.3. Règle Métier : Report d'œufs non résolus Équipe par Équipe](#43-règle-métier--report-dœufs-non-résolus-équipe-par-équipe)
   - [4.4. Autres faiblesses identifiées](#44-autres-faiblesses-identifiées)
5. [Plan d'Implémentation Détaillé par Étape](#5-plan-dimplémentation-détaillé-par-étape)
   - [Étape 1 : Moteur de Résolution des Œufs & Report par Équipe (Backend)](#étape-1--moteur-de-résolution-des-œufs--report-par-équipe-backend)
   - [Étape 2 : Sécurisation de l'Ajout Manuel & Clôture Unitaire (Backend)](#étape-2--sécurisation-de-lajout-manuel--clôture-unitaire-backend)
   - [Étape 3 : API Chrono-Frise pour l'Administration (Backend)](#étape-3--api-chrono-frise-pour-ladministration-backend)
   - [Étape 4 : Diffusion Temps Réel Silencieuse par Salon d'Instance (Backend)](#étape-4--diffusion-temps-réel-silencieuse-par-salon-dinstance-backend)
   - [Étape 5 : Écoute Réactive & Rafraîchissement Intelligent (Frontend Joueur)](#étape-5--écoute-réactive--rafraîchissement-intelligent-frontend-joueur)
   - [Étape 6 : Rendu Visuel du Badge & Glyphes Multiples (Frontend Joueur)](#étape-6--rendu-visuel-du-badge--glyphes-multiples-frontend-joueur)
   - [Étape 7 : Nouvel Onglet "Chrono-Frise" & Refonte Icônes Cockpit (Frontend Admin)](#étape-7--nouvel-onglet-chrono-frise--refonte-icônes-cockpit-frontend-admin)
6. [Cahier de Recette & Plan de Tests Dédié (`EPIC-EasterEggs`)](#6-cahier-de-recette--plan-de-tests-dédié-epic-eastereggs)

---

## 1. Contexte & Problématique Initiale

Dans le cadre du jeu **SOS Planète (EVOE)**, le système des Easter Eggs apporte une dimension ludique, narrative et collaborative. Cependant, plusieurs blocages et besoins d'évolutions ont été identifiés :

1. **Visibilité temps réel** : Quand l'administrateur ajoute ou active un Easter Egg, les élèves connectés ne peuvent pas participer sans se déconnecter et se reconnecter.
2. **Ajout multi-œufs instable** : L'option "Ajouter" remplace parfois l'œuf existant au lieu de s'y cumuler, nécessitant de répéter l'opération.
3. **Report inter-périodes équipe par équipe** : Un œuf non résolu par une équipe lors d'une période passée doit être automatiquement reporté sur la période suivante pour cette équipe. Les équipes ont ainsi un suivi individualisé de leurs anomalies en attente.
4. **Visibilité Admin de l'historique de saison** : Besoin d'un onglet **"Chrono-Frise"** dans l'administration pour voir d'un coup d'œil quelles équipes ont découvert quels œufs tout au long de la saison.
5. **Ergonomie Admin** : Rendre les icônes d'action du cockpit de pilotage explicites et sans ambiguïté.

---

## 2. Éclaircissements Clés sur vos Interrogations

### 2.1. WebSocket vs Découverte par les Joueurs : Levée d'ambiguïté

> **Votre question** : *"Cela me parait contraire au fait que les oeufs doivent être découverts par les joueurs. Ai-je mal compris ce que tu comptes faire ?"*

**Réponse rassurante et explicite :**
* **L'œuf n'est JAMAIS révélé ni résolu pour l'élève via le WebSocket !**
* Le signal WebSocket proposé est **strictement silencieux et invisible** pour l'élève.
* **Que fait ce signal ?**
  Il envoie simplement au navigateur du joueur le message technique suivant : *"Une session d'Easter Egg est active sur votre période. Initialise les écouteurs du jeu (clavier Konami, clics secrets sur la carte 3D, saisie du code dans la bulle mascotte, diodes du badge HUD)"*.
* **Pourquoi est-ce indispensable ?**
  Actuellement, si un élève est déjà connecté sur son ordinateur et que l'enseignant active un œuf, le jeu de l'élève **ignore complètement** qu'un œuf est disponible. L'élève peut taper le Konami Code ou chercher partout : **rien ne se déclenche** tant qu'il n'a pas quitté et réouvert sa session !
* **Conclusion** :
  Le signal WebSocket permet simplement **d'ouvrir la chasse aux œufs en direct**. L'énigme reste totalement mystérieuse, non résolue (`isDiscovered: false`), et ce sont bien les joueurs qui doivent chercher, enquêter et trouver la solution.

---

### 2.2. Périmètre strict de la refonte des icônes : 100% Administration

> **Votre question** : *"La refonte des icônes d'actions concerne l'administration, pas le frontend EVOE ; on est d'accord ?"*

**Réponse :**
* **Oui, 100% d'accord !**
* Cette amélioration concerne **exclusivement l'interface d'administration** ([`apps/admin-sosplanete-v2/src/components/easter-eggs/EasterEggsTrackingCockpit.tsx`](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/admin-sosplanete-v2/src/components/easter-eggs/EasterEggsTrackingCockpit.tsx#L640-L680)).
* Dans ce cockpit, les boutons actuels pour l'administrateur utilisaient des icônes génériques (`StopCircle` pour clôturer, `Eye` pour forcer l'indice, `RotateCcw` pour réinitialiser) qui manquaient de lisibilité.
* Le frontend joueur EVOE (passerelle 2026/2070, mascotte 3D, design SF) reste strictement intact dans son identité visuelle d'origine.

---

### 2.3. Visibilité de tous les œufs non découverts dans l'Administration

> **Votre remarque** : *"Dans l'admin on visualise donc tous les œufs non découverts"*

**Réponse :**
* **Absolument.** Avec la règle du report équipe par équipe :
  - **Dans le Cockpit Admin (vue en direct)** : Chaque équipe affichera la liste de ses œufs en cours de recherche (l'œuf de la période actuelle + tous les œufs reportés des périodes passées qui n'ont pas encore été résolus par cette équipe).
  - **Dans le nouvel onglet "Chrono-Frise" Admin** : L'administrateur aura la matrice complète de la saison : pour chaque période et chaque œuf, il verra quelles équipes l'ont découvert (avec horodatage et points) et quelles équipes l'ont encore en statut non découvert / reporté.

---

## 3. Nouvelle Fonctionnalité : Onglet "Chrono-Frise" dans l'Administration

> **Votre demande** : *"J'aimerais rajouter dans l'administration un onglet 'Chrono Frise' entre l'onglet 'Catalogue & ordre' et l'onglet 'Paramètres saison' avec la chrono-frise du front end adaptée en terme de couleur aux couleurs de l'administration. L'objectif est de voir quelles équipes ont trouvé quels œufs dans le jeu."*

### 3.1. Emplacement et Navigation
Dans [`apps/admin-sosplanete-v2/src/app/dashboard/easter-eggs/page.tsx`](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/admin-sosplanete-v2/src/app/dashboard/easter-eggs/page.tsx#L160-L164), la barre d'onglets comportera 4 onglets :
```typescript
const tabs = [
  { id: 'cockpit', label: 'Cockpit & Leaderboard', icon: Radar },
  { id: 'catalog', label: 'Catalogue & Ordre', icon: Sparkles },
  { id: 'chrono-frise', label: 'Chrono-Frise & Archives', icon: History }, // <-- NOUVEL ONGLET
  { id: 'settings', label: 'Paramètres Saison', icon: Sliders },
];
```

### 3.2. Design et Adaptation aux Couleurs de l'Administration
Contrairement au modal sombre SF du front élève (`#030712` avec reflets cosmiques), le composant admin [`EasterEggsChronoFrise.tsx`](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/admin-sosplanete-v2/src/components/easter-eggs/EasterEggsChronoFrise.tsx) adoptera la charte graphique lumineuse et épurée de l'administration SOS Planète :
* **Cartes `GlassCard` claires** : fond blanc/ardoise très légère, bordures subtiles (`border-slate-200/80`), typographie soignée Inter/Outfit.
* **Ruban chronologique interactif** : frise horizontale ou verticale découpée par cycles de 2 semaines (Cycles 1 à 23).
* **Par période / cycle** :
  - En-tête avec numéro de cycle, dates de la période, glyphe 2070 miniaturisé et titre de l'œuf programmé.
  - **Matrice des Équipes** :
    - Équipes ayant validé l'œuf : Badge vert émeraude (`bg-emerald-50 text-emerald-700 border-emerald-200`) avec coche, rang (ex: `1er 🏆`), heure de validation et points IT attribués.
    - Équipes n'ayant pas encore trouvé : Badge ambre/ardoise (`bg-amber-50 text-amber-700 border-amber-200` ou gris ardoise) indiquant *"Non découvert (reporté)"*.
  - Barre de progression globale du cycle : ex. `3/5 équipes ont résolu l'énigme`.

---

## 4. Analyse Approfondie des Dysfonctionnements

### 4.1. Non-visibilité en direct (reconnexion obligatoire)
* **Frontend élève** : `useEasterEgg.ts` n'appelle `fetchActiveEgg()` qu'au montage (`useEffect([childId, instanceId])`). Aucun écouteur socket ni réactivation au focus d'onglet.
* **Backend** : `openInstanceEgg`, `closeInstanceEgg`, `forceInstanceHint` n'émettent aucun socket. Les élèves ne rejoignent pas de salon `instance_${instanceYearId}`.

### 4.2. L'option "Ajouter" remplace au lieu de cumuler
* **Conflit DB** : Au début d'une période, l'Œuf A provient du calcul automatique (0 enregistrement en table `EvoeEasterEggInstance`).
* Lors de l'ajout d'un Œuf B (`closePrevious = false`), le serveur enregistre l'Œuf B. Mais comme l'Œuf A n'a jamais été sauvé en base, la table contient `[Oeuf B]`.
* `resolveEggForInstance` lit la table, voit `activeInstances.length > 0`, ignore le calcul naturel et renvoie uniquement l'Œuf B : l'Œuf A a disparu !
* Répéter l'opération pour ré-ajouter l'Œuf A crée enfin une ligne en base pour l'Œuf A, ce qui fait fonctionner le multi-œufs.

### 4.3. Règle Métier : Report d'œufs non résolus Équipe par Équipe
* Un œuf d'une période passée qui n'a pas été validé par une équipe (absence de `EvoeEasterEggTeamReward` pour cette équipe) doit **rester actif et être reporté** sur les périodes suivantes pour cette équipe.
* Le calcul de disponibilité des œufs doit donc s'effectuer **par équipe**, de manière individualisée.

### 4.4. Autres faiblesses identifiées
* **Ciblage de trigger dans `validateTrigger`** : Omission du filtre `!e.isDiscovered`, bloquant la validation de la 2ème énigme si la 1ère a été résolue.
* **Erreur 404 backend sur cycle automatique** : Dans `validateTrigger`, si aucun ID d'œuf n'est envoyé, le backend ne cherche que dans les instances physiques en base.
* **Listes de découvreurs vides en mode naturel** : `periodActiveEggs` renvoyait des listes vides par défaut dans `getAdminTracking`.

---

## 5. Plan d'Implémentation Détaillé par Étape

### Étape 1 : Moteur de Résolution des Œufs & Report par Équipe (Backend)
**Fichier** : [`apps/backend-v2/src/modules/stimulation/evoe/easter-egg.service.ts`](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/backend-v2/src/modules/stimulation/evoe/easter-egg.service.ts)

* **Action 1.1 — Détection des œufs reportés non résolus par équipe (`resolveEggForInstance`)** :
  - Quand `childId` est fourni :
    1. Récupérer l'équipe de l'élève (`teamId`).
    2. Récupérer toutes les périodes antérieures de la saison (`startDate < currentPeriod.startDate`).
    3. Pour chaque période passée ayant un œuf (automatique ou forcé) : vérifier si un enregistrement `EvoeEasterEggTeamReward` existe pour `teamId` et cet œuf.
    4. Si **aucun** `EvoeEasterEggTeamReward` n'existe (l'équipe n'a pas résolu l'énigme) et que l'œuf n'a pas été explicitement clôturé : l'ajouter dans la liste des œufs actifs de l'élève avec le flag `isRollover: true`.
* **Action 1.2 — Cumul harmonieux** :
  - L'élève reçoit dans `cycleEggs` la liste : `[ ...œufs_reportés_non_résolus, ...œufs_période_courante ]`.
  - La progression individuelle de l'élève (`isDiscovered`, `discoveredAt`) est attachée à chaque œuf.

---

### Étape 2 : Sécurisation de l'Ajout Manuel & Clôture Unitaire (Backend)
**Fichier** : [`apps/backend-v2/src/modules/stimulation/evoe/easter-egg.service.ts`](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/backend-v2/src/modules/stimulation/evoe/easter-egg.service.ts)

* **Action 2.1 — Matérialisation automatique lors de l'ajout (`openInstanceEgg`)** :
  - Si `closePrevious === false` (mode "Ajouter") :
    - Vérifier si des instances ouvertes existent déjà en table `EvoeEasterEggInstance` pour la période courante.
    - Si **aucune instance n'existe** : calculer quel était l'œuf actif du cycle naturel et le matérialiser en base (`isClosed: false`, `unlockedAt: now`, `forceHint: false`).
    - Insérer ensuite l'œuf sélectionné par l'admin (`isClosed: false`).
    - *Résultat* : Aucun œuf ne disparaît, le cumul fonctionne dès le 1er essai sans répétition.
* **Action 2.2 — Clôture unitaire sans effet de bord (`closeInstanceEgg`)** :
  - Si `easterEggId` est fourni : ne clôturer que cet œuf spécifique (`isClosed: true, closedAt: now`). Les autres œufs de la période restent ouverts et actifs.
* **Action 2.3 — Consolidation des données découvreurs (`getAdminTracking`)** :
  - Réinjecter les vraies découvertes de la période dans `periodActiveEggs` même pour l'œuf du cycle automatique.

---

### Étape 3 : API Chrono-Frise pour l'Administration (Backend)
**Fichiers** : [`easter-egg.service.ts`](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/backend-v2/src/modules/stimulation/evoe/easter-egg.service.ts) & [`easter-egg.controller.ts`](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/backend-v2/src/modules/stimulation/evoe/easter-egg.controller.ts)

* **Action 3.1 — Création de la méthode `getAdminChronoFrise(instanceYearId: number)`** :
  - Récupère l'ensemble des cycles/périodes de la saison de l'instance.
  - Récupère toutes les équipes de l'instance (`instanceYear.teams`).
  - Pour chaque cycle :
    - Détermine l'œuf associé (ou les œufs multiples).
    - Détermine pour chaque équipe son statut :
      - `SOLVED` : Équipe ayant trouvé l'œuf (avec `completedAt`, `rank`, `pointsIT`).
      - `ROLLED_OVER` : Équipe n'ayant pas trouvé l'œuf sur un cycle passé (œuf reporté actif).
      - `IN_PROGRESS` : Cycle en cours, en attente de découverte.
      - `LOCKED` : Cycle futur.
* **Action 3.2 — Route API Dédiée** :
  - `GET /evoe/easter-eggs/admin/chrono-frise/:instanceYearId`

---

### Étape 4 : Diffusion Temps Réel Silencieuse par Salon d'Instance (Backend)
**Fichiers** : [`chat.gateway.ts`](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/backend-v2/src/modules/stimulation/chat.gateway.ts) & [`easter-egg.service.ts`](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/backend-v2/src/modules/stimulation/evoe/easter-egg.service.ts)

* **Action 4.1 — Inscription au salon d'instance** :
  - Dans `handleConnection` : `await client.join('instance_' + instanceYearId);`.
* **Action 4.2 — Émission du signal silencieux** :
  - À la fin de `openInstanceEgg`, `closeInstanceEgg`, `forceInstanceHint`, `updateSettings` :
    ```typescript
    this.chatGateway?.broadcastEasterEggUpdate(instanceYearId, { event: 'updated' });
    ```
  - *Rappel crucial* : Ce signal ne dévoile rien aux joueurs ; il invite simplement leur jeu à synchroniser la présence d'une énigme en arrière-plan.

---

### Étape 5 : Écoute Réactive & Rafraîchissement Intelligent (Frontend Joueur)
**Fichiers** : [`useChatSocket.ts`](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/evoe-frontend/src/hooks/useChatSocket.ts) & [`useEasterEgg.ts`](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/evoe-frontend/src/hooks/useEasterEgg.ts)

* **Action 5.1 — Réception de l'événement** :
  - Dès réception de `easter_egg:updated`, déclencher `fetchActiveEgg(true)` en tâche de fond.
* **Action 5.2 — Rafraîchissement au focus d'onglet** :
  - Ajouter des écouteurs sur `window.addEventListener('focus')` et `document.addEventListener('visibilitychange')`.
* **Action 5.3 — Correction du filtre de trigger** :
  - Ajouter `!e.isDiscovered` dans `validateTrigger` pour éviter toute collision en mode multi-œufs.

---

### Étape 6 : Rendu Visuel du Badge & Glyphes Multiples (Frontend Joueur)
**Fichiers** : [`SciFiEggBadge.tsx`](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/evoe-frontend/src/components/ui/SciFiEggBadge.tsx) & [`MascotBubble3D.tsx`](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/evoe-frontend/src/components/ui/MascotBubble3D.tsx)

* **Action 6.1 — Badge HUD SF** :
  - Si l'équipe a plusieurs œufs actifs (`totalCount > 1`) : afficher des points de diodes néon au sommet du badge indiquant le nombre d'anomalies en cours.
  - La gravure du glyphe 2070 progresse selon `solvedCount / totalCount`.
* **Action 6.2 — Sélecteur d'Anomalie dans la Bulle 3D** :
  - Onglets en en-tête de la bulle (`[ ⚡ Anomalie P1 (Reportée) ] [ ⚡ Anomalie P2 (En cours) ]`) pour basculer facilement d'une énigme à l'autre.

---

### Étape 7 : Nouvel Onglet "Chrono-Frise" & Refonte Icônes Cockpit (Frontend Admin)
**Fichiers** :
- [`apps/admin-sosplanete-v2/src/app/dashboard/easter-eggs/page.tsx`](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/admin-sosplanete-v2/src/app/dashboard/easter-eggs/page.tsx)
- Nouveau composant : [`apps/admin-sosplanete-v2/src/components/easter-eggs/EasterEggsChronoFrise.tsx`](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/admin-sosplanete-v2/src/components/easter-eggs/EasterEggsChronoFrise.tsx)
- [`apps/admin-sosplanete-v2/src/components/easter-eggs/EasterEggsTrackingCockpit.tsx`](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/admin-sosplanete-v2/src/components/easter-eggs/EasterEggsTrackingCockpit.tsx)

* **Action 7.1 — Intégration du 4ème onglet dans `page.tsx`** :
  - Positionner `"Chrono-Frise & Archives"` entre *"Catalogue & Ordre"* et *"Paramètres Saison"*.
* **Action 7.2 — Création de `EasterEggsChronoFrise.tsx`** :
  - Composant adapté aux couleurs claires de l'admin (GlassCards blanches, accents émeraude/ardoise).
  - Déroulé de la saison avec affichage clair pour chaque cycle :
    - Titre de l'œuf, code, points IT, glyphe associé.
    - Liste des équipes ayant trouvé (badge vert avec horodatage et points).
    - Liste des équipes en retard / œuf reporté (badge ambre "Non découvert").
* **Action 7.3 — Refonte des icônes d'action du Cockpit (Admin uniquement)** :
  - Remplacer `StopCircle` par **`Lock`** (cadenas rouge) : *"Clôturer uniquement cette énigme pour cette période (les autres restent actives)"*.
  - Remplacer `Eye` par **`Lightbulb`** (ampoule jaune) : *"Débloquer immédiatement le 2ème indice pour tous les élèves"*.
  - Remplacer `RotateCcw` par **`History`** : *"Remettre à zéro les découvertes de cette énigme"*.
* **Action 7.4 — Sécurisation de la modale d'activation** :
  - Ajouter `initialMode` dans les dépendances du `useEffect` de [`ManualActivationModal.tsx`](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/admin-sosplanete-v2/src/components/easter-eggs/ManualActivationModal.tsx#L57).

---

## 6. Cahier de Recette & Plan de Tests Dédié (`EPIC-EasterEggs`)

Ce plan de tests exhaustif sera intégré dans [`cahier_recette_evoe.md`](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/.docs/5-tests/cahier_recette_evoe.md) et [`cahier_recette_admin.md`](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/.docs/5-tests/cahier_recette_admin.md) lors de la validation.

| ID Test | Cas de Test & Préconditions | Procédure de Test | Résultat Attendu | Statut |
| :--- | :--- | :--- | :--- | :---: |
| **TST-EE-001** | **Activation silencieuse en direct** | L'élève est connecté sur sa session. L'admin active un Easter Egg. | Le jeu de l'élève charge l'énigme en arrière-plan sans F5. L'œuf reste non découvert (`isDiscovered: false`), prêt à être cherché. | `[ ]` |
| **TST-EE-002** | **Ajout multi-œufs (Premier essai)** | Un œuf naturel A est actif. L'admin clique sur `+` ("Ajouter à la période") et choisit l'Œuf B. | L'Œuf A reste actif ET l'Œuf B est ajouté dès le premier clic. Aucun écrasement. | `[ ]` |
| **TST-EE-003** | **Clôture unitaire sans effet de bord** | Deux œufs A et B sont actifs. L'admin clique sur `Lock` (fermer) sur l'Œuf B. | Seul l'Œuf B est fermé. L'Œuf A reste actif pour les élèves jusqu'à la fin de la période. | `[ ]` |
| **TST-EE-004** | **Report automatique par équipe** | L'Équipe Bleue n'a pas trouvé l'Œuf A en Période 1. La Période 2 démarre avec l'Œuf B. | L'Équipe Bleue voit 2 anomalies actives (Œuf A reporté + Œuf B). | `[ ]` |
| **TST-EE-005** | **Non-report pour équipe ayant résolu** | L'Équipe Rouge a validé l'Œuf A en Période 1. La Période 2 démarre avec l'Œuf B. | L'Équipe Rouge ne voit que l'Œuf B (l'Œuf A est archivé comme réussi). | `[ ]` |
| **TST-EE-006** | **Nouvel onglet Chrono-Frise Admin** | L'admin se rend sur `/dashboard/easter-eggs` et clique sur l'onglet "Chrono-Frise". | La frise de la saison s'affiche avec le design clair admin, listant cycle par cycle quelles équipes ont trouvé vs non trouvé chaque œuf. | `[ ]` |
| **TST-EE-007** | **Bascule d'anomalie dans la bulle mascotte** | L'élève a 2 œufs actifs (un reporté et un nouveau). Il clique sur le badge. | La bulle affiche les onglets des anomalies. Le clic sur un onglet charge l'énigme et le cadenas correspondant. | `[ ]` |
| **TST-EE-008** | **Gravure progressive du glyphe multi-œufs** | L'équipe a 2 œufs à découvrir. Un premier œuf est résolu. | 50% du glyphe 2070 s'illumine sur le badge HUD. Quand les deux sont résolus, 100% s'illumine en or. | `[ ]` |
| **TST-EE-009** | **Forçage d'indice immédiat** | Des élèves sont connectés. L'admin clique sur `Lightbulb` sur l'Œuf A. | Le 2ème indice devient instantanément visible dans la bulle pour tous les élèves sans F5. | `[ ]` |
| **TST-EE-010** | **Résolution sans collision de triggers** | Deux énigmes partagent un même type d'action. La première est résolue. | La validation de la seconde énigme n'est pas bloquée et valide le bon ID d'œuf. | `[ ]` |
| **TST-EE-011** | **Isolation inter-instances** | L'admin déclenche un œuf sur l'École 1. Un élève de l'École 2 est connecté. | L'élève de l'École 2 ne reçoit aucun événement socket et son affichage reste inchangé. | `[ ]` |
| **TST-EE-012** | **Rafraîchissement au focus de l'onglet** | L'élève minimise son onglet. L'admin modifie un œuf. L'élève réactive l'onglet. | Dès que l'onglet reprend le focus (`window.onfocus`), l'œuf se synchronise automatiquement. | `[ ]` |
| **TST-EE-013** | **Quotas d'équipe et attribution des points IT** | L'équipe atteint le quota de joueurs requis sur un œuf. | La récompense d'équipe `EvoeEasterEggTeamReward` est attribuée et le message de victoire est partagé. | `[ ]` |
| **TST-EE-014** | **Ergonomie des icônes du Cockpit Admin** | L'admin survole les actions sur un œuf dans le cockpit. | Les icônes `Lightbulb` (indice), `History` (reset) et `Lock` (fermer) s'affichent avec des infobulles explicites. | `[ ]` |

---

## 7. Prochaine Étape

Ce document v3.0 intègre l'ensemble de vos souhaits (explications claires, nouvel onglet Chrono-Frise admin, report équipe par équipe, refonte ciblée admin, plan de tests).  
Dès que vous validez cette feuille de route, nous pourrons passer à la mise en œuvre du code.

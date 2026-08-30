# 📜 EPIC-04 : Codex des Missions & Impulsion Écologique

## 📋 Présentation
Cet Epic couvre la consultation des missions de transition écologique transposées dans l'univers de science-fiction Evoe (titres SF, visuels futuristes, équivalences d'impacts réels), la recherche, l'impulsion (validation d'action), l'annulation et l'historique hebdomadaire.

---

### 📖 US-EVOE-12 : Consultation du Codex par Secteur
- **En tant qu'** Agent Temporel,
- **Je veux** faire défiler les cartes de missions 3D dans le Codex selon le pôle thématique choisi,
- **Afin de** découvrir les actions écologiques à accomplir.

#### ⚙️ Règles de Gestion & Fonctionnement
1. Le Codex présente les missions sous forme de carrousel cylindrique / 3D (`MissionsCarousel3D.tsx` / `MissionCard3D.tsx`).
2. Chaque carte de mission affiche :
   - Le titre de science-fiction (ex: *« Bouclier Anti-Fuites Photoniques »*) et sa correspondance réelle (*« Éteindre les veilles »*).
   - L'image d'illustration SF (uploadée ou générée).
   - Les points gagnés et le gain d'impact estimé (CO2 en kg/t, Eau en L/m³, Déchets en kg, Énergie en kWh).
   - Le nombre de fois où cette mission a déjà été impulsée durant la période active.
3. Le bouton de réduction / agrandissement du Codex permet de masquer le volet pour contempler la passerelle 3D.

#### 🧪 Critères d'Acceptation (Gherkin)
- **Scénario 1 : Affichage des missions d'un pôle**
  - **Given** le pôle "Énergie" sélectionné.
  - **When** le joueur parcourt le carrousel.
  - **Then** seules les cartes de missions de la catégorie Énergie sont présentées avec leurs métriques d'impact.

---

### 📖 US-EVOE-13 : Recherche Textuelle de Missions
- **En tant qu'** Agent Temporel,
- **Je veux** rechercher une mission par mot-clé via la barre de recherche,
- **Afin de** retrouver rapidement une action précise sans naviguer dans tous les secteurs.

#### ⚙️ Règles de Gestion & Fonctionnement
1. La barre de recherche (`MissionSearchBar.tsx`) est accessible en haut du Codex.
2. La recherche filtre en temps réel sur le titre SF, la description SF, le libellé de l'action réelle et le code d'action.
3. Si des résultats correspondent, ils sont immédiatement présentés dans la vue de résultats.
4. Un bouton « Vider » (croix) réinitialise la recherche et revient à l'affichage par secteur.

#### 🧪 Critères d'Acceptation (Gherkin)
- **Scénario 1 : Recherche avec résultats**
  - **Given** la barre de recherche active.
  - **When** l'utilisateur saisit `"vélo"`.
  - **Then** toutes les missions de mobilité douce associées au vélo s'affichent.
- **Scénario 2 : Recherche infructueuse**
  - **Given** une recherche ne correspondant à aucune mission.
  - **When** la saisie est terminée.
  - **Then** un message « Aucune mission trouvée » est affiché avec une suggestion de réinitialisation.

---

### 📖 US-EVOE-14 : Impulsion d'une Mission (Validation d'Action)
- **En tant qu'** Agent Temporel ayant réalisé une action dans le monde réel,
- **Je veux** cliquer sur le bouton « Impulser la Mission » sur la carte correspondante,
- **Afin d'** enregistrer mon action, faire progresser mon score et contribuer à la régénération planétaire.

#### ⚙️ Règles de Gestion & Fonctionnement
1. Le clic sur « Impulser » déclenche un appel API `POST /legacy/actiondone/:childId` avec l'ID de l'action locale.
2. Un effet visuel de glitch cybernétique et halo lumineux (`isGlitching`) est activé pendant la requête.
3. Dès confirmation par le serveur :
   - Le compteur personnel de l'action est incrémenté.
   - Les indicateurs globaux du Nexus (CO2, Eau, Déchets, Terre-mètre) et le statut du dashboard sont rechargés automatiquement.
   - Le niveau de propulsion de l'équipe est recalculé.

#### 🧪 Critères d'Acceptation (Gherkin)
- **Scénario 1 : Impulsion réussie**
  - **Given** une mission avec un compteur actuel à 0.
  - **When** le joueur clique sur "Impulser la Mission".
  - **Then** l'effet de glitch s'anime, l'API confirme l'ajout et le compteur de la mission passe à 1.
  - **And** le score global de l'équipe et la jauge planétaire augmentent.

---

### 📖 US-EVOE-15 : Annulation d'une Impulsion (Désengagement / Correction)
- **En tant qu'** Agent Temporel ayant impulsé une mission par erreur,
- **Je veux** annuler une impulsion récente avec demande de confirmation,
- **Afin de** corriger mes saisies sans fausser les scores.

#### ⚙️ Règles de Gestion & Fonctionnement
1. Lorsqu'une mission a été réalisée au moins une fois durant la période, un bouton d'annulation (icône `Trash2` ou `RotateCcw`) apparaît.
2. Le clic sur l'annulation ouvre la modale de confirmation `ConfirmCancelModal`.
3. Si le joueur confirme, l'API `DELETE /legacy/actiondone/:actionDoneId` est appelée.
4. L'action est décrémentée, l'impact est soustrait et le contexte est rafraîchi.

#### 🧪 Critères d'Acceptation (Gherkin)
- **Scénario 1 : Confirmation de l'annulation**
  - **Given** une action impulsée à l'étape précédente.
  - **When** le joueur clique sur annuler et valide la modale de confirmation.
  - **Then** l'action est supprimée de la base de données et le compteur diminue.
- **Scénario 2 : Abandon de l'annulation**
  - **Given** la modale de confirmation d'annulation ouverte.
  - **When** le joueur clique sur « Annuler ».
  - **Then** la modale se ferme sans supprimer l'action.

---

### 📖 US-EVOE-16 : Récapitulatif Hebdomadaire des Missions
- **En tant qu'** Agent Temporel,
- **Je veux** ouvrir la modale récapitulative des missions de la semaine (`MissionsWeekModal`),
- **Afin de** voir en un coup d'œil toutes mes actions validées sur la période en cours.

#### ⚙️ Règles de Gestion & Fonctionnement
1. Un bouton « Synthèse Semaine » permet d'ouvrir `MissionsWeekModal`.
2. La modale liste toutes les actions réalisées par l'agent pour la semaine active avec date/heure et impact.
3. Elle affiche les totaux d'impact cumulés de la semaine (CO2, Eau, Déchets, Énergie).

#### 🧪 Critères d'Acceptation (Gherkin)
- **Scénario 1 : Consultation du récapitulatif**
  - **Given** un joueur ayant validé 3 actions cette semaine.
  - **When** il ouvre la modale récapitulative.
  - **Then** les 3 actions apparaissent dans la liste avec leurs détails et les cumuls d'impact exacts.

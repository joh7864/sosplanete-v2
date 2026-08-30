# 👤 EPIC-10 : Profil de l'Agent Temporel & Personnalisation

## 📋 Présentation
Cet Epic couvre la consultation de la fiche individuelle de l'agent temporel, la modification de ses identifiants/informations, le sélecteur d'avatars 3D cyberpunk et l'upload d'avatars personnalisés avec validation de taille et format.

---

### 📖 US-EVOE-33 : Consultation de la Fiche Profil de l'Agent
- **En tant qu'** Agent Temporel,
- **Je veux** cliquer sur mon avatar ou sur le bouton Profil pour ouvrir ma fiche détaillée (`AgentProfileModal`),
- **Afin de** consulter mes statistiques personnelles, mon rang et mes accomplissements.

#### ⚙️ Règles de Gestion & Fonctionnement
1. La modale `AgentProfileModal` affiche :
   - Le pseudo et l'avatar actuel de l'agent (rendu 3D ou 2D).
   - L'équipe et le Nexus de rattachement.
   - Les totaux personnels d'impact : nombre d'actions impulsées, kg de CO2 économisés, litres d'eau préservés, kg de déchets réduits.
   - Le statut de délégué (`isDelegate`).
2. Un indicateur de grade temporel est calculé selon les points d'expérience de l'agent.

#### 🧪 Critères d'Acceptation (Gherkin)
- **Scénario 1 : Affichage des statistiques de l'agent**
  - **Given** un agent connecté ayant 12 actions à son actif.
  - **When** il ouvre son profil.
  - **Then** sa fiche affiche ses compteurs d'impact exacts et son appartenance d'équipe.

---

### 📖 US-EVOE-34 : Modification des Informations Personnelles
- **En tant qu'** Agent Temporel,
- **Je veux** modifier mon pseudo, mon mot de passe, mon genre ou ma date de naissance,
- **Afin de** maintenir mes informations à jour.

#### ⚙️ Règles de Gestion & Fonctionnement
1. Depuis la modale de profil, un mode édition permet de modifier :
   - Le pseudo (identifiant).
   - Le mot de passe (clé de décryptage).
   - Le genre et la date de naissance (optionnels).
2. L'envoi appelle `PATCH /evoe/profile` avec les nouveaux paramètres.
3. Si un nouveau mot de passe est défini, il est hashé de manière sécurisée en base côté backend (`bcrypt`).
4. Si le pseudo est modifié, le token de session et le contexte sont mis à jour sans déconnexion.

#### 🧪 Critères d'Acceptation (Gherkin)
- **Scénario 1 : Modification du pseudo**
  - **Given** l'agent modifiant son pseudo de `"agent1"` vers `"chronos"`.
  - **When** il valide la modification.
  - **Then** l'API confirme la mise à jour et le nouveau pseudo apparaît partout sur la passerelle et dans le chat.

---

### 📖 US-EVOE-35 : Personnalisation de l'Avatar (3D & Upload d'Image)
- **En tant qu'** Agent Temporel,
- **Je veux** choisir un avatar dans la galerie 3D ou importer ma propre image d'avatar,
- **Afin de** me distinguer dans le cosmos et sur la passerelle.

#### ⚙️ Règles de Gestion & Fonctionnement
1. La galerie propose une sélection d'avatars futuristes prédéfinis (`avatars_3D/robot.png`, `avatars_3D/cyborg.png`, etc.).
2. Un bouton d'upload permet de télécharger une image personnalisée depuis l'appareil (`POST /evoe/profile/upload-avatar`).
3. **Contrôles de validation** :
   - Formats acceptés : `.png`, `.jpg`, `.jpeg`, `.gif`, `.webp`.
   - Taille maximale : **2 Mo**.
   - Tout format ou fichier dépassant la limite est rejeté avec un message d'erreur explicite.
4. L'avatar choisi est immédiatement appliqué à la figurine 3D du joueur et sur ses messages de chat.

#### 🧪 Critères d'Acceptation (Gherkin)
- **Scénario 1 : Sélection d'un avatar de la galerie**
  - **Given** la galerie d'avatars ouverte.
  - **When** le joueur clique sur l'avatar "Cyborg".
  - **Then** son profil est mis à jour et son avatar 3D sur la passerelle prend l'apparence du Cyborg.
- **Scénario 2 : Upload d'un fichier trop volumineux**
  - **Given** un fichier image de 5 Mo sélectionné.
  - **When** l'agent tente l'upload.
  - **Then** l'application rejette le fichier et affiche une alerte « Le fichier dépasse la taille maximale autorisée (2 Mo) ».

# ⚔️ EPIC-05 : Arène des Défis PvP Inter-Équipes

## 📋 Présentation
Cet Epic couvre le système de défis asynchrones entre équipes (classes rivales de l'école), la consultation des défis reçus/envoyés, la création d'un défi avec gage (pledge) et compte à rebours, ainsi que la réponse (acceptation/refus) et le statut de complétion.

---

### 📖 US-EVOE-17 : Consultation des Défis de l'Équipe
- **En tant qu'** Agent Temporel,
- **Je veux** basculer sur l'onglet « Défis » du Codex ou cliquer sur la Lune 3D,
- **Afin de** voir les défis PvP en attente, acceptés, refusés ou remportés par mon équipe.

#### ⚙️ Règles de Gestion & Fonctionnement
1. L'onglet « Défis » (`ChallengesCarousel3D.tsx` / `ChallengeCard3D.tsx`) affiche deux flux :
   - **Défis Reçus** : lancés par une autre équipe ciblant la mienne.
   - **Défis Lancés** : créés par mon équipe envers une autre équipe.
2. Chaque carte de défi affiche :
   - Le nom de l'équipe émettrice et de l'équipe cible.
   - La mission éco-citoyenne imposée.
   - Le gage ou pacte associé (`pledge`, ex: *« La classe perdante nettoie la cour »*).
   - Le statut : `PENDING` (En attente), `ACCEPTED` (En cours), `DECLINED` (Refusé), `SUCCESS` (Réussi), `FAILED` (Échoué/Expiré).
   - Le temps restant avant expiration (ex: 48h).

#### 🧪 Critères d'Acceptation (Gherkin)
- **Scénario 1 : Affichage des défis reçus en attente**
  - **Given** un défi `PENDING` envoyé par "Équipe Gamma" à "Équipe Alpha".
  - **When** un joueur d'Alpha consulte l'onglet Défis.
  - **Then** la carte du défi s'affiche avec les boutons « Accepter le Défi » et « Refuser ».

---

### 📖 US-EVOE-18 : Création et Lancement d'un Défi
- **En tant qu'** Agent Temporel,
- **Je veux** défier une autre équipe en sélectionnant une mission et en définissant un gage,
- **Afin de** stimuler la compétition positive au sein de l'école.

#### ⚙️ Règles de Gestion & Fonctionnement
1. Le bouton « Lancer un Défi » ouvre la modale `ChallengeModal`.
2. Le formulaire requiert :
   - **Équipe Cible** : sélection parmi les autres équipes du même Nexus.
   - **Mission Imposée** : sélection dans le catalogue des missions de l'instance.
   - **Gage / Pacte** : texte libre décrivant l'enjeu du défi (champ obligatoire).
   - **Durée de Réalisation** : choix par défaut de 48 heures (ou personnalisé).
3. À la soumission, l'API `POST /evoe/challenges` enregistre le défi et notifie le canal d'équipe adverse.

#### 🧪 Critères d'Acceptation (Gherkin)
- **Scénario 1 : Création réussie d'un défi**
  - **Given** le formulaire de défi renseigné avec une équipe cible, une mission et un gage `"50 actions d'extinction des lumières en 48h"`.
  - **When** l'agent valide l'envoi.
  - **Then** le défi est créé avec le statut `PENDING`, la modale se ferme et la liste des défis lancés se rafraîchit.
- **Scénario 2 : Champs obligatoires manquants**
  - **Given** un gage laissé vide.
  - **When** l'agent tente de soumettre le formulaire.
  - **Then** un message d'erreur indique que tous les champs sont requis et la soumission est bloquée.

---

### 📖 US-EVOE-19 : Réponse à un Défi (Accepter / Refuser)
- **En tant qu'** Agent Temporel d'une équipe recevant un défi,
- **Je veux** accepter ou refuser le défi proposé,
- **Afin d'** engager mon équipe dans l'arène ou décliner la proposition.

#### ⚙️ Règles de Gestion & Fonctionnement
1. Sur les cartes de défis reçus ayant le statut `PENDING`, deux boutons sont disponibles : « Accepter » (vert) et « Décliner » (rouge).
2. Le clic sur « Accepter » appelle `POST /evoe/challenges/:id/respond` avec `{ accept: true }`. Le statut passe à `ACCEPTED` et le compte à rebours est déclenché.
3. Le clic sur « Décliner » appelle `POST /evoe/challenges/:id/respond` avec `{ accept: false }`. Le statut passe à `DECLINED`.

#### 🧪 Critères d'Acceptation (Gherkin)
- **Scénario 1 : Acceptation du défi**
  - **Given** un défi reçu `PENDING`.
  - **When** le joueur clique sur "Accepter".
  - **Then** le statut devient `ACCEPTED` et le badge passe en mode actif.
- **Scénario 2 : Refus du défi**
  - **Given** un défi reçu `PENDING`.
  - **When** le joueur clique sur "Refuser".
  - **Then** le défi passe au statut `DECLINED`.

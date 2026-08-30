# 🔐 EPIC-01 : Authentification Quantique & Sélection de Nexus

## 📋 Présentation
Cet Epic couvre l'identification et la connexion de l'agent temporel (élève), la résolution automatique ou manuelle de son Nexus (école/instance en cas d'homonymie de pseudo), la gestion de session et la déconnexion.

---

### 📖 US-EVOE-01 : Connexion de l'Agent Temporel
- **En tant qu'** Agent Temporel (Joueur),
- **Je veux** saisir mon Identifiant de Synchronisation (pseudo) et ma Clé de Décryptage (mot de passe),
- **Afin de** m'authentifier et accéder à la passerelle temporelle.

#### ⚙️ Règles de Gestion & Fonctionnement
1. Le formulaire présente deux champs : `Identifiant de Synchronisation` et `Clé de Décryptage`.
2. Un bouton oeil permet d'afficher / masquer en clair le mot de passe saisi.
3. Une case à cocher « Maintenir la connexion quantique » permet de persister la session dans `localStorage` (au lieu de `sessionStorage`).
4. Le bouton « Établir la Connexion Temporelle » est désactivé tant que les deux champs ne sont pas remplis ou si une requête est en cours.
5. En cas d'erreur d'identifiants ou si l'espace est fermé (`isOpen: false`), un message clair « Pseudo ou mot de passe incorrect, ou espace fermé ! » est affiché.

#### 🧪 Critères d'Acceptation (Gherkin)
- **Scénario 1 : Connexion nominale directe**
  - **Given** un joueur avec le pseudo `"dinosaure"` et le mot de passe `"1234"` existant dans une seule instance ouverte.
  - **When** il soumet le formulaire de connexion.
  - **Then** l'API renvoie les informations de l'instance, le token d'authentification est stocké et le joueur est redirigé vers la passerelle `/`.
- **Scénario 2 : Mot de passe incorrect ou compte inexistant**
  - **Given** un joueur saisissant un mot de passe erroné.
  - **When** il valide le formulaire.
  - **Then** un message d'erreur d'authentification s'affiche et aucun token n'est stocké.
- **Scénario 3 : Espace scolaire fermé**
  - **Given** un joueur appartenant à un espace dont le champ `isOpen` vaut `false`.
  - **When** il tente de se connecter.
  - **Then** la connexion est refusée avec le message d'espace fermé.

---

### 📖 US-EVOE-02 : Résolution Multi-Nexus (Choix d'Instance)
- **En tant qu'** Agent Temporel ayant un pseudo présent dans plusieurs écoles,
- **Je veux** sélectionner mon Nexus (école) parmi la liste proposée,
- **Afin de** me connecter à la bonne instance de jeu.

#### ⚙️ Règles de Gestion & Fonctionnement
1. Lorsque l'API détecte le même couple (pseudo, mot de passe) dans plusieurs instances, elle retourne le statut `multiple_choices` avec la liste des écoles (`choices: [{ instanceId, schoolName }]`).
2. L'interface bascule alors sur l'écran « Multiples espaces détectés. Choisissez votre Nexus : ».
3. Chaque école est affichée sous forme de bouton d'action.
4. Au clic sur une école, la connexion est finalisée avec l'en-tête `x-instance-id` correspondant et le joueur est redirigé vers la passerelle.

#### 🧪 Critères d'Acceptation (Gherkin)
- **Scénario 1 : Affichage des choix d'instance**
  - **Given** un pseudo existant à la fois sur "École Neyron" (id: 1) et "École Balan" (id: 2).
  - **When** l'utilisateur valide ses identifiants.
  - **Then** le formulaire est remplacé par la liste des choix avec 2 boutons ("École Neyron", "École Balan").
- **Scénario 2 : Sélection et finalisation de connexion**
  - **Given** l'écran de sélection de nexus affiché.
  - **When** le joueur clique sur "École Neyron".
  - **Then** l'instanceId 1 est sélectionné, le contexte est chargé et le joueur arrive sur la passerelle.

---

### 📖 US-EVOE-03 : Déconnexion Quantique
- **En tant qu'** Agent Temporel,
- **Je veux** me déconnecter via le bouton dédié dans l'interface,
- **Afin de** libérer mon terminal et protéger ma session.

#### ⚙️ Règles de Gestion & Fonctionnement
1. Le bouton de déconnexion (icône `LogOut`) est toujours accessible depuis l'en-tête de la passerelle.
2. Le clic sur déconnexion purge les tokens et variables de session (`evoe_auth`, `instanceId` dans `localStorage` et `sessionStorage`).
3. Les en-têtes d'autorisation par défaut du client API sont supprimés.
4. L'utilisateur est immédiatement redirigé vers `/login`.

#### 🧪 Critères d'Acceptation (Gherkin)
- **Scénario 1 : Déconnexion réussie**
  - **Given** un joueur connecté sur la passerelle.
  - **When** il clique sur l'icône de déconnexion.
  - **Then** la session est purgée et la page `/login` s'affiche.
  - **And** tenter de revenir en arrière avec le navigateur redirige immédiatement vers `/login`.

---

### 📖 US-EVOE-04 : Restauration Automatique de Session & Redirection
- **En tant qu'** Agent Temporel ayant choisi « Maintenir la connexion »,
- **Je veux** être automatiquement reconnecté lors de l'ouverture de l'application,
- **Afin d'** accéder directement à mon QG spatial sans ressaisir mes identifiants.

#### ⚙️ Règles de Gestion & Fonctionnement
1. Au chargement initial de l'application, le hook d'authentification vérifie la présence de `evoe_auth` et `instanceId`.
2. Si présents, une requête `/check_auth` valide la persistance.
3. Si le token est valide, le contexte (`/context`) est rechargé et l'utilisateur reste sur `/`.
4. Si le token est révoqué ou invalide, la session est nettoyée et la redirection vers `/login` est effectuée.
5. Si un utilisateur déjà authentifié tente d'aller sur `/login`, il est redirigé vers `/`.

#### 🧪 Critères d'Acceptation (Gherkin)
- **Scénario 1 : Session valide en cache**
  - **Given** un token valide présent dans `localStorage`.
  - **When** l'utilisateur arrive sur l'URL racine `/`.
  - **Then** le contexte est rechargé en arrière-plan et la passerelle 3D s'affiche directement.
- **Scénario 2 : Redirection si déjà loggé**
  - **Given** un utilisateur connecté.
  - **When** il navigue manuellement vers `/login`.
  - **Then** il est automatiquement redirigé vers `/`.

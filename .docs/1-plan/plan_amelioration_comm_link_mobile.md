# Plan d'Amélioration UX/UI : Comm-Link & Adaptabilité Mobile

Ce document détaille les propositions d'améliorations ergonomiques et fonctionnelles pour le **Nexus Comm-Link** (le chat) et le comportement sur **mobile**. 

**Instructions pour l'annotation :** Vous pouvez modifier directement ce fichier dans votre éditeur en écrivant vos remarques, corrections ou validations sous chaque section (dans les zones prévues `[Saisir vos remarques ici]`).

---

## 1. Émojis & Correctifs Graphiques Immédiats

### Objectifs :
- [ ] **Correction du masquage de la toolbar :** Empêcher que le menu de réaction flottant (`😊+`) du tout premier message de la liste ne soit caché sous la barre d'onglets du haut.
  * *Solution proposée :* Ajouter un espacement haut (`padding-top: 16px`) sur la boîte du premier message ou intégrer la barre d'outils à l'intérieur du bloc de message sans dépassement négatif (`top: 4px` au lieu de `top: -12px`).
- [ ] **Logs de diagnostic :** Ajouter des logs d'envoi et de réception (côté client et serveur) pour identifier pourquoi les réactions émojis ne s'enregistrent pas toujours en local.
- [ ] **Fermeture intempestive :** Ajuster le comportement du survol (`onMouseLeave`) pour éviter que le sélecteur d'émojis ne se ferme tout seul quand la souris se déplace vers lui.

* **Annotations / Remarques :**
  > *[Saisir vos remarques ici]*

---

## 2. Refonte "Slack-like" du Comm-Link (Ordinateur & Mobile Large)

### Objectifs :
- [ ] **Barre de Navigation Interne (à gauche dans le chat) :**
  * Séparer le panneau de chat en deux colonnes (à la Slack).
  * **Section "Canaux" :** `#global`, `#equipe`, `#system`.
  * **Section "Direct Messages" :** Liste des autres joueurs connectés à l'instance, avec un indicateur lumineux vert/gris (En ligne / Hors ligne).
  * **Accès en 1 clic :** Cliquer sur le nom d'un joueur dans la liste ouvre automatiquement le chat privé avec lui, éliminant la saisie manuelle de la commande `/pseudo`.
- [ ] **Zone de messages épurée (à droite dans le chat) :**
  * Supprimer la police terminal verte monospace pour les messages classiques.
  * Afficher l'avatar arrondi du joueur à gauche, son nom en gras en haut, et le timestamp à côté.
  * Rendre les réactions sous forme de petits boutons "pilules" sous le message pour voir les votes existants et rajouter sa réaction en un clic.
- [ ] **Saisie simplifiée :**
  * Barre d'input avec placeholder dynamique : `Envoyer un message dans #global` ou `Envoyer un MP à @isabellec`.

* **Annotations / Remarques :**
  > *[Saisir vos remarques ici]*

---

## 3. Refonte Responsive Mobile (Portrait & Paysage)

### Objectifs :
- [ ] **Priorité au mode Portrait (Vertical) :**
  * Permettre un vrai agencement vertical quand le téléphone est tenu debout : 
    * Globe 3D en haut (40% de l'écran).
    * Panneaux d'actions (Codex, Chat, Tableau de bord) en bas (60% de l'écran) pour éviter tout chevauchement.
- [ ] **Optimisation du mode Paysage Mobile (`@media (max-height: 500px)`) :**
  * **Modales Plein Écran / Défilement :** Rendre les fenêtres d'information (Classement, Radar, Extrapolation) scrollables avec une hauteur maximale (`max-height: 85vh`) pour que le bouton de fermeture (`×`) reste visible et accessible en haut à droite.
  * **Chat Plein Écran :** Quand le chat s'ouvre sur mobile paysage, il prend 100% de la largeur de l'écran pour être lisible. Le globe 3D est temporairement masqué en arrière-plan.
  * **Réduction d'échelle globale :** Réduire la taille des textes, des marges et des avatars sur mobile landscape pour maximiser l'espace de lecture.
  * **Fermeture mutuelle :** Ouvrir le chat ferme automatiquement le Codex, et vice-versa, pour éviter d'empiler des fenêtres.

* **Annotations / Remarques :**
  > *[Saisir vos remarques ici]*

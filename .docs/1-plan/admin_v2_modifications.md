# Plan de Modification (Admin-v2 & Backend-v2) - Support complet du Legacy API (v7)

Ce document consolide l'intégralité des règles métier. Il clarifie notamment la distinction entre la configuration globale du jeu et le mouvement des périodes de saisie.

## 1. Modèle de Données & Backend (Prisma & NestJS)

### A. Référentiel des Catégories (Portée Établissement)
- Chaque école (Instance) possède sa propre configuration de catégories.
- Accessible aux rôles **AM** (Admin Manager) et **AS** (Admin Système).
- Modèle `Category` : `id`, `name`, `icon`, `order`, `instanceId`. (Icônes dans `./uploads/categories`).
- `ActionRef` : Relation vers `Category` (remplace le champ texte).

### B. Gestion des Périodes : Les Deux Concepts
1. **Période de Jeu (Configuration globale)** :
    - Unique par espace (Instance). Définit le cadre temporel du jeu.
    - Champs : `gameStartDate` (début du jeu), `gamePeriodsCount` (nb semaines / année scolaire).
    - **Gestion UI** : Modification uniquement. Pas de suppression.
2. **Périodes de Saisie des Actions (Mouvement hebdomadaire)** :
    - Plusieurs enregistrements par espace (un par semaine de saisie).
    - Un seul enregistrement peut avoir le statut **`isOpen`** à la fois pour un espace.
    - **Règle d'Ouverture** : L'ouverture d'une période entraîne la fermeture automatique de celle qui était ouverte (quelle qu'elle soit).
    - **Automatisation (Cron Job à 23h59)** :
        - Si fin de période détectée : Fermeture de l'actuelle, création et ouverture de la suivante.
        - Calcul : `startDate` = `fin_precedente + 1j` ; `endDate` = `startDate + 6j`.
    - **Suppression (Sécurisée)** : Possible via l'UI, mais avec une **Modale d'avertissement** :
        - Affiche le nombre d'actions (`ActionDone`) qui seront supprimées.
        - Affiche une liste simplifiée (Équipe, Enfant, Nom de l'action).

### C. Extension de l'Instance
- `hostUrl` : URL de connexion utilisée par le jeu (config FW).
- `unlockedChapters` (Int) : Nombre de chapitres d'histoire débloqués.
- `isOpen` : Statut d'ouverture de l'espace.

---

## 2. Interface Utilisateur (admin-sosplanete-v2)

### A. Navigation & Nettoyage
- **Suppression** : Le fichier `InstanceEditModal.tsx` est Purement supprimé du code.
- **Redirection Dashboard** : Le bouton "Editer" du Dashboard redirige vers :
  `/dashboard/organization?instanceId=X&tab=general`.

### B. Page "Configuration de l'espace" (`/organization`) - Ordre des onglets
1. **Paramètres généraux** (Par défaut) :
    - **Bloc "Paramètres école"** : Nom, Host URL, Statut instance (Ouvert/Fermé), Chapitres débloqués, Choix du Gestionnaire (AM).
    - **Bloc "Période de Jeu"** : Date de début, Nombre de semaines. (Modification uniquement).
    - **Bloc "Périodes de Saisie"** : Liste des périodes. Actions : Modifier, Ouvrir (exclusive), Supprimer (avec modale d'impact).
2. **Configuration des équipes**.
3. **Configuration du catalogue**.
4. **Configuration des catégories** (Per-instance, AS/AM, après catalogue, icônes `/uploads/categories`).

---

## 3. Étapes d'Exécution

### Phase 1 : Infrastructure
- [ ] Prisma : `Category`, `Instance.unlockedChapters`, `Period.isOpen`.
- [ ] Migration des `ActionRef` vers les catégories par instance.

### Phase 2 : Backend
- [ ] CronJob (23h59) avec règle (+1j / +6j).
- [ ] Service de période : Logique d'ouverture exclusive et Calcul du bilan de suppression (count + list actions).

### Phase 3 : Frontend
- [ ] Redirection Dashboard -> Organization (tab=general) et suppression de la modale.
- [ ] Création du composant "Paramètres généraux" avec les 3 blocs (École, Config Jeu, Liste Saisies).
- [ ] Intégration de la modale de sécurité pour la suppression de période.
- [ ] Création de l'onglet "Configuration des catégories".

---

> [!IMPORTANT]
> Aucune information n'a été retirée : le chemin des icônes, la règle Cron exacte, la gestion des rôles, et la distinction cruciale entre config globale et saisies hebdomadaires sont tous présents.

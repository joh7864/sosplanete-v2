# 🏆 EPIC-08 : Classement Spatial & Leaderboard 3D

## 📋 Présentation
Cet Epic couvre le podium 3D interactif des équipes (`LeaderboardScene3D.tsx` / `PodiumGroup.tsx`), le classement global de l'école (`LeaderboardModal.tsx`), les statistiques de performance inter-équipes et le palmarès individuel des agents.

---

### 📖 US-EVOE-27 : Podium 3D des Vaisseaux & Trophées Holographiques
- **En tant qu'** Agent Temporel,
- **Je veux** basculer sur la vue Leaderboard pour contempler le podium 3D des trois meilleures équipes,
- **Afin de** célébrer l'émulation collective et les victoires inter-classes.

#### ⚙️ Règles de Gestion & Fonctionnement
1. Le bouton de vue « Leaderboard » (icône `Trophy`) dans l'en-tête bascule la scène 3D de la vue Codex vers la vue Podium 3D (`LeaderboardScene3D.tsx`).
2. Le podium affiche les 3 marches (Or, Argent, Bronze) avec holo-trophées et les modèles 3D des vaisseaux correspondants.
3. Les informations de l'équipe (nom, score, kg de CO2 évités) flottent au-dessus de chaque marche.

#### 🧪 Critères d'Acceptation (Gherkin)
- **Scénario 1 : Rendu du podium 3D**
  - **Given** un classement établi avec au moins 3 équipes.
  - **When** l'utilisateur active le mode Podium.
  - **Then** les 3 premières équipes apparaissent sur les marches 1, 2 et 3 avec leurs holo-trophées dorés, argentés et cuivrés.

---

### 📖 US-EVOE-28 : Classement Détaillé Inter-Équipes & Palmarès Joueurs
- **En tant qu'** Agent Temporel,
- **Je veux** ouvrir la modale complète de classement (`LeaderboardModal`),
- **Afin de** consulter le tableau exhaustif de toutes les équipes et les meilleurs agents de chaque classe.

#### ⚙️ Règles de Gestion & Fonctionnement
1. La modale `LeaderboardModal` présente le tableau ordonné de toutes les équipes de l'école pour la période en cours.
2. Pour chaque équipe : rang, nom, couleur, points totaux, équivalent CO2 économisé, nombre d'actions réalisées et taux de participation des élèves.
3. Un onglet permet d'afficher les Top Joueurs (Agents d'Élite) avec leurs pseudos et accomplissements.

#### 🧪 Critères d'Acceptation (Gherkin)
- **Scénario 1 : Consultation du classement complet**
  - **Given** la modale Leaderboard ouverte.
  - **When** le joueur parcourt la liste.
  - **Then** toutes les classes sont listées dans l'ordre décroissant des points avec leurs indicateurs consolidés.

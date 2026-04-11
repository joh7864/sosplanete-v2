# 📖 US-02 : Gestion de l'Organisation (CRUD)

## Description Fonctionnelle
En tant qu'administrateur, je souhaite gérer toute la hiérarchie des participants (Équipes, Groupes, Joueurs) pour structurer le challenge.

## Règles de Gestion
- **CRUD Complet** : Création, Liste, Modification, Suppression.
- **Équipe** (Team) : Nom, Couleur, Icône.
- **Groupe** (Group) : Nom, rattaché à une Équipe.
- **Joueur** (Child) : Pseudo, rattaché à un Groupe.
- **Intégrité** : Interdire la suppression d'une équipe/groupe contenant des données actives (ou demander confirmation/anonymisation).

## Critères d'Acceptation
- [ ] Interface d'administration pour les Équipes.
- [ ] Interface d'administration pour les Groupes.
- [ ] Interface d'administration pour les Joueurs.

## Estimation Premium (Blyx)
- **Complexité** : 13 SP (M+)
- **Valeur** : 34 SP (D)

# 📖 US-06 : Moteur de Déblocage des Animaux

## Description Fonctionnelle
En tant que système de gamification, je souhaite calculer dynamiquement le déblocage des 9 animaux du jeu en fonction de l'engagement des joueurs afin de les motiver tout au long de la période de jeu.

## Règles de Gestion
- **Animaux à débloquer** : 9 au total.
- **Courbe de Référence** : Une courbe linéaire part de l'hypothèse que 70% des actions cibles sont réalisées par les joueurs actifs ($n$ joueurs).
- **Calcul de Seuil** : Le déblocage d'un animal se produit quand le cumul des actions (`ActionDone`) atteint un certain point de la courbe.
- **Ajustement Dynamique** : À chaque fin de période (fermeture), le système ajuste la courbe restante en fonction du retard ou de l'avance pris, pour assurer que le 9ème animal soit statistiquement déblocable à la date de fin du jeu.
- **Données d'Entrée** : Nombre de joueurs rattachés à l'espace, nombre d'actions réalisées, configuration de la période globale.

## Critères d'Acceptation
- [ ] Le backend fournit le statut actuel (quel animal est débloqué).
- [ ] Le backend fournit la progression vers le prochain animal (pourcentage).
- [ ] Le système recalcule les paliers lors de la clôture d'une période.

## Estimation Premium (Blyx)
- **Complexité** : 21 SP (L)
- **Valeur** : 89 SP (V)

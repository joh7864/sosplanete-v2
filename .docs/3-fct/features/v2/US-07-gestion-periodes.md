# 📖 US-07 : Gestion des Périodes

## Description Fonctionnelle
En tant qu'Administrateur Métier (AM), je souhaite que les périodes de saisie s'ouvrent et se ferment automatiquement tout en gardant la possibilité de les ajuster manuellement.

## Règles de Gestion
- **Ouverture Automatique** : Une période devient active à 00h00 le premier jour défini.
- **Fermeture Automatique** : La période se clôture à 23h59 le dernier jour.
- **Héritage** : Par défaut, une nouvelle période reprend la durée de la période précédente.
- **Modification AM** : L'AM peut modifier les dates de début/fin pour s'adapter aux vacances ou événements de l'école.
- **Impact** : Les saisies d'actions ne sont possibles que dans une période ouverte.

## Critères d'Acceptation
- [ ] Tâche planifiée ou logique applicative gérant le statut Open/Closed.
- [ ] API permettant à l'AM de paramétrer les dates.
- [ ] Validation du backend interdisant le `ActionDone` hors période active.

## Estimation Premium (Blyx)
- **Complexité** : 8 SP (M)
- **Valeur** : 21 SP (D-)

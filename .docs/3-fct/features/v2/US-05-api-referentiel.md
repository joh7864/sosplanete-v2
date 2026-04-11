# 📖 US-05 : Référentiel Global & Données de Calcul

## Description Fonctionnelle
En tant qu'Administrateur Système (AS), je souhaite gérer le référentiel commun des actions et les données de calcul annuelles pour l'ensemble des écoles.

## Règles de Gestion
- **Exclusivité AS** : Seul l'AS peut modifier le référentiel global.
- **Données Annuelles** : Saisie ou import des données de calcul communes à tous les espaces (ex: facteurs de conversion CO2 annuels).
- **Versioning de l'Impact** : Si l'AS modifie les critères d'impact (CO2, Eau, Déchets) d'une action du référentiel, cette modification ne doit pas impacter les `ActionDone` passées. Elle s'appliquera uniquement aux futures saisies.
- **Structure** : Le référentiel contient le libellé de référence et les 3 indicateurs de pondération.

## Critères d'Acceptation
- [ ] Interface de gestion du référentiel pour l'AS.
- [ ] Saisie des indicateurs annuels.
- [ ] Intégrité historique : conservation des poids lors du stockage de l'action réalisée.

## Estimation Premium (Blyx)
- **Complexité** : 13 SP (M+)
- **Valeur** : 55 SP (D+)

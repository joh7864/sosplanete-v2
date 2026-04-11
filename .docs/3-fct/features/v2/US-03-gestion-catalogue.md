# 📖 US-03 : Gestion du Catalogue & Mapping Espace

## Description Fonctionnelle
En tant qu'Administrateur Métier (AM), je souhaite composer le catalogue d'actions de mon école en m'appuyant sur le référentiel commun tout en personnalisant les libellés pour mes élèves.

## Règles de Gestion
- **Référentiel Commun** : L'AM peut consulter la liste des actions globales gérées par l'AS.
- **Création Locale** : L'AM crée une action pour son espace.
- **Mapping de l'Impact** : Chaque action locale doit **obligatoirement** référencer une et une seule action du référentiel commun.
- **Personnalisation** : L'AM peut modifier le libellé court, la description et la catégorie de l'action pour son espace local sans affecter le référentiel global.
- **Support Unitaire & Masse** : Possibilité de sélectionner des actions du référentiel pour les importer/créer en masse dans son espace.

## Critères d'Acceptation
- [ ] Interface de sélection d'actions depuis le catalogue global.
- [ ] Formulaire de personnalisation (Libellé, Catégorie).
- [ ] Validation du lien obligatoire vers le référentiel global.

## Estimation Premium (Blyx)
- **Complexité** : 8 SP (M)
- **Valeur** : 13 SP (I+)

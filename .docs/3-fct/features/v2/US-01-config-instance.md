# 📖 US-01 : Configuration de l'Instance

## Description Fonctionnelle
En tant qu'administrateur, je souhaite configurer les informations de base de l'instance **sos-planete** (Nom de l'école et URL dédiée) afin de personnaliser l'unité de jeu.

## Règles de Gestion
- **Instance Unique** : Une instance de l'application correspond à une école.
- **URL Dédiée** : L'accès au système se fait via une URL spécifique (ex: `ecole-paradis.sos-planete.fr`).
- **Persistance** : Les données sont stockées dans la table `School` ou `InstanceConfig`.

## Critères d'Acceptation
- [ ] L'admin peut modifier le nom de l'école.
- [ ] L'admin peut définir l'URL de l'instance.
- [ ] L'interface affiche le nom de l'école sur tous les écrans joueurs.

## Estimation Premium (Blyx)
- **Complexité** : 5 SP (M-)
- **Valeur** : 21 SP (D-)

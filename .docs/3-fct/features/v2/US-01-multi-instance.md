# 📖 US-01 : Gestion Multi-Instance (AS / AM)

## Description Fonctionnelle
En tant qu'Administrateur Système (AS), je souhaite gérer plusieurs espaces (écoles) et déléguer la gestion de chaque espace à un Administrateur Métier (AM).

## Rôles & Permissions
- **System Admin (AS)** :
    - Crée les comptes AM.
    - Crée et configure les instances (Espaces Écoles).
    - Accès global.
- **Business Admin (AM)** :
    - Accès restreint à son propre espace.
    - Gère l'organisation locale de son école.

## Règles de Gestion
- Un AM est rattaché à une instance spécifique.
- Le hachage des mots de passe est implémenté selon les standards **Wagmoo**.

## Critères d'Acceptation
- [ ] Middleware d'authentification gérant les deux rôles.
- [ ] Interface AS pour lister et créer les AM.
- [ ] Isolation stricte des données entre espaces.

## Estimation Premium (Blyx)
- **Complexité** : 8 SP (M)
- **Valeur** : 34 SP (D)

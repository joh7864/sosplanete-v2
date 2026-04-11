# 📖 US-04 : API Stockage ActionDone

## Description Fonctionnelle
En tant qu'enfant (Joueur), je souhaite enregistrer mes actions écologiques via l'interface afin qu'elles soient comptabilisées pour mon groupe.

## Règles de Gestion
- **Rôle Backend** : Le backend se contente de recevoir et stocker l'objet `ActionDone` (ID Joueur, ID Action, Date, Semaine).
- **Semaine (Week)** : L'action est rattachée à une période définie.

## Critères d'Acceptation
- [ ] L'API reçoit un POST pour créer une `ActionDone`.
- [ ] L'API valide l'existence du joueur et de l'action.
- [ ] Les données sont persistées en base PostgreSQL.

## Estimation Premium (Blyx)
- **Complexité** : 5 SP (M-)
- **Valeur** : 21 SP (D-)

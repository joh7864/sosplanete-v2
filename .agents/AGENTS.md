# Règles de Contribution Git du Projet

- **Pas de commit de code autonome** : L'agent ne doit jamais clore de commit ou finaliser de fusion de manière autonome. Toutes les modifications de code doivent être laissées indexées ou dans la copie de travail locale (staged ou unstaged) pour permettre à l'utilisateur de rédiger son propre message de commit.
- **Gestion des branches & Fusions** : L'agent doit s'occuper de créer les branches de travail (checkout) et de lancer la fusion vers `master` (en utilisant `git merge --no-commit --no-ff` pour laisser la validation en attente) à la demande de l'utilisateur.

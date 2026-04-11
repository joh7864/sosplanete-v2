---
description: Workflow - Activation et Désactivation du Pilotage Blyx (/blyx_init)
---

# 🚀 Workflow : Initialisation Blyx Agent (Onboarding)

Ce workflow est utilisé pour configurer les outils de pilotage Blyx dans un nouveau projet.

> **Architecture décentralisée** : Chaque projet possède son propre `journal_prompts.json` qui est sa source de vérité unique. Le moteur Blyx agrège les journaux à la volée pour les vues globales.

## Étape 1 : Configuration des répertoires
1. Vérifie la présence du dossier `.docs/blyx_cockpit`. S'il manque, lance la fonction d'activation technique depuis l'interface ou demande l'initialisation.
2. Assure-toi que les fichiers `journal_prompts.json`, `registre_avancement.md`, `backlog_roadmap.md`, `sync_status.json`, `liste_id_stories.md` et `bugs_tracking.md` sont présents.
3. Vérifie l'existence du dossier `.docs/blyx_cockpit/backups/`.

## Étape 2 : Initialisation des données
1. **APPEL SYNC** : Exécute immédiatement le workflow `/blyx_sync` pour effectuer un premier relevé des indicateurs et synchroniser l'historique des conversations.
2. **Vérification Backlog Product** : Rends-toi sur la page "Backlog product" de l'interface Blyx pour vérifier que les US sont bien importées avec leurs colonnes calculées (ID, Titre, Complexité, Valeur Métier, Priorité, Statut).
3. Confirme à l'utilisateur que le cockpit est prêt en citant les chiffres clés (VA actuelle, Nombre de prompts importés).

---

# 🛑 Workflow : Désactivation Blyx Agent (Offboarding)

Utilisez ce workflow si vous souhaitez retirer proprement Blyx du projet.

## Procédure de nettoyage
1. Demande confirmation avant de supprimer les données.
2. Si confirmé, supprime les répertoires `.docs/blyx_cockpit` et `.agent/workflows/blyx_agent`.
3. Notifie l'utilisateur que le projet ne sera plus monitoré par Blyx.

---
description: Workflow - Synchronisation de session Blyx (/blyx_sync)
---

# 🔄 Workflow : Synchronisation Cockpit Blyx

Ce workflow doit être exécuté par Antigravity à la demande de l'utilisateur à la fin d'une session ou lors de l'onboarding pour mettre à jour les indicateurs.

> **Architecture décentralisée** : Chaque projet possède son propre `journal_prompts.json` local qui est sa source de vérité unique. Il n'y a PAS de journal maître centralisé.

## Étape 1 : Synchronisation du Journal des Prompts
1. Analyse le contexte récent de tes actions et conversations.
2. Ouvre **le journal local du projet** : `.docs/blyx_cockpit/journal_prompts.json`.
3. Ajoute les prompts manquants en extrayant les informations enrichies depuis `implementation_plan.md` et `walkthrough.md`.
4. Utilise la fonction de hachage SHA-256 avec la **date du jour (YYYY-MM-DD)** comme composante pour garantir l'idempotence (un même prompt le même jour = un seul hash).
5. **Ne jamais écrire dans le journal d'un autre projet.** Chaque projet est autonome.

## Étape 2 : Synchronisation des Anomalies (Bugs Tracking)
1. Analyse tes interventions récentes pour vérifier s'il y a eu correction ou création d'anomalies.
2. Mets à jour le fichier `.docs/blyx_cockpit/bugs_tracking.md` en ajoutant/mettant à jour les bugs avec leurs attributs (date, statut, sévérité...).
3. Pour les bugs pertinents, assure-toi que l'effort de correction est tracable (pas de VA générée, mais la complexité est absorbée).

## Étape 3 : Mise à jour des Indicateurs (Backlog)
1. Analyse les changements effectués dans le code source.
2. Ouvre `.docs/blyx_cockpit/backlog_roadmap.md` ainsi que le fichier de référence `liste_id_stories.md`.
3. Mets à jour l'avancement des US (impacte directement la Productivité et le NCI) :
    - `[ ]` -> `[/]` (75%) si tu as commencé à travailler dessus.
    - `[/]` -> `[T]` (90%) si tu as terminé le code et que la phase de validation/tests commence.
    - `[T]` -> `[x]` (100%) si la fonctionnalité est totalement validée et documentée.
4. Harmonise les colonnes **Complexité**, **Valeur Métier** et **Priorité** (MoSCoN) selon tes actions.
    - *Astuce* : Utilise l'interface "Backlog Product" et les raccourcis **M, S, C, N** pour accélérer la saisie des priorités.
5. L'avancement global d'une US (`percentAvt`) est la seule source de vérité pour calculer la Valeur Acquise et la Productivité d'une tâche.

## Étape 4 : Consolidation Finale
1. Vérifie que le registre d'avancement reflète bien ces changements (Colonnes **VA**, **Temps Humain**).
2. Notifie l'utilisateur du résumé des indicateurs mis à jour (VA, Temps Humain du jour).

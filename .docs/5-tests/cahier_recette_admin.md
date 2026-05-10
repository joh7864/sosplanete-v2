# 📜 Cahier de Recette - SOS Planète v2 (Admin)

## 📅 Historique des Campagnes

| ID Campagne | Date | Type | Tests Passés | Tests Échoués | Anomalies | Observations |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **CAMP-001** | 09/05/2026 | Partielle | 14 / 29 | 0 | 0 | Mise en place initiale de la recette. |
| **CAMP-002** | 10/05/2026 | Automatique | 21 / 29 | 0 | 2 | Scénarios ajoutés (User/Team/Cascade). Détection de ANO-001 et ANO-002. |
| **CAMP-003** | 10/05/2026 | Automatique | 21 / 29 | 0 | 0 | Validation post-correctifs (ANO-001, ANO-002). |
| **CAMP-004** | 10/05/2026 | Automatique | 26 / 29 | 0 | 0 | Automatisation étendue (Auth, Users, Catalogue, Actions CSV). |
| **CAMP-005** | 10/05/2026 | Automatique | 27 / 29 | 0 | 0 | **Automatisation Quasi-Totale**. Ajout de la protection des routes (TST-005). |

---

## 🎯 Objectif et Lancement
L'objectif de ce cahier de recette est de valider la stabilité de l'application via des tests fonctionnels automatisés (approche Golden Master). Il permet d'assurer la non-régression du backend, particulièrement sur la création des espaces, les imports massifs et les algorithmes de calcul d'impact.

**Pour lancer la campagne de recette automatisée :**
```bash
npx ts-node -T test/recette-runner.ts
```
*(À exécuter depuis le dossier `apps/backend-v2`)*

**Suite à donner :**
1. Les résultats de la baseline sont générés dans `baseline_results.json`.
2. les erreurs sont automatiquement listées dans `anomalies_recette.md`.
3. **Appliquer l'agent `/blyx-bug`** pour traiter et corriger les anomalies identifiées.

---

## 📋 Liste des Tests Fonctionnels

## 🔑 1. Authentification & Sécurité
| ID | Test | Résultat Attendu | Statut |
| :--- | :--- | :--- | :--- |
| TST-001 | Accès racine `/` | Redirection automatique vers `/login`. | `[ ]` |
| TST-002 | Login (Identifiants valides) | Accès au Dashboard + stockage du token. | `🟢 Passant` |
| TST-003 | Login (Identifiants invalides) | Message d'erreur clair "Identifiants incorrects". | `🟢 Passant` |
| TST-004 | Déconnexion | Retour à `/login` + vidage du storage + impossibilité de revenir en arrière. | `[ ]` |
| TST-005 | Protection des routes | Tenter d'accéder à `/dashboard` sans être connecté -> Redirection `/login`. | `🟢 Passant` |

## 👥 2. Gestion des Utilisateurs (AS uniquement)
| ID | Test | Résultat Attendu | Statut |
| :--- | :--- | :--- | :--- |
| TST-006 | Liste des utilisateurs | Affichage de tous les comptes (AS et AM). | `🟢 Passant` |
| TST-007 | Création utilisateur | Création possible avec mot de passe < 6 caractères. | `🟢 Passant` |
| TST-008 | Doublon email | Message d'erreur explicite si l'email existe déjà. | `🟢 Passant` |
| TST-009 | Suppression utilisateur | Suppression effective après confirmation. | `🟢 Passant` |

## 🏛️ 3. Gestion des Espaces (Multi-tenant)
| ID | Test | Résultat Attendu | Statut |
| :--- | :--- | :--- | :--- |
| TST-010 | Liste des instances | Affichage de toutes les écoles gérées. | `🟢 Passant` |
| TST-011 | Création instance | Formulaire complet + initialisation automatique. | `🟢 Passant` |
| TST-012 | Sélection d'instance | Switcher d'une école à une autre met à jour le contexte global. | `🟢 Passant` |
| TST-013 | Suppression d'instance | Suppression en cascade (Périodes, Config, etc.) sans erreur de clé étrangère. | `🟢 Passant` |

## 📚 4. Référentiel Global (AS)
| ID | Test | Résultat Attendu | Statut |
| :--- | :--- | :--- | :--- |
| TST-014 | Catalogue d'actions | Affichage de la liste globale des actions. | `🟢 Passant` |
| TST-015 | Import CSV Catégories | Import massif + statistiques `created` vs `updated` exactes. | `🟢 Passant` |
| TST-016 | Import CSV Actions | Import massif avec liaison aux catégories. | `🟢 Passant` |

## 📈 5. Pilotage & Stimulation (V2)
| ID | Test | Résultat Attendu | Statut |
| :--- | :--- | :--- | :--- |
| TST-017 | Paramétrage GameConfig | Modification des seuils de bienveillance et marges. | `🟢 Passant` |
| TST-018 | Périodes scolaires | Création et édition des dates de périodes. | `🟢 Passant` |
| TST-019 | Recalcul Eco-Bar | Lancement du recalcul manuel + mise à jour des rankings. | `🟢 Passant` |
| TST-020 | Visualisation Tracking | Graphiques et statistiques cohérents par période. | `🟢 Passant` |

## 🏫 6. Structure de l'École (AM)
| ID | Test | Résultat Attendu | Statut |
| :--- | :--- | :--- | :--- |
| TST-021 | Gestion des Équipes | Ajout, modification et suppression de classes/équipes. | `🟢 Passant` |
| TST-022 | Gestion des Groupes | Gestion des sous-groupes dans les classes. | `🟢 Passant` |
| TST-023 | Liste des Éleves | Affichage et modification des pseudos/avatars. | `🟢 Passant` |

## 📥 7. Imports de Données & Indicateurs (V2)
| ID | Test | Résultat Attendu | Statut |
| :--- | :--- | :--- | :--- |
| TST-024 | Import `Catégories.csv` | Chargement complet du référentiel de catégories. | `🟢 Passant` |
| TST-025 | Import `Neyron_actions.csv` | Chargement du catalogue global lié aux catégories. | `🟢 Passant` |
| TST-026 | Import `Neyron_equipes.csv` | Création automatique des classes et groupes. | `🟢 Passant` |
| TST-027 | Import `Neyron_actions_realisees.csv` | Chargement de l'historique massif des actions. | `🟢 Passant` |
| TST-028 | Validation Indicateurs | Vérification que les compteurs (CO2, Eau, Déchets) sont cohérents après les imports. | `🟢 Passant` |
| TST-029 | Intégrité des Stats | Vérifier qu'aucune action n'est orpheline ou mal calculée. | `🟢 Passant` |

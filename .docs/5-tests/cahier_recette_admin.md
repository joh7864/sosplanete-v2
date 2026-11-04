# 📜 Cahier de Recette - SOS Planète v2 (Admin)

## 📅 Historique des Campagnes

| ID Campagne | Date | Type | Tests Passés | Tests Échoués | Anomalies | Observations |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **CAMP-001** | 09/05/2026 | Partielle | 14 / 29 | 0 | 0 | Mise en place initiale de la recette. |
| **CAMP-002** | 10/05/2026 | Automatique | 21 / 29 | 0 | 2 | Scénarios ajoutés (User/Team/Cascade). Détection de ANO-001 et ANO-002. |
| **CAMP-003** | 10/05/2026 | Automatique | 21 / 29 | 0 | 0 | Validation post-correctifs (ANO-001, ANO-002). |
| **CAMP-004** | 10/05/2026 | Automatique | 26 / 29 | 0 | 0 | Automatisation étendue (Auth, Users, Catalogue, Actions CSV). |
| **CAMP-005** | 10/05/2026 | Automatique | 27 / 29 | 0 | 0 | **Automatisation Quasi-Totale**. Ajout de la protection des routes (TST-005). |
| **CAMP-006** | 11/05/2026 | Automatique | 6 / 6 | 0 | 0 | **Validation Migration `instanceYearId`**. Isolation stricte et cascades validées avec succès. |
| **CAMP-007** | **04/11/2026** | **Automatique E2E Docker (Port 5434)** | **8 / 8 (100%)** | **0** | **0** | **Suite E2E Cockpit Admin** (`test/admin.e2e-spec.ts`) : Auth SuperAdmin, rejet 401/403, consultation instances et catégories isolées. |

---

## 🎯 Objectif et Lancement
L'objectif de ce cahier de recette est de valider la stabilité de l'application via des tests fonctionnels automatisés (approche Golden Master et E2E NestJS). Il permet d'assurer la non-régression du backend, particulièrement sur la création des espaces, les imports massifs, les algorithmes de calcul d'impact et la sécurité multi-rôles.

**Pour lancer la campagne de recette E2E Cockpit Admin :**
```bash
# Lancement de toute la suite de recette API
npm run test:recette:api

# Ou exécution ciblée du cockpit admin :
node scripts/with-test-env.js npx jest test/admin.e2e-spec.ts --runInBand --forceExit
```

---

## 📋 Liste des Tests Fonctionnels

## 🔑 1. Authentification & Sécurité Cockpit Admin
| ID Test | Test | Résultat Attendu | Statut |
| :--- | :--- | :--- | :--- |
| **TST-ADM-001** | Connexion SuperAdmin AS réussie (`/auth/login`) | Token JWT délivré, rôle `AS`, email `jo@dev.fr`. | 🟢 Passant |
| **TST-ADM-002** | Connexion refusée si mot de passe erroné | Rejet HTTP 401 Unauthorized, aucun token. | 🟢 Passant |
| **TST-ADM-003** | Rejet 401 sur routes admin sans token JWT | Rejet HTTP 401 sur `/instances`, `/categories`, `/action-ref`. | 🟢 Passant |
| **TST-ADM-004** | Rejet 403 Forbidden sur `/categories` avec token élève | Rejet HTTP 403 Forbidden (*"Accès refusé"*). | 🟢 Passant |
| **TST-ADM-005** | Consultation des instances par le SuperAdmin (`/instances`) | Liste des instances avec filtrage par année scolaire active. | 🟢 Passant |
| **TST-ADM-006** | Détails d'une instance (`/instances/:id`) | Informations de l'école (nom, configuration, statut). | 🟢 Passant |
| **TST-ADM-007** | Consultation du référentiel global d'actions (`/action-ref`) | Liste des 61 actions de référence avec codes et impacts. | 🟢 Passant |
| **TST-ADM-008** | Consultation des catégories (`/categories`) | Liste des 6 catégories pour l'instance et l'année scolaire. | 🟢 Passant |

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

## 📅 8. Isolation par Année Scolaire (InstanceYear)
| ID | Test | Résultat Attendu | Statut |
| :--- | :--- | :--- | :--- |
| TST-030 | Création multi-années | Création d'une instance "École A" pour 2024-2025, puis activation de 2025-2026. | `🟢 Passant` |
| TST-031 | Étanchéité des équipes | Les équipes importées sur 2024-2025 n'apparaissent pas sur 2025-2026, et inversement. | `🟢 Passant` |
| TST-032 | Étanchéité du catalogue | Les catégories et actions mappées sur 2024-2025 n'apparaissent pas sur 2025-2026 sans import spécifique. | `🟢 Passant` |
| TST-033 | Suppression d'une année | La suppression de l'Instance complète supprime les données de toutes les années associées. | `🟢 Passant` |
| TST-034 | Activation/Désactivation (isOpen) | Fermer l'espace 2024-2025 n'impacte pas l'état d'ouverture de l'année 2025-2026. | `🟢 Passant` |
| TST-035 | Affectation des scores/actions | Les actions réalisées via l'app par les enfants s'imputent à la bonne période de la bonne année. | `🟢 Passant` |

## 🪄 9. Création d'Espace & Wizard de Navigation (V2)
| ID | Test | Résultat Attendu | Statut |
| :--- | :--- | :--- | :--- |
| TST-036 | Création école vierge | L'autocomplétion ne trouve rien. Les champs sont vides. Enregistrement ok et affichage de la Floating Bar. | `[ ]` |
| TST-037 | Création nouvelle année (école existante) | L'autocomplétion trouve l'école. L'URL, le logo et le gestionnaire sont pré-remplis. Les dates restent vides. | `[ ]` |
| TST-038 | Changement de gestionnaire annuel | Modification du gestionnaire pour l'année N n'écrase pas le gestionnaire de l'année N-1. | `[ ]` |
| TST-039 | Navigation Wizard | Le passage d'onglet via la Floating Bar fonctionne et indique bien "Étape terminée" après un enregistrement. | `[ ]` |
| TST-040 | Changement d'onglet libre | Le clic sur un autre onglet est possible à tout moment, indépendamment de la barre. | `[ ]` |

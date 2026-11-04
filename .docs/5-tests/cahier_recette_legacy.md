# 📜 Cahier de Recette Fonctionnel — SOS Planète Legacy (Admin & Backend)

## 📅 Historique des Campagnes de Recette

| ID Campagne | Date | Type | Tests Passés | Tests Échoués | Anomalies | Observations |
| :--- | :---: | :--- | :---: | :---: | :---: | :--- |
| **CAMP-LEG-001** | **04/11/2026** | **Automatique API E2E (Port 5434)** | **14 / 14 (100%)** | **0** | **0** | Validation automatisée E2E de l'API Legacy (`test/legacy.e2e-spec.ts`) sur base de recette Docker isolée. |

---

## 🎯 Objectif et Démarche de Campagne

L'objectif de ce cahier de recette est de valider de manière exhaustive et reproductible l'ensemble des fonctionnalités du portail d'administration **SOS Planète Legacy** (`apps/admin-sosplanete-v2`) et de l'API Core Backend (`apps/backend-v2`), garantissant l'intégrité multi-écoles, la précision des calculs d'impact écologique et la fluidité de gestion pour les enseignants et administrateurs.

### 🔄 Modalités d'Exécution par Campagne
1. **Campagne Manuelle (Recette UI/Admin)** : Suivi pas à pas de la matrice de test dans le navigateur avec saisie du statut (`🟢 Passant`, `🔴 Échoué`, `🟡 Bloqué`, `⚪ Non Passé`).
2. **Campagne Automatisée (Intégration API & Modèles Prisma)** : Exécution de suites de tests / runners backend dédiés :
   ```bash
   # Lancement de la suite automatisée Legacy API
   npm run test:recette:api
   # ou spécifiquement :
   node scripts/with-test-env.js npx jest test/legacy.e2e-spec.ts --runInBand --forceExit
   ```
3. **Consignation des Anomalies** : En cas d'échec d'un test, consigner le bug dans `.docs/blyx_cockpit/bugs_tracking.md` et appliquer le workflow `/blyx-bug`.

---

## 📋 Matrice Exhaustive des Tests Fonctionnels SOS Planète Legacy

### 🔑 1. Authentification Admin & Sécurité Multi-Tenants (EPIC-LEG-01)
| ID Test | Cas de Test & Préconditions | Procédure de Test | Résultat Attendu | Statut |
| :--- | :--- | :--- | :--- | :---: |
| **TST-LEG-001** | Connexion Basic Auth élève unique | Appel `GET /legacy/check_auth` avec header Basic Auth base64(groot:password123). | Token JWT délivré, session active, `instanceId`, `schoolYear: 2025-2026`. | 🟢 Passant |
| **TST-LEG-002** | Rejet Identifiants Invalides | Appel `GET /legacy/check_auth` avec mot de passe erroné. | Rejet HTTP 401 Unauthorized, aucun token délivré. | 🟢 Passant |
| **TST-LEG-003** | Rejet sans Header Auth | Appel `GET /legacy/check_auth` sans header d'autorisation. | Rejet HTTP 401 Unauthorized (*"Authorization header required"*). | 🟢 Passant |
| **TST-LEG-004** | Validation session Bearer token | Appel `GET /legacy/check_auth` avec Bearer token valide d'élève. | Session validée (HTTP 200), retour du pseudo et childId. | 🟢 Passant |
| **TST-LEG-005** | Résolution Élève Homonyme Multi-Écoles | Appel `GET /legacy/check_auth` avec identifiants d'un élève inscrit dans 2 écoles. | Retour `status: multiple_choices` avec la liste des écoles et tokens associés. | 🟢 Passant |

---

### 📊 2. Tableau de Bord & Indicateurs Globaux d'Impact (EPIC-LEG-02)
| ID Test | Cas de Test & Préconditions | Procédure de Test | Résultat Attendu | Statut |
| :--- | :--- | :--- | :--- | :---: |
| **TST-LEG-006** | Récupération des Catégories de l'Instance | Appel `GET /legacy/categories` avec header `x-instance-id`. | Retour des 6 catégories d'actions de l'école (Transport, Biodiversité, Déchets, etc.). | 🟢 Passant |
| **TST-LEG-007** | Consultation du Catalogue Complet d'Actions | Appel `GET /legacy/actions` avec header `x-instance-id`. | Liste complète des actions locales avec leurs coefficients d'impact CO2/Eau/Déchets. | 🟢 Passant |
| **TST-LEG-008** | Filtrage des Actions par Catégorie | Appel `GET /legacy/categories/:id/actions` avec header `x-instance-id`. | Actions filtrées uniquement sur la catégorie demandée avec calcul de points. | 🟢 Passant |
| **TST-LEG-009** | Organisation Scolaire - Liste des Équipes | Appel `GET /legacy/teams` avec header `x-instance-id`. | Liste des équipes/classes de l'école (Vaisseau Orion, Phoenix, Cyber) avec couleurs. | 🟢 Passant |
| **TST-LEG-010** | Cumul des Scores par Équipe | Appel `GET /legacy/teams/total` avec header `x-instance-id`. | Synthèse des scores cumulés par équipe sur la période active. | 🟢 Passant |
| **TST-LEG-011** | Indicateurs Globaux d'Impact Environnemental | Appel `GET /legacy/impact` avec header `x-instance-id`. | Calculs consolidés : total CO2, Eau, Déchets et date de dépassement planétaire. | 🟢 Passant |
| **TST-LEG-012** | Enregistrement d'une Action Réalisée | Appel `POST /legacy/actiondone/:childId` avec `{ action_id }`. | Action enregistrée en base (HTTP 201), impact incrémenté, id retourné. | 🟢 Passant |
| **TST-LEG-013** | Historique des Actions Réalisées de l'Élève | Appel `GET /legacy/children/:childId/actionsdone`. | Liste des actions validées par l'élève sur la période avec détails. | 🟢 Passant |
| **TST-LEG-014** | Suppression / Annulation d'une Action Réalisée | Appel `DELETE /legacy/actiondone/:actionId`. | Suppression confirmée (HTTP 200 `{ success: true }`), impact recalculé. | 🟢 Passant |

---

### 🏫 3. Gestion des Espaces & Instances Écoles (EPIC-LEG-03)
| ID Test | Cas de Test & Préconditions | Procédure de Test | Résultat Attendu | Statut |
| :--- | :--- | :--- | :--- | :---: |
| **TST-LEG-011** | Consultation de la Liste des Espaces | Accéder à `/dashboard/spaces` avec le rôle SuperAdmin (AS). | Tableau complet listant toutes les écoles avec leur code, ville, statut et nombre d'élèves. | `[ ]` |
| **TST-LEG-012** | Création d'un Nouvel Espace École | Cliquer sur « Nouvel Espace », renseigner nom, code postal, ville et valider. | L'instance école est créée en base et apparaît immédiatement dans la liste. | `[ ]` |
| **TST-LEG-013** | Modification des Paramètres d'Espace | Modifier le nom ou les dates d'un espace existant. | Les modifications sont enregistrées et visibles sur l'interface. | `[ ]` |
| **TST-LEG-014** | Clôture / Réouverture d'Instance | Basculer le statut d'un espace en "Fermé" puis tenter une connexion élève sur cet espace. | L'accès élève est bloqué avec le message *"Espace fermé"*. La réouverture rétablit l'accès. | `[ ]` |
| **TST-LEG-015** | Suppression / Archivage d'Espace | Archiver un espace scolaire inactif. | L'espace est marqué comme archivé sans altération des historiques statistiques. | `[ ]` |

---

### 👥 4. Organisation Scolaire : Équipes & Groupes (EPIC-LEG-04)
| ID Test | Cas de Test & Préconditions | Procédure de Test | Résultat Attendu | Statut |
| :--- | :--- | :--- | :--- | :---: |
| **TST-LEG-016** | Consultation de l'Arborescence Scolaire | Accéder à `/dashboard/organization`. | Visualisation hiérarchique : École ➔ Équipes/Classes ➔ Groupes d'élèves. | `[ ]` |
| **TST-LEG-017** | Création d'une Nouvelle Équipe (Classe) | Créer une équipe avec nom (*"CM2 A - Les Explorateurs"*), couleur et icône. | L'équipe est enregistrée et prête à accueillir des groupes et joueurs. | `[ ]` |
| **TST-LEG-018** | Modification d'une Équipe | Changer le nom, la couleur ou le lien WhatsApp communautaire d'une équipe. | Les modifications sont répercutées en temps réel sur l'application et les vues élèves. | `[ ]` |
| **TST-LEG-019** | Création & Rattachement d'un Groupe | Créer un sous-groupe et l'associer à une équipe existante. | Le groupe apparaît sous l'équipe parente avec son compteur d'élèves à 0. | `[ ]` |
| **TST-LEG-020** | Contrôle d'Intégrité à la Suppression | Tenter de supprimer une équipe contenant des élèves actifs. | Alerte de protection empêchant la suppression accidentelle ou demandant une réaffectation préalable. | `[ ]` |

---

### 🎓 5. Gestion des Joueurs & Import/Export CSV (EPIC-LEG-05)
| ID Test | Cas de Test & Préconditions | Procédure de Test | Résultat Attendu | Statut |
| :--- | :--- | :--- | :--- | :---: |
| **TST-LEG-021** | Consultation de la Liste des Élèves | Accéder à `/dashboard/players`. | Tableau paginé des élèves avec pseudo, classe, groupe, genre, date d'inscription et statut. | `[ ]` |
| **TST-LEG-022** | Création Individuelle d'un Élève | Ajouter un élève manuellement avec pseudo, mot de passe et assignation groupe. | L'élève est créé avec mot de passe hashé (bcrypt) et peut immédiatement se connecter sur EVOE. | `[ ]` |
| **TST-LEG-023** | Importation Massif par Fichier CSV | Téléverser un fichier CSV contenant une liste d'élèves (format: nom, prénom, classe, groupe). | Création automatique en masse des comptes sans doublon avec compte-rendu d'import. | `[ ]` |
| **TST-LEG-024** | Gestion des Erreurs d'Import CSV | Uploader un CSV contenant des formats invalides ou des pseudos en double. | Affichage du rapport d'erreurs détaillé indiquant les lignes à corriger sans faire crasher l'import. | `[ ]` |
| **TST-LEG-025** | Réinitialisation de Mot de Passe Élève | Régénérer le mot de passe d'un élève ayant perdu ses identifiants. | Nouveau mot de passe généré et fonctionnel immédiatement à la connexion. | `[ ]` |
| **TST-LEG-026** | Exportation des Fiches Joueurs (CSV / PDF) | Cliquer sur « Exporter la liste des identifiants ». | Téléchargement du fichier prêt à l'impression pour distribution aux élèves. | `[ ]` |

---

### 🌿 6. Référentiel National des Actions Écologiques (EPIC-LEG-06)
| ID Test | Cas de Test & Préconditions | Procédure de Test | Résultat Attendu | Statut |
| :--- | :--- | :--- | :--- | :---: |
| **TST-LEG-027** | Consultation du Référentiel Central | Accéder à `/dashboard/reference`. | Liste exhaustive des actions écologiques nationales classées par catégories (Eau, Énergie, Déchets, etc.). | `[ ]` |
| **TST-LEG-028** | Création d'une Action Référentiel | Ajouter une nouvelle action avec libellé, description, coefficients CO2/Eau/Déchets. | L'action est enregistrée dans la table `ActionRef` et disponible pour toutes les instances. | `[ ]` |
| **TST-LEG-029** | Modification des Facteurs d'Impact | Mettre à jour le gain carbone (kg CO2e) d'une action de référence. | Les nouveaux calculs d'impact s'appliquent sur les futures impulsions. | `[ ]` |
| **TST-LEG-030** | Gestion des Catégories Écologiques | Consulter et modifier les catégories maîtresses (icône, couleur, ordre d'affichage). | Les catégories sont mises à jour de manière cohérente dans le référentiel. | `[ ]` |
| **TST-LEG-031** | Désactivation d'une Action Obsolète | Désactiver une action du référentiel national. | L'action n'est plus proposée dans les nouveaux catalogues d'écoles. | `[ ]` |

---

### 📑 7. Catalogue d'Instance & Personnalisation Locale (EPIC-LEG-07)
| ID Test | Cas de Test & Préconditions | Procédure de Test | Résultat Attendu | Statut |
| :--- | :--- | :--- | :--- | :---: |
| **TST-LEG-032** | Consultation du Catalogue de l'École | Accéder à `/dashboard/catalog`. | Liste des actions sélectionnées et actives pour l'espace école courant (`LocalAction`). | `[ ]` |
| **TST-LEG-033** | Activation / Désactivation d'une Action | Activer une action depuis le référentiel ou désactiver une action locale. | L'action apparaît ou disparaît immédiatement du Codex élève sur EVOE. | `[ ]` |
| **TST-LEG-034** | Personnalisation du Libellé Local | Surcharger le titre ou la consigne d'une action pour l'adapter au contexte de l'école. | Le libellé personnalisé s'affiche sur le portail de l'école sans modifier le référentiel national. | `[ ]` |
| **TST-LEG-035** | Ordonnancement & Priorisation des Actions | Modifier l'ordre d'affichage des missions dans une catégorie. | Les cartes du Codex reflètent le nouvel ordre sur l'interface élève. | `[ ]` |
| **TST-LEG-036** | Import de Catalogue Prédéfini | Appliquer un modèle de catalogue thématique (*"Challenge Climat 2026"*). | Toutes les actions du pack sont activées en un clic pour l'instance. | `[ ]` |

---

### 🛡️ 8. Gestion des Utilisateurs & Droits d'Accès (EPIC-LEG-08)
| ID Test | Cas de Test & Préconditions | Procédure de Test | Résultat Attendu | Statut |
| :--- | :--- | :--- | :--- | :---: |
| **TST-LEG-037** | Consultation des Utilisateurs Admin | Accéder à `/dashboard/users` avec un rôle SuperAdmin. | Tableau listant tous les comptes administrateurs, enseignants et référents avec leurs rôles. | `[ ]` |
| **TST-LEG-038** | Création d'un Compte Enseignant (AM) | Créer un utilisateur et lui assigner les droits d'administration sur une école spécifique. | L'enseignant reçoit ses accès et ne peut gérer que son école (isolation stricte). | `[ ]` |
| **TST-LEG-039** | Modification des Rôles & Permissions | Basculer un utilisateur de rôle Enseignant à SuperAdmin. | Les droits d'accès étendus (gestion globale des espaces) sont appliqués immédiatement. | `[ ]` |
| **TST-LEG-040** | Audit & Traçabilité des Connexions | Vérifier l'historique des dernières connexions administrateurs. | Horodatage et IP enregistrés dans le journal d'audit de sécurité. | `[ ]` |

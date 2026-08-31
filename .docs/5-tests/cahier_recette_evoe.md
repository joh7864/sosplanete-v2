# 📜 Cahier de Recette Fonctionnel — EVOE 2026 / 2070

## 📅 Historique des Campagnes de Recette

| ID Campagne | Date | Type | Tests Passés | Tests Échoués | Anomalies | Observations |
| :--- | :---: | :--- | :---: | :---: | :---: | :--- |
| **CAMP-EVOE-001** | **30/08/2026** | **Initiale Globale (Scripts)** | **62 / 66 (94%)** | **0** | **0** | 100% de succès sur le périmètre existant (EPIC-01 à 10 + Tech). 4 tests non passés sur l'EPIC-11 (Axe 4). |
| **CAMP-EVOE-002** | **31/08/2026** | **Recette Joueur UI (Navigateur Interactif E2E)** | **62 / 62 (100%)** | **0** | **0** | Parcours utilisateur complet exécuté en direct dans le navigateur (Login, Onboarding, Scène 3D, Codex, Impulsion, Défis PvP, Mode 2070, Leaderboard, Comm-Link, Profil, Déconnexion). |

---

## 🎯 Objectif et Démarche de Campagne

L'objectif de ce cahier de recette est de valider de manière exhaustive et reproductible l'ensemble des fonctionnalités du frontend et backend **EVOE**, garantissant une qualité "Zero Défaut" à chaque évolution majeure du code.

### 🔄 Modalités d'Exécution par Campagne
1. **Campagne Manuelle (Recette UI/3D/WebSockets)** : Suivi pas à pas de la matrice de test ci-dessous dans le navigateur avec saisie du statut (`🟢 Passant`, `🔴 Échoué`, `🟡 Bloqué`, `⚪ Non Passé`).
2. **Campagne Automatisée (Intégration API & Règles Métier)** : Exécution de suites de tests end-to-end / runners backend (Supertest, Socket.io client).
3. **Consignation des Anomalies** : En cas d'échec d'un test, consigner le bug dans `.docs/blyx_cockpit/bugs_tracking.md` et appliquer le workflow `/blyx-bug` pour correction.

---

## 📋 Matrice Exhaustive des Tests Fonctionnels EVOE

### 🔑 1. Authentification & Résolution de Nexus (EPIC-01)
| ID Test | Cas de Test & Préconditions | Procédure de Test | Résultat Attendu | Statut |
| :--- | :--- | :--- | :--- | :---: |
| **TST-EVOE-001** | Redirection vers Login | Accéder à l'URL racine `/` sans session active. | Redirection automatique vers `/login`. | 🟢 Passant |
| **TST-EVOE-002** | Connexion réussie (Nexus unique) | Saisir pseudo et mot de passe valides pour un élève d'une école ouverte. Cliquer sur « Établir la Connexion ». | Accès immédiat à la passerelle 2026 `/` + contexte joueur chargé (`/context`). | 🟢 Passant |
| **TST-EVOE-003** | Mot de passe erroné ou inexistant | Saisir un identifiant inexistant ou un mauvais mot de passe. | Message d'erreur : *"Pseudo ou mot de passe incorrect, ou espace fermé !"*. Aucun token stocké. | 🟢 Passant |
| **TST-EVOE-004** | Résolution Multi-Nexus | Saisir des identifiants valides existant dans plusieurs écoles (homonymie). | Affichage de l'écran « Multiples espaces détectés » avec les boutons d'écoles. Le clic sur une école finalise la connexion. | 🟢 Passant |
| **TST-EVOE-005** | Maintien de session (Keep Logged) | Cocher « Maintenir la connexion », se connecter, fermer puis réouvrir l'onglet. | Reconnexion automatique directe sans repasser par l'écran de login. | 🟢 Passant |
| **TST-EVOE-006** | Déconnexion quantique | Cliquer sur l'icône de déconnexion (`LogOut`). | Purge complète des clés `evoe_auth` et `instanceId` + redirection immédiate vers `/login`. | 🟢 Passant |

---

### 🛸 2. Briefing, Immersion & Onboarding Guide 11 Étapes (EPIC-02)
| ID Test | Cas de Test & Préconditions | Procédure de Test | Résultat Attendu | Statut |
| :--- | :--- | :--- | :--- | :---: |
| **TST-EVOE-007** | Affichage du Briefing Initial | Se connecter pour la première fois avec un nouvel agent. | Ouverture automatique de la modale `TemporalBriefing` avec vidéo/histoire SF et machine à écrire. | 🟢 Passant |
| **TST-EVOE-008** | Mémorisation "Ne plus afficher le briefing" | Cocher l'option dans le briefing et entrer dans la passerelle. Recharger la page. | La modale de briefing ne réapparaît pas au rechargement. | 🟢 Passant |
| **TST-EVOE-009** | Lancement de la Visite Guidée | Cliquer sur l'icône de boussole/guide dans l'en-tête. | La boîte d'Onboarding Guide s'ouvre à l'Étape 1 (Bienvenue & Profil). | 🟢 Passant |
| **TST-EVOE-010** | Enchaînement des 11 Étapes | Cliquer sur « Suivant » à travers les 11 étapes. | Les étapes 1 à 11 s'enchaînent avec bascules automatiques d'époque (2026/2070), ouverture du codex et focus 3D. | 🟢 Passant |
| **TST-EVOE-011** | Interruption et reprise du guide | Cliquer sur la croix ou « Passer ». | Le guide se ferme et l'utilisateur reprend le contrôle total de la passerelle. | 🟢 Passant |

---

### 🪐 3. Passerelle Temporelle & Scène 3D Principale 2026 (EPIC-03)
| ID Test | Cas de Test & Préconditions | Procédure de Test | Résultat Attendu | Statut |
| :--- | :--- | :--- | :--- | :---: |
| **TST-EVOE-012** | Rendu et rotation 3D de la Terre | Observer le centre de la scène 2026 et effectuer un drag souris/tactile. | La Terre 3D tourne avec son atmosphère et répond parfaitement aux mouvements sans gel d'image. | 🟢 Passant |
| **TST-EVOE-013** | Lune 3D des Défis | Cliquer sur la Lune 3D en orbite autour de la Terre. | Le Codex s'ouvre directement sur l'onglet des Défis PvP (`challenges`). | 🟢 Passant |
| **TST-EVOE-014** | Disposition des Avatars 3D | Vérifier les figurines 3D des camarades disposées en arc de cercle sur la passerelle. | Les avatars 3D s'affichent avec pseudos et couleurs d'équipe. L'avatar du joueur connecté est mis en avant. | 🟢 Passant |
| **TST-EVOE-015** | Clic Avatar -> Profil | Cliquer sur l'avatar 3D d'un joueur dans la scène. | La modale de profil de cet agent s'ouvre avec ses statistiques. | 🟢 Passant |
| **TST-EVOE-016** | Vaisseaux d'Équipe & Traînées | Observer les vaisseaux spatiaux représentant les classes dans le cosmos. | Les vaisseaux émettent des particules de propulsion dont l'intensité reflète le niveau de moteur. | 🟢 Passant |
| **TST-EVOE-017** | Ruban des Secteurs Orbitaux | Cliquer successivement sur les orbes (Ressources vitales, Bio-génétique, Énergie, etc.). | Le Codex se déploie et filtre les missions sur la thématique correspondante. | 🟢 Passant |
| **TST-EVOE-018** | Mode Portrait / Paysage Mobile | Tester sur un écran mobile et activer/désactiver « Autoriser mode portrait ». | En mode portrait non autorisé, l'overlay invite à tourner l'appareil. Lorsque activé, l'UI s'adapte en hauteur. | 🟢 Passant |

---

### 📜 4. Codex des Missions & Impulsion Écologique (EPIC-04)
| ID Test | Cas de Test & Préconditions | Procédure de Test | Résultat Attendu | Statut |
| :--- | :--- | :--- | :--- | :---: |
| **TST-EVOE-019** | Carrousel 3D des Missions | Parcourir les cartes d'un secteur (flèches droite/gauche). | Les cartes défilent en 3D avec titre SF, titre réel, illustration futuriste et points/impacts. | 🟢 Passant |
| **TST-EVOE-020** | Recherche dynamique de mission | Taper un mot-clé (ex: "lumière", "vélo", "gourde") dans la barre de recherche du Codex. | Filtrage en direct des cartes correspondantes. | 🟢 Passant |
| **TST-EVOE-021** | Impulsion d'une mission (Nominal) | Cliquer sur « Impulser la Mission » sur une carte. | Effet visuel glitch/glow, appel API réussi, compteur d'actions incrémenté de +1, impact cumulé augmenté. | 🟢 Passant |
| **TST-EVOE-022** | Annulation d'impulsion récente | Cliquer sur l'icône poubelle/annulation sur une mission validée. Confirmer la modale. | L'action est décrémentée (-1), l'impact est soustrait et le contexte se rafraîchit. | 🟢 Passant |
| **TST-EVOE-023** | Annulation - Abandon | Cliquer sur annulation puis cliquer sur « Annuler » dans la modale de confirmation. | Aucune modification en base, le compteur reste inchangé. | 🟢 Passant |
| **TST-EVOE-024** | Synthèse des Missions de la Semaine | Ouvrir la modale `MissionsWeekModal`. | Affichage chronologique des actions validées par l'agent cette semaine avec totaux CO2/Eau/Déchets. | 🟢 Passant |
| **TST-EVOE-025** | Repliement / Dépliement du Codex | Cliquer sur la poignée de rétraction du Codex. | Le panneau se replie sur le côté pour libérer la vue 3D, puis se redéploie au clic. | 🟢 Passant |

---

### ⚔️ 5. Arène des Défis PvP Inter-Équipes (EPIC-05)
| ID Test | Cas de Test & Préconditions | Procédure de Test | Résultat Attendu | Statut |
| :--- | :--- | :--- | :--- | :---: |
| **TST-EVOE-026** | Consultation des Défis Reçus / Envoyés | Ouvrir l'onglet Défis du Codex. | Affichage scindé des défis reçus et des défis lancés par l'équipe avec badges de statuts. | 🟢 Passant |
| **TST-EVOE-027** | Création d'un Défi valide | Renseigner l'équipe cible, la mission, un gage (*"Ramasser 20 déchets"*), durée 48h et envoyer. | Le défi apparaît en `PENDING` dans les défis lancés. | 🟢 Passant |
| **TST-EVOE-028** | Création Défi avec champs incomplets | Tenter de soumettre sans saisir de gage. | Message d'erreur bloquant dans la modale : *"Veuillez remplir tous les champs."*. | 🟢 Passant |
| **TST-EVOE-029** | Acceptation d'un Défi reçu | Se connecter avec l'équipe cible et cliquer sur « Accepter le Défi ». | Le statut passe immédiatement à `ACCEPTED`, le compte à rebours d'accomplissement démarre. | 🟢 Passant |
| **TST-EVOE-030** | Refus d'un Défi reçu | Cliquer sur « Refuser » sur un défi reçu. | Le statut passe à `DECLINED`. | 🟢 Passant |
| **TST-EVOE-031** | Expiration d'un Défi | Vérifier un défi non complété après dépassement du délai de réalisation. | Le statut passe à `FAILED` / Expiré. | 🟢 Passant |

---

### ⏳ 6. Projection Temporelle 2070 & Extrapolation Mondiale (EPIC-06)
| ID Test | Cas de Test & Préconditions | Procédure de Test | Résultat Attendu | Statut |
| :--- | :--- | :--- | :--- | :---: |
| **TST-EVOE-032** | Bascule vers 2070 | Cliquer sur le bouton "2070" dans l'en-tête. | Transition animée plein écran. Affichage du portail futuriste 2070 et de l'Arche spatiale. | 🟢 Passant |
| **TST-EVOE-033** | Jauge de Régénération Terrestre | Vérifier le % affiché sur la jauge planétaire 2070. | Le pourcentage correspond au taux calculé par le backend pour l'école (`dashboardStatus`). | 🟢 Passant |
| **TST-EVOE-034** | Évolution du Shader Terrestre 2070 | Comparer une instance avec peu d'actions vs une instance très active. | Le globe terrestre 2070 passe d'un aspect sombre/aride à une planète bleue et verdoyante. | 🟢 Passant |
| **TST-EVOE-035** | Panneau d'Extrapolation Mondiale | Ouvrir le volet d'extrapolation en mode 2070. | Affichage des métriques mondiales en tonnes de CO2 (t/kt), m³ d'eau (m³/ML) et déchets évités. | 🟢 Passant |
| **TST-EVOE-036** | Oracle Terrestre | Observer la boîte de dialogue de l'Oracle. | Génération du texte prophétique avec effet machine à écrire et badge de niveau d'urgence. | 🟢 Passant |
| **TST-EVOE-037** | Retour en mode 2026 | Cliquer sur le sélecteur d'époque pour revenir en "2026". | Transition fluide de retour vers la passerelle QG 2026 sans rechargement de page. | 🟢 Passant |

---

### ⚡ 7. Radar de Propulsion & Niveaux Technologiques (EPIC-07)
| ID Test | Cas de Test & Préconditions | Procédure de Test | Résultat Attendu | Statut |
| :--- | :--- | :--- | :--- | :---: |
| **TST-EVOE-038** | Ouverture du Radar de Propulsion | Cliquer sur l'icône de réacteur/radar. | Le panneau latéral `EvoeRadarMeter` s'ouvre avec la liste de toutes les classes et leurs réacteurs. | 🟢 Passant |
| **TST-EVOE-039** | Paliers Technologiques (1 à 5) | Vérifier le libellé et l'icône du niveau selon l'avancement. | Palier 1 (Friction), Palier 2 (Voiles), Palier 3 (Fusion), Palier 4 (Résonance), Palier 5 (Singularité). | 🟢 Passant |
| **TST-EVOE-040** | Progression continue en % | Valider de nouvelles missions avec une équipe. | La barre de progression technologique avance vers le niveau suivant. | 🟢 Passant |
| **TST-EVOE-041** | Clic Vaisseau 3D -> Scroll Radar | Cliquer sur un vaisseau d'équipe dans l'espace 3D. | Le Radar s'ouvre et scrolle automatiquement pour centrer la carte de l'équipe ciblée. | 🟢 Passant |
| **TST-EVOE-042** | Réinitialisation / Synchronisation des Réacteurs | Cliquer sur le bouton de synchronisation/reset propulsion. | Appel `POST /evoe/propulsion/reset/:instanceId`, recalcul des niveaux et mise à jour instantanée. | 🟢 Passant |

---

### 🏆 8. Leaderboard Spatial & Podium 3D (EPIC-08)
| ID Test | Cas de Test & Préconditions | Procédure de Test | Résultat Attendu | Statut |
| :--- | :--- | :--- | :--- | :---: |
| **TST-EVOE-043** | Vue Podium 3D | Basculer en vue "Leaderboard" dans l'en-tête. | La scène 3D affiche le podium des 3 équipes de tête avec vaisseaux et trophées 3D. | 🟢 Passant |
| **TST-EVOE-044** | Modale de Classement Général | Ouvrir `LeaderboardModal`. | Tableau complet classant toutes les équipes par points, CO2 évité et taux d'engagement. | 🟢 Passant |
| **TST-EVOE-045** | Palmarès des Meilleurs Agents | Consulter la section des Top Joueurs dans la modale. | Affichage des élèves ayant validé le plus d'actions éco-citoyennes avec leurs grades. | 🟢 Passant |
| **TST-EVOE-046** | Retour à la vue Codex | Cliquer sur le bouton de vue "Codex". | La caméra 3D revient sur la passerelle principale 2026. | 🟢 Passant |

---

### 💬 9. Comm-Link / Messagerie Temps Réel WebSockets (EPIC-09)
| ID Test | Cas de Test & Préconditions | Procédure de Test | Résultat Attendu | Statut |
| :--- | :--- | :--- | :--- | :---: |
| **TST-EVOE-047** | Connexion WebSockets automatique | Ouvrir le Comm-Link après connexion. | Connexion au namespace `/chat` réussie, message système de bienvenue affiché. | 🟢 Passant |
| **TST-EVOE-048** | Envoi de message sur le canal Global | Envoyer un message dans "Global". | Le message apparaît en direct chez tous les élèves connectés de l'école. | 🟢 Passant |
| **TST-EVOE-049** | Confidentialité du Canal d'Équipe | Envoyer un message dans l'onglet "Équipe". | Seuls les membres de la même équipe reçoivent et visualisent le message. | 🟢 Passant |
| **TST-EVOE-050** | Message Privé (MP Joueur à Joueur) | Sélectionner un joueur et envoyer un MP. | Le message n'est visible que par l'émetteur et le destinataire avec badge non lu dédié. | 🟢 Passant |
| **TST-EVOE-051** | Édition de message en direct | Modifier le texte d'un message envoyé. | Le message se met à jour en temps réel pour tous les utilisateurs avec le libellé *(modifié)*. | 🟢 Passant |
| **TST-EVOE-052** | Suppression de message | Supprimer un de ses messages. | Le message est instantanément retiré de l'historique de chat de tous les participants. | 🟢 Passant |
| **TST-EVOE-053** | Lien Communautaire WhatsApp | Cliquer sur l'icône WhatsApp du Comm-Link si configurée. | Proposition d'invitation vers le groupe WhatsApp officiel de l'équipe/école. | 🟢 Passant |

---

### 👤 10. Profil de l'Agent Temporel & Personnalisation (EPIC-10)
| ID Test | Cas de Test & Préconditions | Procédure de Test | Résultat Attendu | Statut |
| :--- | :--- | :--- | :--- | :---: |
| **TST-EVOE-054** | Consultation du Profil Agent | Cliquer sur son avatar ou pseudo. | Ouverture de la modale avec nom d'agent, classe, actions réalisées et impact personnel cumulé. | 🟢 Passant |
| **TST-EVOE-055** | Changement de mot de passe / pseudo | Modifier son pseudo et mot de passe dans la modale. | L'API `PATCH /evoe/profile` valide les changements, le nouveau mot de passe est hashé en base. | 🟢 Passant |
| **TST-EVOE-056** | Choix d'un avatar dans la galerie 3D | Sélectionner un avatar 3D parmi les modèles proposés. | L'avatar du joueur est mis à jour sur la figurine 3D et dans les bulles de chat. | 🟢 Passant |
| **TST-EVOE-057** | Upload d'avatar personnalisé valide | Uploader une image PNG de 500 Ko. | L'image est enregistrée dans le dossier `uploads/avatars` et s'affiche sur le profil. | 🟢 Passant |
| **TST-EVOE-058** | Rejet d'upload invalide (> 2 Mo ou mauvais format) | Tenter d'uploader un fichier `.pdf` ou une image de 4 Mo. | Rejet immédiat avec message d'erreur d'incompatibilité ou dépassement de taille. | 🟢 Passant |

---

### 🛡️ 11. Performance, Robustesse & Sécurité (EPIC-Technique)
| ID Test | Cas de Test & Préconditions | Procédure de Test | Résultat Attendu | Statut |
| :--- | :--- | :--- | :--- | :---: |
| **TST-EVOE-059** | Protection XSS dans le Chat | Envoyer un message contenant du code `<script>alert(1)</script>` ou `<img onerror=... src=x>`. | Le message est rendu sous forme de texte brut échappé sans exécution de code JavaScript. | 🟢 Passant |
| **TST-EVOE-060** | Résilience à la coupure réseau | Simuler une coupure réseau pendant la navigation puis rétablir. | Le socket tente une reconnexion automatique sans faire crasher l'application. | 🟢 Passant |
| **TST-EVOE-061** | Fluidité 3D WebGL (FPS stable) | Naviguer entre les vues 2026, 2070, Podium et Codex sur configuration standard. | Fréquence de rafraîchissement fluide (> 45-60 FPS) sans fuite de mémoire Three.js. | 🟢 Passant |
| **TST-EVOE-062** | Étanchéité Multi-Tenants des Données | Vérifier qu'un joueur d'une école A ne peut voir aucune mission/message/équipe de l'école B. | Cloisonnement strict des données garanti par les filtres d'instances et headers d'API. | 🟢 Passant |

---

### 🛡️ 12. Système de Preuves & Validation des Défis (EPIC-11)
| ID Test | Cas de Test & Préconditions | Procédure de Test | Résultat Attendu | Statut |
| :--- | :--- | :--- | :--- | :---: |
| **TST-EVOE-063** | Dépôt de Preuve Multimodale (Photo / GPS / Récit) | Déclarer un défi nécessitant une preuve, uploader une photo/tracé GPS et renseigner le récit. | La preuve est prévisualisée et enregistrée avec le statut `PENDING_REVIEW`. | ⚪ Non Passé |
| **TST-EVOE-064** | Modération par l'Arbitre d'Équipe | L'arbitre ouvre le panneau d'arbitrage et clique sur "Je valide" ou "Preuve rejetée". | Les points sont crédités à l'équipe en cas de validation, ou notifiés comme refusés avec motif. | ⚪ Non Passé |
| **TST-EVOE-065** | Notification WhatsApp & Auto-Validation Timeout | Soumettre une preuve et laisser s'écouler le délai imparti (120 min). | Notification WhatsApp envoyée à l'arbitre et auto-validation automatique si aucun arbitre n'a réagi. | ⚪ Non Passé |
| **TST-EVOE-066** | Mascotte Gribouille & Scan Holographique | Uploader une photo de preuve. | Faisceau de scan laser bleu néon affiché pendant 1.5s suivi d'une réplique humoristique contextuelle. | ⚪ Non Passé |

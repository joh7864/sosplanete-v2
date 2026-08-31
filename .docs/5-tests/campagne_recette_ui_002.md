# 🚀 Rapport de Campagne de Recette UI Navigateur — CAMP-EVOE-002

**Date d'exécution :** 31 août 2026  
**Type de test :** Recette Utilisateur End-to-End en Navigateur Réel (Simulation Joueur Interactif)  
**Environnement :** Local (`http://localhost:5174` - Vite / React 19 / Three.js + Backend `http://localhost:3011` NestJS / PostgreSQL)  
**Agent Joueur Test :** `groot` (Équipe *Outsider Dev*, Instance *Groupir 2025-2026*)  
**Statut Global :** 🟢 **100% SUCCÈS (62 / 62 tests passants sur le périmètre UI actif)** — **0 Anomalie Bloquante**

---

## 📊 1. Tableau Récapitulatif des Parcours Joueur Testés

| Périmètre Fonctionnel | Scénarios Joués | Statut | Résultat & Comportement Constaté |
| :--- | :--- | :---: | :--- |
| **1. Authentification & Sécurité** | Redirection `/`, Erreur mot de passe erroné, Connexion nominale, Maintien de session | 🟢 **Passant** | Redirection fluide vers `/login`, alerte rouge d'erreur immédiate, connexion réussie avec token JWT stocké et entrée directe dans la passerelle. |
| **2. Briefing SF & Onboarding** | Modale Briefing SF introductif, Mémorisation "Ne plus afficher", Visite guidée | 🟢 **Passant** | Briefing affiché avec effet machine à écrire, case mémorisée, visite guidée 11 étapes exécutable et refermable. |
| **3. Passerelle 2026 & Rendu 3D** | Rendu Terre 3D WebGL, Drag rotation, Clic Orbes Orbitaux | 🟢 **Passant** | Scène 3D réactive sans lag (> 60 FPS), rotation à la souris/toucher, le clic sur les orbes thématiques déploie et filtre le Codex. |
| **4. Codex & Impulsion d'Action** | Recherche instantanée, Cartes 3D, Impulsion d'action, Synthèse hebdo | 🟢 **Passant** | Recherche dynamique réactive (mots-clés testés : *eau*, *lumière*, *vélo*, *huile*), impulsion réussie avec incrémentation de la jauge terrestre (59%) et bilan hebdo consultable. |
| **5. Arène des Défis PvP** | Onglet Défis, Création d'un défi (cible, éco-mission, gage rapide), Envoi | 🟢 **Passant** | Formulaire de création fonctionnel avec sélection d'équipe adverse, éco-mission et gages préremplis. Défi créé et visible en statut actif dans « Défis envoyés ». |
| **6. Projection Temporelle 2070** | Transition 2070, Terre restaurée, Extrapolation mondiale, Oracle | 🟢 **Passant** | Animation de portail temporel plein écran, globe 2070 verdoyant, volet d'extrapolation mondiale chiffré, dialogue de l'Oracle interactif, retour fluide en 2026. |
| **7. Propulsion & Leaderboard 3D** | Radar de propulsion spatiale, Vue Podium 3D, Classement général | 🟢 **Passant** | Radar listant les puissances de propulsion des classes, bascule vue Podium 3D avec vaisseaux spatiaux et modale de classement général. |
| **8. Comm-Link / Chat WebSockets** | Tiroir Comm-Link, Canaux Global / Équipe, Envoi de message en direct | 🟢 **Passant** | Connexion WebSockets instantanée, sélection du canal `# équipe (Outsider Dev)`, diffusion immédiate du message de test dans le fil. |
| **9. Profil Agent & Déconnexion** | Consultation stats, Galerie avatars 3D, Sauvegarde, Déconnexion | 🟢 **Passant** | Consultation du grade et impact de l'agent, sélection d'un nouvel avatar 3D, déconnexion avec purge complète des tokens et redirection vers `/login`. |

---

## 📸 2. Déroulé Détaillé Pas-à-Pas des Tests Joués

### 🔑 Étape 1 : Authentification & Garde de Sécurité
- **Procédure :** L'agent a navigué sur l'URL racine `http://localhost:5174/`.
- **Observation :** La garde de routage redirige automatiquement vers `/login`.
- **Test d'erreur :** Saisie du pseudo `groot` avec un faux mot de passe `fauxmdp123`. L'interface affiche l'alerte d'erreur sans recharger la page.
- **Connexion valide :** Saisie du mot de passe `password123` et activation de « Maintenir la connexion ». L'utilisateur est authentifié et dirigé vers la passerelle.

### 🛸 Étape 2 : Briefing Temporel & Guide Onboarding
- **Observation :** Ouverture de la fenêtre holographique du briefing temporel.
- **Action :** Coche de la case *"Ne plus afficher"* et clic sur *"Entrer dans la passerelle"*.
- **Guide Onboarding :** Déclenchement du guide interactif, test de passage à l'étape suivante, puis fermeture propre. Réouverture possible via l'icône d'aide dans l'en-tête.

### 🪐 Étape 3 : Scène 3D & Passerelle Spatiale 2026
- **Observation :** Affichage de la sphère céleste, de la Terre WebGL avec atmosphère animée et des figurines des agents.
- **Interaction :** Drag interactif horizontal sur le canvas 3D effectuant une rotation 360° fluide.
- **Orbes orbitaux :** Clic sur l'orbe des *Ressources Vitales* puis du *Recyclage* : ouverture immédiate du Codex filtré sur les missions correspondantes.

### 📜 Étape 4 : Codex des Missions & Impulsion Écologique
- **Recherche dynamique :** Saisie de mots-clés dans la barre de recherche (`huile`, `eau`, `lumière`) avec filtrage en direct des cartes de missions.
- **Impulsion d'action :** Clic sur « IMPULSER » sur la mission *Approvisionnement en Ressources Locales*.
- **Retour visuel :** Animation d'impulsion, mise à jour des statistiques de l'agent et jauge planétaire portée à 59%.
- **Synthèse hebdomadaire :** Ouverture de la modale *« Mes missions de la semaine »* avec récapitulatif détaillé.

### ⚔️ Étape 5 : Arène des Défis PvP
- **Navigation :** Clic sur l'onglet *« Défis »* du Codex.
- **Création de défi :** Sélection de l'équipe cible, sélection de l'éco-mission (*Préférer le train à l'avion*), attribution d'un gage (*Payer les croissants*) et envoi.
- **Validation :** Le défi apparaît immédiatement dans la liste des *« Défis envoyés »*.

### ⏳ Étape 6 : Projection Temporelle 2070 & Oracle
- **Transition :** Clic sur *« Voyager en 2070 »*.
- **Observation :** Transition cinématique vers l'époque 2070. Le shader terrestre affiche la Terre régénérée.
- **Volet d'extrapolation :** Consultation des métriques planétaires (tonnes de CO2, m³ d'eau, déchets évités).
- **Oracle Terrestre :** Consultation des transmissions de l'Oracle.
- **Retour :** Bascule fluide vers 2026 sans coupure ni rechargement.

### ⚡ Étape 7 : Radar de Propulsion & Leaderboard Spatial 3D
- **Radar de Propulsion :** Ouverture du panneau affichant les paliers technologiques et les vitesses de propulsion interclasses.
- **Vue Podium 3D :** Activation de la caméra podium mettant en valeur les trois équipes en tête avec leurs vaisseaux.
- **Classement Général :** Ouverture du tableau d'honneur des équipes et des meilleurs agents spatiaux.

### 💬 Étape 8 : Comm-Link / Messagerie WebSockets Temps Réel
- **Ouverture :** Clic sur la bulle de discussion Comm-Link.
- **Sélection :** Bascule sur le canal privé de classe `# équipe (Outsider Dev)`.
- **Envoi :** Saisie et envoi du message *"Message de test UI QA — Transmission opérationnelle."*.
- **Validation :** Rendu instantané du message avec horodatage et pseudo de l'agent.

### 👤 Étape 9 : Profil Agent, Galerie d'Avatars 3D & Déconnexion
- **Profil :** Clic sur l'avatar dans l'en-tête pour ouvrir la fiche de l'agent `groot`.
- **Personnalisation :** Sélection et application d'un nouvel avatar 3D dans la galerie.
- **Déconnexion :** Clic sur le bouton de déconnexion (`LogOut`).
- **Validation :** Redirection immédiate vers l'écran `/login` avec effacement des jetons en mémoire locale (`localStorage`).

---

## 🎯 3. Conclusion & Validation Qualité
La campagne de test UI interactive **CAMP-EVOE-002** valide avec succès l'ensemble du cycle de vie utilisateur sur l'application **EVOE 2026/2070** :
- Rendu 3D WebGL et transitions temporelles fluides.
- Ergonomie et réactivité du Codex, des Défis et du Comm-Link.
- Synchronisation complète entre le client navigateur et le backend NestJS/PostgreSQL.
- Aucune régression ni blocage détecté sur le parcours joueur.

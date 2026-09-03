# 🛡️ Rapport d'Audit Technique — SOSPlanète v2

**Version analysée :** `v1.2.0`  
**Date d'audit :** 2026-09-03  
**Auditeur :** Antigravity Agent (Tech Lead Mode)  
**Périmètre :** Monorepo complet (`backend-v2`, `evoe-frontend`, `admin-sosplanete-v2`, `sosplanete-v1`)  

---

## 📋 Synthèse Exécutive

| Dimension | Note | Statut | Observations Majeures |
| :--- | :---: | :---: | :--- |
| **Architecture Globale** | **17/20** | 🟢 A | Excellente architecture monorepo modulaire. Séparation claire entre l'API NestJS, l'administration Next.js 16 et le frontend immersif 3D Evoe. |
| **Qualité du Code (SOLID)** | **13/20** | 🟡 B- | 79.5 % des fichiers respectent la limite stricte de 300 lignes. Présence de 23 "God Files" (>600 lignes) dont [App.tsx](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/evoe-frontend/src/App.tsx) (2 416 l.) et [evoe.service.ts](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/backend-v2/src/modules/stimulation/evoe/evoe.service.ts) (1 871 l.). |
| **Robustesse & Compilation** | **16/20** | 🟢 B+ | Les 3 applications compilent et buildent à 100% avec succès. Gestion des erreurs asynchrones et résilience des sockets satisfaisantes. |
| **Sécurité & Conformité** | **12/20** | 🟠 C | Faille résiduelle persistante : stockage du couple identifiant/mot de passe en Basic Auth Base64 dans `localStorage` côté joueur ([AuthContext.tsx](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/evoe-frontend/src/context/AuthContext.tsx)). Authentification admin propre en JWT. |
| **Documentation In-Code** | **14/20** | 🟡 B | Documentation des calculs trigonométriques 3D et shaders très soignée. Manque d'annotations JSDoc sur certains services métier et hooks personnalisés. |
| **Taille des Fichiers** | **13/20** | 🟡 B- | 333 fichiers < 300 lignes, 63 fichiers entre 300 et 600 lignes, 23 fichiers critiques > 600 lignes. |

### 🎯 **Score Global Pondéré : 14.2 / 20**

---

## 🏗️ Phase 1 : Analyse du Contexte Technique

### 1.1 Stack Technologique Monorepo

| Composant | Technologie Principale | Version | Rôle & Responsabilité |
| :--- | :--- | :---: | :--- |
| **Backend API** | NestJS + Prisma ORM + SQLite/PostgreSQL | `11.1.18` / `6.19.3` | API REST & WebSockets multi-instances, gestion des impacts écologiques et gamification. |
| **Admin Dashboard** | Next.js 16 (App Router) + Tailwind CSS v4 | `16.2.3` / `4.2.2` | Console de gestion des espaces (AM/AS), catalogues, wizard de configuration et reporting. |
| **Evoe Frontend** | Vite + React 19 + Three.js / R3F | `8.0.16` / `0.184.0` | Client de jeu immersif 3D (Nexus 2070 / Terre 2026), chat temps réel et défis d'équipes. |
| **Legacy Frontend** | React 18 + Vite | `1.2.0` | Client historique v1 pour la rétrocompatibilité des minigames et histoires SOSPlanète. |

### 1.2 Architecture Multi-Instances et Modèle de Données
Le backend structure l'isolation par le graphe relationnel :
`Admin (AS/AM)` ➔ `Instance` ➔ `InstanceYear` ➔ `Period` ➔ `LocalAction` / `Child` ➔ `ActionDone`.
- **Routage dynamique :** Identification automatique de l'espace via en-tête `x-instance-id` ou `origin`.
- **Gestion temporelle :** Séparation des années scolaires (`InstanceYear`) et périodes d'activité avec correction automatique des décalages horaires.

---

## 🏗️ Phase 2 : Audit de Qualité & Robustesse

### 2.1 Analyse SOLID et Séparation des Responsabilités
* **Points Forts :**
  - Modularité exemplaire du backend NestJS : les modules `impact`, `stimulation`, `tracking`, `instance`, `action-ref` et `local-action` sont bien encapsulés avec leurs propres contrôleurs et services.
  - Administration Next.js : utilisation judicieuse de composants modulaires (`Step1Mode` à `Step8ReviewLaunch` pour le wizard, `IndicatorsTab`, `TrackingView`).
* **Points de Vigilance (God Components) :**
  - [App.tsx](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/evoe-frontend/src/App.tsx) (2 416 lignes) cumule le routage, la gestion des transitions d'époques, l'orchestration des modales, la gestion des états audio et les écoutes d'événements.
  - [evoe.service.ts](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/backend-v2/src/modules/stimulation/evoe/evoe.service.ts) (1 871 lignes) regroupe la logique de génération de briefings SF, la gestion des défis inter-équipes, la distribution des gages, et le calcul des scores temporels.
  - [ChatPanel.tsx](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/evoe-frontend/src/components/ChatPanel.tsx) (1 410 lignes) et [ChallengeModal.tsx](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/evoe-frontend/src/components/ui/ChallengeModal.tsx) (1 164 lignes) concentrent un grand nombre de responsabilités UI et de logique locale.

### 2.2 Gestion des Erreurs et Robustesse
* **Résilience des Sockets :** Dans `useChatSocket.ts` et `chat.gateway.ts`, le mécanisme de reconnexion automatique et de ré-émission des messages après rupture réseau fonctionne de manière nominale.
* **Silencing d'erreurs :** Dans certains hooks côté frontend ([useSession.ts](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/admin-sosplanete-v2/src/hooks/useSession.ts#L71)), les exceptions de requêtes réseau sont loguées en console sans toujours fournir de feedback visuel (toast / banner) explicite à l'utilisateur.

---

## 🏗️ Phase 3 : Audit de Sécurité & Conformité

### 3.1 🔴 Stockage Basic Auth en LocalStorage (`SEC-01`)
* **Fait observable :** Dans [AuthContext.tsx](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/evoe-frontend/src/context/AuthContext.tsx#L105-L134) (Evoe Frontend), l'authentification des joueurs repose sur l'encodage `btoa(pseudo + ":" + password)` qui est ensuite conservé dans `localStorage.getItem("evoe_auth")`.
* **Risque :** Tout script tiers injecté (via vulnérabilité XSS ou dépendance compromise) peut décoder le mot de passe en clair via `atob(localStorage.getItem("evoe_auth"))`.
* **Recommandation :** Remplacer le Basic Auth joueur par une émission de jeton de session JWT éphémère ou un Cookie sécurisé `HttpOnly` émis par `/legacy/check_auth`.

### 3.2 🟢 Isolation du Client HTTP (`SEC-02` Résolu)
* **Conformité :** Le client Axios dédié `evoeClient` ([api.ts](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/evoe-frontend/src/lib/api.ts)) est désormais utilisé pour injecter les headers `Authorization` et `x-instance-id`. L'instance globale `axios` n'est plus polluée, garantissant qu'aucune requête externe ne fuite de données d'authentification.

### 3.3 🟢 Validation des Entrées & Protection Injection SQL
* **Conformité :** L'API NestJS utilise `class-validator` et `class-transformer` sur ses DTOs ainsi que les requêtes paramétrées du client Prisma ORM, éliminant tout risque d'injection SQL directe.

---

## 🏗️ Phase 4 : Documentation In-Code

* **Excellence mathématique & 3D :** Les shaders GLSL de transition magma/Terre dans `Portal2070.tsx` et les calculs de répartition spatiale orbitale dans `Portal2026.tsx` comportent des commentaires clairs facilitant la maintenance géométrique.
* **Manque d'annotations JSDoc :** Les signatures des méthodes de [evoe.service.ts](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/backend-v2/src/modules/stimulation/evoe/evoe.service.ts) et des hooks [useInstanceYear.ts](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/admin-sosplanete-v2/src/hooks/useInstanceYear.ts) manquent de blocs JSDoc standardisés détaillant les paramètres d'entrée et types de retour.

---

## 🏗️ Phase 5 : Analyse Complète de la Taille des Fichiers de Code

### 5.1 Répartition Globale
- **Total fichiers analysés :** 419 fichiers
- **Fichiers < 300 lignes :** 333 fichiers (**79.5 %**) 🟢
- **Fichiers 300 à 600 lignes :** 63 fichiers (**15.0 %**) 🟡
- **Fichiers > 600 lignes :** 23 fichiers (**5.5 %**) 🔴

### 5.2 Liste Exhaustive des Fichiers > 600 Lignes

| Lignes | Fichier | Application | Rôle & Contenu |
| :---: | :--- | :--- | :--- |
| **2 416** | [App.tsx](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/evoe-frontend/src/App.tsx) | `evoe-frontend` | Hub central, gestion d'époques, modales, sons |
| **2 251** | [App.css](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/evoe-frontend/src/App.css) | `evoe-frontend` | Feuille de style globale, animations et thème néon |
| **1 909** | [PlaneteAnimee.jsx](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/sosplanete-v1/src/components/planete/PlaneteAnimee.jsx) | `sosplanete-v1` | Moteur d'animation Canvas 2D de la Terre v1 |
| **1 871** | [evoe.service.ts](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/backend-v2/src/modules/stimulation/evoe/evoe.service.ts) | `backend-v2` | Service métier complet gamification & défis SF |
| **1 410** | [ChatPanel.tsx](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/evoe-frontend/src/components/ChatPanel.tsx) | `evoe-frontend` | Interface Comm-Link (canaux, messages, audio) |
| **1 164** | [ChallengeModal.tsx](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/evoe-frontend/src/components/ui/ChallengeModal.tsx) | `evoe-frontend` | Modale d'émission et de suivi des défis d'équipes |
| **1 078** | [legacy-api.service.ts](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/backend-v2/src/modules/legacy-api/legacy-api.service.ts) | `backend-v2` | Passerelle de compatibilité API v1 |
| **1 023** | [page.tsx](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/admin-sosplanete-v2/src/app/dashboard/organization/page.tsx) | `admin-sosplanete-v2` | Gestion de la structure de l'établissement |
| **940** | [TrackingView.tsx](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/admin-sosplanete-v2/src/components/tracking/TrackingView.tsx) | `admin-sosplanete-v2` | Matrice de saisie et consultation du tracking |
| **881** | [Portal2026.tsx](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/evoe-frontend/src/components/Portal2026.tsx) | `evoe-frontend` | Scène R3F QG 2026 (Terre, avatars 3D, podium) |
| **854** | [chat.gateway.ts](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/backend-v2/src/modules/stimulation/chat.gateway.ts) | `backend-v2` | Gateway WebSocket NestJS pour les messages |
| **787** | [ChatMessageItem.tsx](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/evoe-frontend/src/components/chat/ChatMessageItem.tsx) | `evoe-frontend` | Rendu unitaire des messages Comm-Link et gages |
| **777** | [Step4OrganizationStudents.tsx](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/admin-sosplanete-v2/src/components/wizard/steps/Step4OrganizationStudents.tsx) | `admin-sosplanete-v2` | Étape d'importation des élèves & classes |
| **764** | [PlayerAvatar.tsx](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/evoe-frontend/src/components/3d/PlayerAvatar.tsx) | `evoe-frontend` | Rendu 3D personnalisé des avatars de joueurs |
| **729** | [impact.service.ts](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/backend-v2/src/modules/impact/impact.service.ts) | `backend-v2` | Calcul des économies CO2, Eau, Déchets |
| **716** | [ActionRefEditModal.tsx](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/admin-sosplanete-v2/src/components/catalog/ActionRefEditModal.tsx) | `admin-sosplanete-v2` | Modale d'édition des actions du catalogue de référence |
| **658** | [MissionCard3D.tsx](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/evoe-frontend/src/components/ui/MissionCard3D.tsx) | `evoe-frontend` | Carte de mission avec hologramme 3D |
| **649** | [CatalogSection.tsx](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/admin-sosplanete-v2/src/components/settings/CatalogSection.tsx) | `admin-sosplanete-v2` | Section de paramétrage du catalogue |
| **648** | [AgentProfileModal.tsx](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/evoe-frontend/src/components/ui/AgentProfileModal.tsx) | `evoe-frontend` | Modale de profil joueur (stats, badge, avatar) |
| **628** | [year.service.ts](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/backend-v2/src/modules/instance/year.service.ts) | `backend-v2` | Gestion du cycle de vie des années scolaires |
| **616** | [recette-runner.ts](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/backend-v2/test/recette-runner.ts) | `backend-v2` | Script de tests de recette bout-en-bout |
| **607** | [page.tsx](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/admin-sosplanete-v2/src/app/dashboard/settings/page.tsx) | `admin-sosplanete-v2` | Page de configuration des paramètres système |
| **607** | [OnboardingGuide.tsx](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/evoe-frontend/src/components/ui/OnboardingGuide.tsx) | `evoe-frontend` | Guide interactif FTUX pour les nouveaux joueurs |

---

## 📊 Matrice Consolidée des Écarts

| ID | Sévérité | Catégorie | Description | Fichier(s) |
| :--- | :---: | :---: | :--- | :--- |
| **SEC-01** | 🔴 CRITIQUE | Sécurité | Stockage Basic Auth (pseudo:mot-de-passe en Base64 réversible) dans localStorage / sessionStorage | [AuthContext.tsx](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/evoe-frontend/src/context/AuthContext.tsx) |
| **ARCH-01** | 🟠 ÉLEVÉ | Architecture | Présence de composants monolithiques (> 1 000 lignes) combinant état, réseau et rendu | `App.tsx`, `evoe.service.ts`, `ChatPanel.tsx`, `ChallengeModal.tsx` |
| **QUAL-01** | 🟡 MOYEN | Qualité | 201 avertissements/erreurs ESLint sur Evoe Frontend, notamment `react-hooks/set-state-in-effect` | [useEvoeData.ts](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/evoe-frontend/src/hooks/useEvoeData.ts) |
| **QUAL-02** | 🟡 MOYEN | Qualité | 745 avertissements/erreurs ESLint sur Admin Frontend (entités non échappées, imports inutilisés) | `Step6Gamification.tsx`, `Step7Communication.tsx` |
| **DOC-01** | 🟢 FAIBLE | Documentation | Manque d'en-têtes JSDoc standardisés sur les méthodes publiques des services et hooks | `year.service.ts`, `useInstanceYear.ts` |

---

## 🔗 Recommandations & Plan d'Action

1. **Sécurisation de l'authentification joueur (`SEC-01`) :** Migrer vers un jeton de session JWT émis par le backend NestJS lors de l'appel `/legacy/check_auth`.
2. **Refactorisation ciblée des fichiers volumineux (`ARCH-01`) :**
   - Extraire la gestion audio et le commutateur d'époques de `App.tsx` vers des hooks dédiés (`useEpochManager`, `useAudioController`).
   - Découper `ChallengeModal.tsx` en sous-composants réutilisables (`PledgeSelector`, `MissionSelector`, `ChallengeSummary`).
3. **Assainissement Linter (`QUAL-01` & `QUAL-02`) :** Nettoyer les `setState` synchrones dans les `useEffect` pour assurer une compatibilité parfaite avec React 19.

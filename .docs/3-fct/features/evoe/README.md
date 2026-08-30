# 🚀 Backlog Fonctionnel Exhaustif — EVOE (Frontend & Backend)

Ce dossier rassemble l'ensemble des **Spécifications Fonctionnelles et User Stories (US)** décrivant l'application **EVOE 2026/2070**, son interface 3D temps réel, sa mécanique de jeu d'éco-citoyenneté et ses interactions multijoueurs.

---

## 🗺️ Cartographie des Epics & User Stories

| Epic ID | Intitulé de l'Epic | User Stories Associées | Fichier de Spécification |
| :--- | :--- | :--- | :--- |
| **EPIC-01** | **Authentification Quantique & Sélection de Nexus** | US-EVOE-01 à US-EVOE-04 | [`EPIC-01-AUTH-NEXUS.md`](./EPIC-01-AUTH-NEXUS.md) |
| **EPIC-02** | **Immersion, Briefing & Onboarding Temporel** | US-EVOE-05 à US-EVOE-06 | [`EPIC-02-IMMERSION-ONBOARDING.md`](./EPIC-02-IMMERSION-ONBOARDING.md) |
| **EPIC-03** | **Passerelle Temporelle & Scène 3D Principale (QG 2026)** | US-EVOE-07 à US-EVOE-11 | [`EPIC-03-SCENE-3D-PORTAL.md`](./EPIC-03-SCENE-3D-PORTAL.md) |
| **EPIC-04** | **Codex des Missions & Impulsion Écologique** | US-EVOE-12 à US-EVOE-16 | [`EPIC-04-CODEX-MISSIONS.md`](./EPIC-04-CODEX-MISSIONS.md) |
| **EPIC-05** | **Arène des Défis PvP Inter-Équipes** | US-EVOE-17 à US-EVOE-19 | [`EPIC-05-CHALLENGES-PVP.md`](./EPIC-05-CHALLENGES-PVP.md) |
| **EPIC-06** | **Projection Temporelle 2070 & Extrapolation Mondiale** | US-EVOE-20 à US-EVOE-23 | [`EPIC-06-PROJECTION-2070.md`](./EPIC-06-PROJECTION-2070.md) |
| **EPIC-07** | **Radar de Propulsion & Niveaux Technologiques** | US-EVOE-24 à US-EVOE-26 | [`EPIC-07-RADAR-PROPULSION.md`](./EPIC-07-RADAR-PROPULSION.md) |
| **EPIC-08** | **Classement Spatial & Leaderboard 3D** | US-EVOE-27 à US-EVOE-28 | [`EPIC-08-LEADERBOARD-SPATIAL.md`](./EPIC-08-LEADERBOARD-SPATIAL.md) |
| **EPIC-09** | **Comm-Link / Messagerie Temps Réel Quantique (WebSockets)** | US-EVOE-29 à US-EVOE-32 | [`EPIC-09-COMM-LINK-CHAT.md`](./EPIC-09-COMM-LINK-CHAT.md) |
| **EPIC-10** | **Profil de l'Agent Temporel & Personnalisation** | US 10.1 à US 10.3 | [`EPIC-10-AGENT-PROFILE.md`](./EPIC-10-AGENT-PROFILE.md) |
| **EPIC-11** | **Système de Preuves & Validation des Défis (Anti-Triche & Social)** | US 11.1 à US 11.4 | [`EPIC-11-VALIDATION-PREUVES.md`](./EPIC-11-VALIDATION-PREUVES.md) |

---

## 🎯 Rôle et Acteurs

1. **Agent Temporel (Élève / Joueur)** :
   - Dispose d'un pseudo et mot de passe rattaché à une équipe (classe) et une instance (école).
   - Impulsionne des missions éco-citoyennes pour faire progresser sa jauge et celle de son équipe.
   - Lance des défis PvP, discute sur le Comm-Link, consulte l'Oracle et personnalise son avatar.
2. **Équipe (Classe / Vaisseau Spatial)** :
   - Représentée visuellement par un vaisseau 3D doté de moteurs à propulsion évolutive (niveaux 1 à 5).
3. **Nexus Temporel (Instance / École)** :
   - Espace cloisonné accueillant les équipes et la dynamique de jeu pour une année scolaire donnée.

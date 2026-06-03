# Plan de Réalisation : Refonte sos-planete v2

Ce plan détaille la stratégie d'implémentation pour la migration vers le nouveau backend (NestJS/Prisma) et la création d'une interface frontend Premium, tout en garantissant une compatibilité totale avec le jeu vidéo existant (v1).

## 🎨 Vision UI/UX : "Premium Pastel" & Mobile-First
L'interface sera conçue pour être à la fois apaisante et engageante, avec une compatibilité mobile native (PWA) :
- **PWA (Progressive Web App)** : Configuration pour permettre l'installation sur mobile (Ecran d'accueil, mode offline-first pour la consultation).
- **Palette de couleurs** : Tons pastels harmonieux (Bleu ciel poudré, Vert d'eau, Pêche douce) pour une esthétique écologique et sereine.
- **Style Visuel** : Glassmorphism léger, coins arrondis généreux (24px+), et ombres portées douces pour un effet de profondeur.
- **Animations** : Transitions fluides via Framer Motion pour simuler un organisme vivant.

## 🚀 Phases de Réalisation

### Phase 1 : Fondations & Modélisation (Sprint 1)
Priorité à la structure des données avant le design.
- [ ] **Infrastructure Backend** : Initialisation NestJS + Prisma. Configuration de PostgreSQL 15.
- [ ] **Modèle de Données [PRIORITÉ]** : Implémentation du schéma Prisma complet (Instances, Rôles, Global Actions, Animal Progression).
- [ ] **Design System & PWA** : Mise en place de `index.css` (tokens pastels) et configuration du manifest PWA pour l'installation mobile sur Next.js 15.

### Phase 2 : Gouvernance & Multi-Instance (Sprint 2)
Focus sur l'administration système (SYS_ADMIN).
- [ ] **US-01.1 & 01.2** : Gestion des rôles AS/AM et création dynamique d'instances (écoles).
- [ ] **US-05.1 & 05.2** : Référentiel global des actions et poids d'impact.
- [ ] **Auth** : Système JWT avec isolation par `instanceId`.

### Phase 3 : Gestion des Espaces Écoles (Sprint 3)
Focus sur l'administration locale (BIZ_ADMIN).
- [ ] **US-02.1** : CRUD des équipes (Teams), groupes et élèves au sein d'une instance.
- [ ] **US-03.1** : Mapping du catalogue local vers le référentiel global.
- [ ] **US-07.1** : Moteur de gestion temporelle (Ouverture/Fermeture auto des semaines).

### Phase 4 : Moteur de Jeu & Compatibilité (Sprint 4)
Implémentation du cœur fonctionnel et de la gamification.
- [ ] **US-04.1** : API d'enregistrement des actions avec **Couche de compatibilité v1** (API Parity).
- [ ] **US-06.1 [CRÉATIF]** : Moteur de progression des animaux.
    - **Logique** : Distribution des 9 animaux sur l'année scolaire.
    - **Dynamisme** : La vitesse de déblocage dépend du volume d'actions réelles, garantissant que le dernier animal est débloqué juste avant la fin de l'année si l'engagement est maintenu.
- [ ] **Dashboard Premium** : Visualisation d'impact avec graphiques pastels optimisés pour mobile.

## ⚓ Stratégie de Compatibilité v1
- Implémentation d'un module `CompatibilityModule` dans NestJS.
- Mapping strict des endpoints v1 (ex: `POST /actiondone/{child_id}`) vers les services v2.
- Validation automatique via les schémas Swagger existants.

## 🛠️ Stack Technique
- **Backend** : NestJS, Prisma, PostgreSQL 15.
- **Frontend** : Next.js 15, Vanilla CSS, Framer Motion, `next-pwa`.
- **Audit** : Tests unitaires et d'intégration via Vitest.

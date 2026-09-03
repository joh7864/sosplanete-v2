# 🎨 Rapport d'Audit Design & Review UI/UX — SOSPlanète v2

**Version analysée :** `v1.2.0`  
**Date d'audit :** 2026-09-03  
**Auditeur :** Antigravity Agent (Design & UX Reviewer)  
**Périmètre :** Interfaces Utilisateur (`apps/evoe-frontend` & `apps/admin-sosplanete-v2`)  

---

## 📋 Synthèse Exécutive

| Dimension | Note | Statut | Observations Majeures |
| :--- | :---: | :---: | :--- |
| **Identité Visuelle & Thématique** | **18/20** | 🟢 A | Rendu visuel d'exception. Immersion SF remarquable sur Evoe (Néon, Glassmorphism, R3F 3D) et esthétique SaaS moderne très élégante sur l'Admin (Emerald, Slate, GlassCard). |
| **Cohérence des Composants (UI)** | **14/20** | 🟡 B | Belle harmonie visuelle, mais forte disparité d'implémentation : l'Admin utilise Tailwind CSS v4 avec des tokens structurés, tandis qu'Evoe Frontend recourt massivement aux styles `style={{ ... }}` inline. |
| **Expérience Utilisateur (UX)** | **15/20** | 🟢 B+ | Parcours fluides et immersifs (Wizard de création d'espace en 8 étapes, Onboarding FTUX interactif, feedback Comm-Link temps réel). Quelques zones de latence ou d'absence de toasts d'erreur réseau. |
| **Accessibilité & Ergonomie (WCAG)** | **12/20** | 🟠 C | Cibles tactiles mobiles inférieures à 44px sur plusieurs micro-boutons, attributs ARIA incomplets sur les listes déroulantes personnalisées et gestion du focus clavier perfectible. |

### 🎯 **Score Design Global : 14.8 / 20**

---

## 🏗️ Phase 1 : Référentiel Design & Design System

### 1.1 Palette de Couleurs & Tokens

#### 🌌 Univers Evoe 2026 / Nexus 2070 (Gaming / SF Immersif)
- **Fond Principal :** `#040a14` à `#0a192f` (Deep Space Dark Navy)
- **Accents Néon Primaires :**
  - Cyan Spatial : `#00ffcc` / `#00b3ff` (Boutons d'action, halo des holographes)
  - Vert Écologique : `#00ff88` (Progression des défis, gains CO2/Eau/Déchets)
  - Rose / Violet Nexus : `#ff007f` / `#7928ca` (Arche temporelle 2070, gages, alertes de duel)
- **Glassmorphism :** `rgba(10, 25, 47, 0.75)` avec `backdrop-filter: blur(12px)` et bordures lumineuses `1px solid rgba(0, 255, 204, 0.2)`.

#### 🏢 Console d'Administration SOSPlanète v2 (SaaS Pro Clean)
- **Palette Tailwind v4 :**
  - Fond de base : `slate-950` / `slate-900`
  - Couleur d'accentuation : `emerald-500` (`#10b981`) pour les actions principales et validations
  - Couleurs secondaires : `indigo-500`, `amber-500`, `rose-500` (badges de rôle et graphiques Recharts)
  - Typographie : Inter / sans-serif optimisé pour la lecture de données tabulaires denses.

---

## 🏗️ Phase 2 : Conformité Visuelle & UI

### 2.1 Analyse de la Hiérarchie et Lisibilité
* **Points Forts :**
  - **Evoe Frontend :** Le contraste des typographies SF et des badges holographiques sur fond noir étoilé offre une lisibilité optimale et guide naturellement le regard vers le Comm-Link et le carrousel de missions.
  - **Admin Dashboard :** La disposition en cartes ([GlassCard.tsx](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/admin-sosplanete-v2/src/components/ui/GlassCard.tsx)), les indicateurs KPI et la `TopBar` avec sélecteur d'espace permettent une prise de décision rapide.
* **Écarts Constatés :**
  - **Recours massif aux styles inline dans Evoe :** Dans [ChallengeModal.tsx](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/evoe-frontend/src/components/ui/ChallengeModal.tsx#L1074-L1150) et [AgentProfileModal.tsx](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/evoe-frontend/src/components/ui/AgentProfileModal.tsx), des centaines de lignes définissent les couleurs et espacements via `style={{ ... }}` au lieu de classes CSS réutilisables ou de variables CSS personnalisées.
  - **Conflits de calques (z-index) :** Certains éléments du Canvas Three.js (`<Canvas />`) peuvent occasionnellement chevaucher les modales ouvertes ou le tiroir mobile du Comm-Link lors des transitions d'angle de caméra.

---

## 🏗️ Phase 3 : Expérience Utilisateur (UX)

### 3.1 Parcours Critiques Évalués

1. **Onboarding Nouveau Joueur (FTUX) :**
   - **Évaluation :** 🟢 **Excellente**. Le composant [OnboardingGuide.tsx](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/evoe-frontend/src/components/ui/OnboardingGuide.tsx) et le briefing temporel [TemporalBriefing.tsx](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/evoe-frontend/src/components/TemporalBriefing.tsx) avec effet machine à écrire créent un tutoriel narratif engageant et mémorable.
2. **Création d'un Espace Établissement (Wizard 8 étapes) :**
   - **Évaluation :** 🟢 **Très fluide**. La progression guidée ([Step1Mode.tsx](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/admin-sosplanete-v2/src/components/wizard/steps/Step1Mode.tsx) à `Step8ReviewLaunch.tsx`) découpe la complexité de paramétrage (classes, catalogue, communication WhatsApp, gamification) de manière intuitive.
3. **Émission d'un Défi Inter-Équipes :**
   - **Évaluation :** 🟡 **Bonne avec axes de perfectionnement**. Dans [ChallengeModal.tsx](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/evoe-frontend/src/components/ui/ChallengeModal.tsx), la prévisualisation des gages et la recherche instantanée fonctionnent très bien. En cas d'erreur de soumission réseau, le message d'erreur est affiché en bas de formulaire, mais aucun toast flottant ne vient confirmer l'envoi en cas de succès.

### 3.2 États de Chargement et Retours Visuels
* **Loaders & Micro-animations :** Présence d'animations Framer Motion soignées (`AnimatePresence`, `motion.div`) sur l'ouverture des modales et l'apparition des messages.
* **Point d'amélioration :** Ajouter des squelettes de chargement (Skeleton loaders) lors de la récupération des données de catalogue et de tracking dans l'administration pour éviter les sauts de mise en page (Layout Shift).

---

## 🏗️ Phase 4 : Accessibilité (WCAG 2.1) & Ergonomie

### 4.1 Cibles Tactiles & Ergonomie Mobile (Mobile-First)
* **Point Critique :** Sur mobile, les icônes d'action secondaires (fermeture de modale `X`, boutons d'édition `Edit3`, pastilles d'avatars) ont une taille de hit box de `28px` à `32px`, inférieure au standard d'accessibilité minimal recommandé de **44x44px** ([WCAG 2.5.5](https://www.w3.org/WAI/WCAG21/Understanding/target-size.html)).
* **Navigation Tactile :** Le carrousel de cartes de missions 3D et le tiroir Comm-Link sur mobile ([MobileContextCarousel.tsx](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/evoe-frontend/src/components/ui/MobileContextCarousel.tsx)) sont fluides et intuitifs.

### 4.2 Navigation Clavier & Sémantique ARIA
* **Menu et Listes Déroulantes Personnalisées :** Les faux éléments `select` basés sur des `<div>` cliquables dans [ChallengeModal.tsx](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/evoe-frontend/src/components/ui/ChallengeModal.tsx) ne comportent pas les attributs `role="listbox"`, `role="option"`, `aria-expanded` et ne peuvent pas être pilotés uniquement à l'aide des touches fléchées du clavier.
* **Fermeture à la touche Échap :** Certaines modales ne capturent pas l'événement clavier `Escape` pour se refermer automatiquement.

---

## 📊 Matrice Consolidée des Écarts Design & UX

| ID | Sévérité | Catégorie | Description | Localisation |
| :--- | :---: | :---: | :--- | :--- |
| **DES-01** | 🟠 MAJEUR | Ergonomie / Mobile | Cibles tactiles interactives inférieures à 44px sur plusieurs micro-boutons d'action | `ChallengeModal.tsx`, `AgentProfileModal.tsx`, `ChatMessageItem.tsx` |
| **DES-02** | 🟠 MAJEUR | Accessibilité / ARIA | Absence d'attributs sémantiques ARIA (`role="dialog"`, `aria-expanded`, `aria-label`) sur les menus personnalisés | `ChallengeModal.tsx`, `DashboardLayout.tsx` |
| **DES-03** | 🟡 MINEUR | Architecture CSS | Multiplication des styles inline `style={{ ... }}` au détriment de tokens ou classes CSS | `evoe-frontend/src/components/ui/*.tsx` |
| **DES-04** | 🟡 MINEUR | UX Feedback | Absence de notifications Toast lors de la validation des défis ou échecs de connexion réseau | `useEvoeData.ts`, `useSession.ts` |
| **DES-05** | 🟡 MINEUR | Accessibilité Clavier | Manque d'écoute de la touche `Échap` (Escape) pour refermer certaines modales | `MissionsWeekModal.tsx`, `ChallengeModal.tsx` |

---

## 🔗 Recommandations & Prochaines Étapes

1. **Agrandissement des zones de clic mobile (DES-01) :** Encapsuler les icônes de contrôle dans des conteneurs avec un `padding: 10px` ou `min-width: 44px; min-height: 44px;` pour garantir le confort tactile sur smartphone.
2. **Accessibilité des composants de modale (DES-02 & DES-05) :** Ajouter un écouteur global sur la touche `Escape` dans chaque modale et implémenter les attributs ARIA standard.
3. **Systématisation des Toasts de notification (DES-04) :** Intégrer un gestionnaire de toasts unifié (ex: `sonner` ou toast personnalisé glassmorphic) pour tous les retours d'actions asynchrones.

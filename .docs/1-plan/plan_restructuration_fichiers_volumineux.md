# Plan de Restructuration des Fichiers Volumineux (> 500 lignes) - Admin & Backend

Ce plan vise à restructurer, nettoyer et diviser les 6 fichiers de code du backend (`backend-v2`) et de la console d'administration (`admin-sosplanete-v2`) qui dépassent la limite critique de 500 lignes. L'application de jeu `sosplanete-v1` est expressément exclue de ce périmètre.

---

## 🚀 Fichiers cibles et stratégie de division

### 1. [instance.service.ts](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/backend-v2/src/modules/instance/instance.service.ts) (541 lignes)
*   **Problématique :** Ce service backend est trop lourd car il gère à la fois le CRUD des instances, la génération des périodes hebdomadaires, l'activation des périodes courantes et les transactions complexes de cascade de suppression.
*   **Stratégie de découpage :**
    *   Déplacer toute la logique temporelle de génération et d'activation des périodes (`syncPeriods`, `getPeriodBoundaries`, `handleCurrentPeriodActivation`) dans le [period.service.ts](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/backend-v2/src/modules/period/period.service.ts) existant.
    *   Extraire les opérations complexes de suppression transactionnelle (remove instance, remove instance year) dans un nouveau service dédié : `instance-cleanup.service.ts`.

---

### 2. [PeriodSettings.tsx](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/admin-sosplanete-v2/src/components/organization/PeriodSettings.tsx) (521 lignes)
*   **Problématique :** Gère la configuration du jeu (dates globales) ainsi que la liste détaillée des périodes de saisies, incluant l'édition inline, la création et la suppression.
*   **Stratégie de découpage :**
    *   Séparer la liste et la modification des périodes individuelles dans un composant [PeriodTable.tsx](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/admin-sosplanete-v2/src/components/organization/PeriodTable.tsx).
    *   Conserver dans `PeriodSettings.tsx` uniquement la partie configuration du calendrier global de l'espace.

---

### 3. [page.tsx (dashboard)](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/admin-sosplanete-v2/src/app/dashboard/page.tsx) (609 lignes)
*   **Problématique :** Gère à la fois l'affichage des KPIs agrégés (CO2, Eau, Déchets), les cartes d'établissements (en grille/liste), et le sélecteur de gestionnaires (AM).
*   **Stratégie de découpage :**
    *   Extraire la barre supérieure de statistiques d'impact dans [DashboardKpiBar.tsx](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/admin-sosplanete-v2/src/components/dashboard/DashboardKpiBar.tsx).
    *   Créer un composant [InstanceCard.tsx](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/admin-sosplanete-v2/src/components/dashboard/InstanceCard.tsx) pour encapsuler le rendu (grille et liste) d'une école individuelle et la logique de popover de réassignation d'administrateur.

---

### 4. [page.tsx (settings)](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/admin-sosplanete-v2/src/app/dashboard/settings/page.tsx) (876 lignes)
*   **Problématique :** Regroupe plusieurs sections de configuration : paramètres généraux, configuration du système de stimulation (animaux, thermomètre), et gestion des sauvegardes/restaurations.
*   **Stratégie de découpage :**
    *   Extraire la partie de sauvegarde administrative dans un composant [DatabaseBackupSection.tsx](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/admin-sosplanete-v2/src/components/settings/DatabaseBackupSection.tsx).
    *   Isoler la gestion des paramètres globaux du système dans [SystemConfigForm.tsx](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/admin-sosplanete-v2/src/components/settings/SystemConfigForm.tsx).

---

### 5. [page.tsx (organization)](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/admin-sosplanete-v2/src/app/dashboard/organization/page.tsx) (1161 lignes)
*   **Problématique :** Contient la gestion des équipes, groupes, et élèves. Elle comprend l'ensemble des modales d'édition de ces trois niveaux et toute la structure en accordéon.
*   **Stratégie de découpage :**
    *   Extraire le composant d'arborescence principal dans [TeamHierarchy.tsx](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/admin-sosplanete-v2/src/components/organization/TeamHierarchy.tsx).
    *   Isoler les composants pour chaque niveau de détail de l'accordéon (ex: `TeamAccordionItem`, `GroupItem`).

---

### 6. [page.tsx (tracking)](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/admin-sosplanete-v2/src/app/dashboard/tracking/page.tsx) (1580 lignes)
*   **Problématique :** Cette page accumule beaucoup de composants d'interface en ligne, en particulier les graphiques d'impact (Recharts), les modales d'import de fichiers CSV, la matrice de saisie hebdomadaire et la logique de synchronisation de l'API.
*   **Stratégie de découpage :**
    *   Créer un composant [TrackingMatrix.tsx](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/admin-sosplanete-v2/src/components/tracking/TrackingMatrix.tsx) dédié au grand tableau de performance des élèves et des périodes.
    *   Créer un composant [TrackingCharts.tsx](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/admin-sosplanete-v2/src/components/tracking/TrackingCharts.tsx) pour encapsuler les graphiques d'impacts Recharts.

---

## 🛠️ Plan d'action et étapes d'exécution

*   **Étape 1 : Refactoring du Backend**
    1. Transférer la génération de périodes d'instance dans `PeriodService`.
    2. Créer `InstanceCleanupService` et déplacer la cascade de suppression.
    3. Valider le backend via les tests unitaires.
*   **Étape 2 : Découpage des composants autonomes Admin (v2)**
    1. Découper `PeriodSettings` en extrayant `PeriodTable`.
    2. Découper la page settings en extrayant `DatabaseBackupSection` et `SystemConfigForm`.
    3. Découper le tableau de bord global en extrayant `DashboardKpiBar` and `InstanceCard`.
*   **Étape 3 : Découpage des pages complexes de flux (v2)**
    1. Restructurer la page tracking en extrayant la table de matrice et les graphes.
    2. Restructurer la page organization en extrayant l'arbre hiérarchique.
*   **Étape 4 : Validation globale**
    1. Lancement de compilations TypeScript frontend et backend.
    2. Vérification visuelle sur navigateur de la console d'administration.

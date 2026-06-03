# Rapport de taille des fichiers de code

Ce rapport liste l'ensemble des fichiers de code source de l'application (extensions .ts, .tsx, .js, .jsx), triÃ©s par nombre de lignes dÃ©croissant.

## Recommandations de division (Fichiers trop volumineux)

Un fichier de code est gÃ©nÃ©ralement considÃ©rÃ© comme trop volumineux s'il dÃ©passe **300 Ã  400 lignes**. Cela nuit Ã  la lisibilitÃ©, Ã  la testabilitÃ© et Ã  la maintenance.

Voici les fichiers nÃ©cessitant une attention particuliÃ¨re :

- **[apps/sosplanete-v1/src/components/planete/PlaneteAnimee.jsx](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/sosplanete-v1/src/components/planete/PlaneteAnimee.jsx)** : **1909 lignes**
  *Analyse :* Fichier volumineux. Ã€ analyser pour division en modules plus petits.

- **[apps/admin-sosplanete-v2/src/app/dashboard/tracking/page.tsx](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/admin-sosplanete-v2/src/app/dashboard/tracking/page.tsx)** : **1580 lignes**
  *Analyse :* Page frontend contenant probablement trop de sous-composants intÃ©grÃ©s (inline). Il est recommandÃ© d'extraire les sous-sections de l'UI (comme les modales, les cartes complexes ou les barres d'outils) dans des fichiers de composants dÃ©diÃ©s.

- **[apps/admin-sosplanete-v2/src/app/dashboard/organization/page.tsx](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/admin-sosplanete-v2/src/app/dashboard/organization/page.tsx)** : **1161 lignes**
  *Analyse :* Page frontend contenant probablement trop de sous-composants intÃ©grÃ©s (inline). Il est recommandÃ© d'extraire les sous-sections de l'UI (comme les modales, les cartes complexes ou les barres d'outils) dans des fichiers de composants dÃ©diÃ©s.

- **[apps/admin-sosplanete-v2/src/app/dashboard/settings/page.tsx](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/admin-sosplanete-v2/src/app/dashboard/settings/page.tsx)** : **876 lignes**
  *Analyse :* Page frontend contenant probablement trop de sous-composants intÃ©grÃ©s (inline). Il est recommandÃ© d'extraire les sous-sections de l'UI (comme les modales, les cartes complexes ou les barres d'outils) dans des fichiers de composants dÃ©diÃ©s.

- **[apps/admin-sosplanete-v2/src/app/dashboard/page.tsx](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/admin-sosplanete-v2/src/app/dashboard/page.tsx)** : **609 lignes**
  *Analyse :* Page frontend contenant probablement trop de sous-composants intÃ©grÃ©s (inline). Il est recommandÃ© d'extraire les sous-sections de l'UI (comme les modales, les cartes complexes ou les barres d'outils) dans des fichiers de composants dÃ©diÃ©s.

- **[apps/backend-v2/src/modules/instance/instance.service.ts](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/backend-v2/src/modules/instance/instance.service.ts)** : **541 lignes**
  *Analyse :* Service backend volumineux. La logique mÃ©tier devrait Ãªtre divisÃ©e par domaine de responsabilitÃ© ou extraite dans des sous-services d'aide (helpers/utilities).

- **[apps/admin-sosplanete-v2/src/components/organization/PeriodSettings.tsx](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/admin-sosplanete-v2/src/components/organization/PeriodSettings.tsx)** : **521 lignes**
  *Analyse :* Fichier volumineux. Ã€ analyser pour division en modules plus petits.

- **[apps/backend-v2/src/modules/impact/impact.service.ts](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/backend-v2/src/modules/impact/impact.service.ts)** : **453 lignes**
  *Analyse :* Service backend volumineux. La logique mÃ©tier devrait Ãªtre divisÃ©e par domaine de responsabilitÃ© ou extraite dans des sous-services d'aide (helpers/utilities).

- **[apps/admin-sosplanete-v2/src/components/organization/GeneralSettings.tsx](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/admin-sosplanete-v2/src/components/organization/GeneralSettings.tsx)** : **442 lignes**
  *Analyse :* Fichier volumineux. Ã€ analyser pour division en modules plus petits.

- **[apps/backend-v2/src/modules/legacy-api/legacy-api.service.ts](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/backend-v2/src/modules/legacy-api/legacy-api.service.ts)** : **421 lignes**
  *Analyse :* Service backend volumineux. La logique mÃ©tier devrait Ãªtre divisÃ©e par domaine de responsabilitÃ© ou extraite dans des sous-services d'aide (helpers/utilities).

- **[apps/admin-sosplanete-v2/src/app/dashboard/tracking/IndicatorsTab.tsx](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/admin-sosplanete-v2/src/app/dashboard/tracking/IndicatorsTab.tsx)** : **409 lignes**
  *Analyse :* Fichier volumineux. Ã€ analyser pour division en modules plus petits.

- **[apps/admin-sosplanete-v2/src/components/catalog/CatalogMapping.tsx](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/admin-sosplanete-v2/src/components/catalog/CatalogMapping.tsx)** : **400 lignes**
  *Analyse :* Fichier volumineux. Ã€ analyser pour division en modules plus petits.

- **[apps/admin-sosplanete-v2/src/components/organization/CategorySettings.tsx](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/admin-sosplanete-v2/src/components/organization/CategorySettings.tsx)** : **399 lignes**
  *Analyse :* Fichier volumineux. Ã€ analyser pour division en modules plus petits.

- **[apps/admin-sosplanete-v2/src/components/catalog/CatalogCsvModal.tsx](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/admin-sosplanete-v2/src/components/catalog/CatalogCsvModal.tsx)** : **397 lignes**
  *Analyse :* Fichier volumineux. Ã€ analyser pour division en modules plus petits.

- **[apps/admin-sosplanete-v2/src/components/layout/DashboardLayout.tsx](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/admin-sosplanete-v2/src/components/layout/DashboardLayout.tsx)** : **388 lignes**
  *Analyse :* Fichier volumineux. Ã€ analyser pour division en modules plus petits.

- **[apps/sosplanete-v1/src/histoires/sos/SosStory.jsx](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/sosplanete-v1/src/histoires/sos/SosStory.jsx)** : **371 lignes**
  *Analyse :* Fichier volumineux. Ã€ analyser pour division en modules plus petits.

- **[apps/admin-sosplanete-v2/src/components/organization/ActionCategoryMapper.tsx](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/admin-sosplanete-v2/src/components/organization/ActionCategoryMapper.tsx)** : **369 lignes**
  *Analyse :* Fichier volumineux. Ã€ analyser pour division en modules plus petits.

- **[apps/backend-v2/test/recette-runner.ts](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/backend-v2/test/recette-runner.ts)** : **359 lignes**
  *Analyse :* Fichier volumineux. Ã€ analyser pour division en modules plus petits.

- **[apps/admin-sosplanete-v2/src/components/tracking/ActionsImportModal.tsx](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/admin-sosplanete-v2/src/components/tracking/ActionsImportModal.tsx)** : **358 lignes**
  *Analyse :* Fichier volumineux. Ã€ analyser pour division en modules plus petits.

- **[apps/admin-sosplanete-v2/src/components/organization/TeamEditModal.tsx](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/admin-sosplanete-v2/src/components/organization/TeamEditModal.tsx)** : **357 lignes**
  *Analyse :* Fichier volumineux. Ã€ analyser pour division en modules plus petits.

- **[apps/admin-sosplanete-v2/src/components/organization/AnchorsManager.tsx](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/admin-sosplanete-v2/src/components/organization/AnchorsManager.tsx)** : **339 lignes**
  *Analyse :* Fichier volumineux. Ã€ analyser pour division en modules plus petits.

- **[apps/sosplanete-v1/src/pages/Impacts/Impacts.jsx](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/sosplanete-v1/src/pages/Impacts/Impacts.jsx)** : **337 lignes**
  *Analyse :* Fichier volumineux. Ã€ analyser pour division en modules plus petits.

- **[apps/admin-sosplanete-v2/src/components/catalog/ReferenceCsvModal.tsx](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/admin-sosplanete-v2/src/components/catalog/ReferenceCsvModal.tsx)** : **331 lignes**
  *Analyse :* Fichier volumineux. Ã€ analyser pour division en modules plus petits.

- **[apps/sosplanete-v1/src/histoires/sos/Story.js](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/sosplanete-v1/src/histoires/sos/Story.js)** : **327 lignes**
  *Analyse :* Fichier volumineux. Ã€ analyser pour division en modules plus petits.

- **[apps/admin-sosplanete-v2/src/app/dashboard/players/page.tsx](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/admin-sosplanete-v2/src/app/dashboard/players/page.tsx)** : **312 lignes**
  *Analyse :* Page frontend contenant probablement trop de sous-composants intÃ©grÃ©s (inline). Il est recommandÃ© d'extraire les sous-sections de l'UI (comme les modales, les cartes complexes ou les barres d'outils) dans des fichiers de composants dÃ©diÃ©s.

- **[apps/admin-sosplanete-v2/src/components/users/UserEditModal.tsx](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/admin-sosplanete-v2/src/components/users/UserEditModal.tsx)** : **310 lignes**
  *Analyse :* Fichier volumineux. Ã€ analyser pour division en modules plus petits.

- **[apps/admin-sosplanete-v2/src/components/organization/CsvImportModal.tsx](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/admin-sosplanete-v2/src/components/organization/CsvImportModal.tsx)** : **306 lignes**
  *Analyse :* Fichier volumineux. Ã€ analyser pour division en modules plus petits.

- **[apps/admin-sosplanete-v2/src/components/organization/CategoryImportModal.tsx](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/admin-sosplanete-v2/src/components/organization/CategoryImportModal.tsx)** : **306 lignes**
  *Analyse :* Fichier volumineux. Ã€ analyser pour division en modules plus petits.

- **[apps/admin-sosplanete-v2/src/app/dashboard/catalog/page.tsx](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/admin-sosplanete-v2/src/app/dashboard/catalog/page.tsx)** : **304 lignes**
  *Analyse :* Page frontend contenant probablement trop de sous-composants intÃ©grÃ©s (inline). Il est recommandÃ© d'extraire les sous-sections de l'UI (comme les modales, les cartes complexes ou les barres d'outils) dans des fichiers de composants dÃ©diÃ©s.

- **[apps/admin-sosplanete-v2/src/components/catalog/LocalActionEditModal.tsx](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/admin-sosplanete-v2/src/components/catalog/LocalActionEditModal.tsx)** : **302 lignes**
  *Analyse :* Fichier volumineux. Ã€ analyser pour division en modules plus petits.

## Tableau complet de tous les fichiers

| Fichier | Lignes | Statut |
| :--- | :---: | :--- |
| [apps/sosplanete-v1/src/components/planete/PlaneteAnimee.jsx](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/sosplanete-v1/src/components/planete/PlaneteAnimee.jsx) | 1909 | CRITIQUE (A diviser) |
| [apps/admin-sosplanete-v2/src/app/dashboard/tracking/page.tsx](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/admin-sosplanete-v2/src/app/dashboard/tracking/page.tsx) | 1580 | CRITIQUE (A diviser) |
| [apps/admin-sosplanete-v2/src/app/dashboard/organization/page.tsx](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/admin-sosplanete-v2/src/app/dashboard/organization/page.tsx) | 1161 | CRITIQUE (A diviser) |
| [apps/admin-sosplanete-v2/src/app/dashboard/settings/page.tsx](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/admin-sosplanete-v2/src/app/dashboard/settings/page.tsx) | 876 | CRITIQUE (A diviser) |
| [apps/admin-sosplanete-v2/src/app/dashboard/page.tsx](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/admin-sosplanete-v2/src/app/dashboard/page.tsx) | 609 | CRITIQUE (A diviser) |
| [apps/backend-v2/src/modules/instance/instance.service.ts](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/backend-v2/src/modules/instance/instance.service.ts) | 541 | CRITIQUE (A diviser) |
| [apps/admin-sosplanete-v2/src/components/organization/PeriodSettings.tsx](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/admin-sosplanete-v2/src/components/organization/PeriodSettings.tsx) | 521 | CRITIQUE (A diviser) |
| [apps/backend-v2/src/modules/impact/impact.service.ts](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/backend-v2/src/modules/impact/impact.service.ts) | 453 | ATTENTION (Grand - A surveiller) |
| [apps/admin-sosplanete-v2/src/components/organization/GeneralSettings.tsx](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/admin-sosplanete-v2/src/components/organization/GeneralSettings.tsx) | 442 | ATTENTION (Grand - A surveiller) |
| [apps/backend-v2/src/modules/legacy-api/legacy-api.service.ts](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/backend-v2/src/modules/legacy-api/legacy-api.service.ts) | 421 | ATTENTION (Grand - A surveiller) |
| [apps/admin-sosplanete-v2/src/app/dashboard/tracking/IndicatorsTab.tsx](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/admin-sosplanete-v2/src/app/dashboard/tracking/IndicatorsTab.tsx) | 409 | ATTENTION (Grand - A surveiller) |
| [apps/admin-sosplanete-v2/src/components/catalog/CatalogMapping.tsx](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/admin-sosplanete-v2/src/components/catalog/CatalogMapping.tsx) | 400 | ATTENTION (Grand - A surveiller) |
| [apps/admin-sosplanete-v2/src/components/organization/CategorySettings.tsx](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/admin-sosplanete-v2/src/components/organization/CategorySettings.tsx) | 399 | ATTENTION (Grand - A surveiller) |
| [apps/admin-sosplanete-v2/src/components/catalog/CatalogCsvModal.tsx](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/admin-sosplanete-v2/src/components/catalog/CatalogCsvModal.tsx) | 397 | ATTENTION (Grand - A surveiller) |
| [apps/admin-sosplanete-v2/src/components/layout/DashboardLayout.tsx](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/admin-sosplanete-v2/src/components/layout/DashboardLayout.tsx) | 388 | ATTENTION (Grand - A surveiller) |
| [apps/sosplanete-v1/src/histoires/sos/SosStory.jsx](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/sosplanete-v1/src/histoires/sos/SosStory.jsx) | 371 | ATTENTION (Grand - A surveiller) |
| [apps/admin-sosplanete-v2/src/components/organization/ActionCategoryMapper.tsx](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/admin-sosplanete-v2/src/components/organization/ActionCategoryMapper.tsx) | 369 | ATTENTION (Grand - A surveiller) |
| [apps/backend-v2/test/recette-runner.ts](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/backend-v2/test/recette-runner.ts) | 359 | ATTENTION (Grand - A surveiller) |
| [apps/admin-sosplanete-v2/src/components/tracking/ActionsImportModal.tsx](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/admin-sosplanete-v2/src/components/tracking/ActionsImportModal.tsx) | 358 | ATTENTION (Grand - A surveiller) |
| [apps/admin-sosplanete-v2/src/components/organization/TeamEditModal.tsx](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/admin-sosplanete-v2/src/components/organization/TeamEditModal.tsx) | 357 | ATTENTION (Grand - A surveiller) |
| [apps/admin-sosplanete-v2/src/components/organization/AnchorsManager.tsx](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/admin-sosplanete-v2/src/components/organization/AnchorsManager.tsx) | 339 | ATTENTION (Grand - A surveiller) |
| [apps/sosplanete-v1/src/pages/Impacts/Impacts.jsx](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/sosplanete-v1/src/pages/Impacts/Impacts.jsx) | 337 | ATTENTION (Grand - A surveiller) |
| [apps/admin-sosplanete-v2/src/components/catalog/ReferenceCsvModal.tsx](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/admin-sosplanete-v2/src/components/catalog/ReferenceCsvModal.tsx) | 331 | ATTENTION (Grand - A surveiller) |
| [apps/sosplanete-v1/src/histoires/sos/Story.js](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/sosplanete-v1/src/histoires/sos/Story.js) | 327 | ATTENTION (Grand - A surveiller) |
| [apps/admin-sosplanete-v2/src/app/dashboard/players/page.tsx](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/admin-sosplanete-v2/src/app/dashboard/players/page.tsx) | 312 | ATTENTION (Grand - A surveiller) |
| [apps/admin-sosplanete-v2/src/components/users/UserEditModal.tsx](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/admin-sosplanete-v2/src/components/users/UserEditModal.tsx) | 310 | ATTENTION (Grand - A surveiller) |
| [apps/admin-sosplanete-v2/src/components/organization/CsvImportModal.tsx](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/admin-sosplanete-v2/src/components/organization/CsvImportModal.tsx) | 306 | ATTENTION (Grand - A surveiller) |
| [apps/admin-sosplanete-v2/src/components/organization/CategoryImportModal.tsx](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/admin-sosplanete-v2/src/components/organization/CategoryImportModal.tsx) | 306 | ATTENTION (Grand - A surveiller) |
| [apps/admin-sosplanete-v2/src/app/dashboard/catalog/page.tsx](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/admin-sosplanete-v2/src/app/dashboard/catalog/page.tsx) | 304 | ATTENTION (Grand - A surveiller) |
| [apps/admin-sosplanete-v2/src/components/catalog/LocalActionEditModal.tsx](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/admin-sosplanete-v2/src/components/catalog/LocalActionEditModal.tsx) | 302 | ATTENTION (Grand - A surveiller) |
| [apps/sosplanete-v1/src/minigames/Tri/Game.jsx](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/sosplanete-v1/src/minigames/Tri/Game.jsx) | 293 | OK (Moyen) |
| [apps/backend-v2/src/modules/team/team.service.ts](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/backend-v2/src/modules/team/team.service.ts) | 283 | OK (Moyen) |
| [apps/sosplanete-v1/src/pages/Login/Login.jsx](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/sosplanete-v1/src/pages/Login/Login.jsx) | 270 | OK (Moyen) |
| [apps/sosplanete-v1/src/pages/Actions/Actions.jsx](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/sosplanete-v1/src/pages/Actions/Actions.jsx) | 256 | OK (Moyen) |
| [apps/sosplanete-v1/src/pages/Scores/Scores.jsx](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/sosplanete-v1/src/pages/Scores/Scores.jsx) | 248 | OK (Moyen) |
| [apps/backend-v2/src/modules/period/period.service.ts](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/backend-v2/src/modules/period/period.service.ts) | 241 | OK (Moyen) |
| [apps/admin-sosplanete-v2/src/components/settings/UsersSection.tsx](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/admin-sosplanete-v2/src/components/settings/UsersSection.tsx) | 233 | OK (Moyen) |
| [apps/backend-v2/src/modules/instance/instance.service.spec.ts](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/backend-v2/src/modules/instance/instance.service.spec.ts) | 230 | OK (Moyen) |
| [apps/admin-sosplanete-v2/src/components/catalog/mapping/ReferenceList.tsx](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/admin-sosplanete-v2/src/components/catalog/mapping/ReferenceList.tsx) | 226 | OK (Moyen) |
| [apps/backend-v2/src/modules/category/category.service.ts](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/backend-v2/src/modules/category/category.service.ts) | 222 | OK (Moyen) |
| [apps/admin-sosplanete-v2/src/components/layout/TopBar.tsx](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/admin-sosplanete-v2/src/components/layout/TopBar.tsx) | 221 | OK (Moyen) |
| [apps/admin-sosplanete-v2/src/components/catalog/mapping/LocalList.tsx](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/admin-sosplanete-v2/src/components/catalog/mapping/LocalList.tsx) | 221 | OK (Moyen) |
| [apps/backend-v2/src/modules/tracking/tracking.service.ts](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/backend-v2/src/modules/tracking/tracking.service.ts) | 216 | OK (Moyen) |
| [apps/sosplanete-v1/src/histoires/sos/Chapitre.jsx](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/sosplanete-v1/src/histoires/sos/Chapitre.jsx) | 213 | OK (Moyen) |
| [apps/admin-sosplanete-v2/src/components/settings/CatalogSection.tsx](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/admin-sosplanete-v2/src/components/settings/CatalogSection.tsx) | 202 | OK (Moyen) |
| [apps/sosplanete-v1/src/minigames/Bataille/BatailleChoix.jsx](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/sosplanete-v1/src/minigames/Bataille/BatailleChoix.jsx) | 198 | OK (Moyen) |
| [apps/sosplanete-v1/src/utils/AuthContext.jsx](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/sosplanete-v1/src/utils/AuthContext.jsx) | 194 | OK (Moyen) |
| [apps/backend-v2/src/modules/local-action/local-action.service.ts](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/backend-v2/src/modules/local-action/local-action.service.ts) | 193 | OK (Moyen) |
| [apps/admin-sosplanete-v2/src/types/index.ts](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/admin-sosplanete-v2/src/types/index.ts) | 192 | OK (Moyen) |
| [apps/sosplanete-v1/src/pages/Actions/Action.jsx](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/sosplanete-v1/src/pages/Actions/Action.jsx) | 191 | OK (Moyen) |
| [apps/sosplanete-v1/src/minigames/Tri/Tri.jsx](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/sosplanete-v1/src/minigames/Tri/Tri.jsx) | 190 | OK (Moyen) |
| [apps/admin-sosplanete-v2/src/components/auth/LoginForm.tsx](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/admin-sosplanete-v2/src/components/auth/LoginForm.tsx) | 180 | OK (Moyen) |
| [apps/admin-sosplanete-v2/src/components/organization/EditPlayerModal.tsx](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/admin-sosplanete-v2/src/components/organization/EditPlayerModal.tsx) | 175 | OK (Moyen) |
| [apps/sosplanete-v1/src/minigames/Quizz/Quizz.jsx](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/sosplanete-v1/src/minigames/Quizz/Quizz.jsx) | 167 | OK (Moyen) |
| [apps/backend-v2/src/modules/users/users.controller.ts](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/backend-v2/src/modules/users/users.controller.ts) | 167 | OK (Moyen) |
| [apps/sosplanete-v1/src/minigames/Quizz/QuizzQuestion.jsx](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/sosplanete-v1/src/minigames/Quizz/QuizzQuestion.jsx) | 167 | OK (Moyen) |
| [apps/sosplanete-v1/src/minigames/Bataille/Bataille.jsx](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/sosplanete-v1/src/minigames/Bataille/Bataille.jsx) | 166 | OK (Moyen) |
| [apps/backend-v2/src/modules/stimulation/eco-bar-race.service.ts](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/backend-v2/src/modules/stimulation/eco-bar-race.service.ts) | 165 | OK (Moyen) |
| [apps/sosplanete-v1/src/minigames/Tri/Dechets.js](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/sosplanete-v1/src/minigames/Tri/Dechets.js) | 164 | OK (Moyen) |
| [apps/backend-v2/src/modules/team/team.controller.ts](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/backend-v2/src/modules/team/team.controller.ts) | 162 | OK (Moyen) |
| [apps/sosplanete-v1/src/utils/Breakpoints.js](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/sosplanete-v1/src/utils/Breakpoints.js) | 161 | OK (Moyen) |
| [apps/backend-v2/src/modules/instance/instance.controller.ts](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/backend-v2/src/modules/instance/instance.controller.ts) | 158 | OK (Moyen) |
| [apps/backend-v2/scripts/import-excel-actions.ts](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/backend-v2/scripts/import-excel-actions.ts) | 155 | OK (Moyen) |
| [apps/admin-sosplanete-v2/src/components/organization/EditGroupModal.tsx](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/admin-sosplanete-v2/src/components/organization/EditGroupModal.tsx) | 155 | OK (Moyen) |
| [apps/sosplanete-v1/src/pages/Moi/Moi.jsx](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/sosplanete-v1/src/pages/Moi/Moi.jsx) | 152 | OK (Moyen) |
| [apps/sosplanete-v1/src/components/NavBar.jsx](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/sosplanete-v1/src/components/NavBar.jsx) | 150 | OK (Correct) |
| [apps/backend-v2/src/modules/stimulation/eco-bar-race.service.spec.ts](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/backend-v2/src/modules/stimulation/eco-bar-race.service.spec.ts) | 150 | OK (Correct) |
| [apps/backend-v2/src/modules/category-ref/category-ref.service.ts](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/backend-v2/src/modules/category-ref/category-ref.service.ts) | 142 | OK (Correct) |
| [apps/backend-v2/src/modules/stimulation/animal-unlock.service.ts](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/backend-v2/src/modules/stimulation/animal-unlock.service.ts) | 142 | OK (Correct) |
| [apps/sosplanete-v1/src/serviceWorkerRegistration.js](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/sosplanete-v1/src/serviceWorkerRegistration.js) | 141 | OK (Correct) |
| [apps/backend-v2/src/modules/instance/year.service.ts](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/backend-v2/src/modules/instance/year.service.ts) | 139 | OK (Correct) |
| [apps/admin-sosplanete-v2/src/app/dashboard/select-instance/page.tsx](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/admin-sosplanete-v2/src/app/dashboard/select-instance/page.tsx) | 135 | OK (Correct) |
| [apps/sosplanete-v1/src/minigames/Quizz/QuizzResultat.jsx](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/sosplanete-v1/src/minigames/Quizz/QuizzResultat.jsx) | 132 | OK (Correct) |
| [apps/backend-v2/src/modules/auth/auth.service.ts](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/backend-v2/src/modules/auth/auth.service.ts) | 130 | OK (Correct) |
| [apps/sosplanete-v1/src/minigames/Bataille/BatailleResultats.jsx](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/sosplanete-v1/src/minigames/Bataille/BatailleResultats.jsx) | 129 | OK (Correct) |
| [apps/backend-v2/prisma/apply_v3_full.ts](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/backend-v2/prisma/apply_v3_full.ts) | 127 | OK (Correct) |
| [apps/sosplanete-v1/src/pages/Actions/CategoriesNavbar.jsx](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/sosplanete-v1/src/pages/Actions/CategoriesNavbar.jsx) | 126 | OK (Correct) |
| [apps/admin-sosplanete-v2/src/components/organization/InitializeYearModal.tsx](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/admin-sosplanete-v2/src/components/organization/InitializeYearModal.tsx) | 125 | OK (Correct) |
| [apps/backend-v2/src/modules/stimulation/stimulation.service.ts](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/backend-v2/src/modules/stimulation/stimulation.service.ts) | 125 | OK (Correct) |
| [apps/sosplanete-v1/src/pages/Scores/ScoresTotal.jsx](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/sosplanete-v1/src/pages/Scores/ScoresTotal.jsx) | 124 | OK (Correct) |
| [apps/sosplanete-v1/src/components/Mascotte/Mascotte.jsx](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/sosplanete-v1/src/components/Mascotte/Mascotte.jsx) | 124 | OK (Correct) |
| [apps/admin-sosplanete-v2/src/components/catalog/ActionGalleryCard.tsx](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/admin-sosplanete-v2/src/components/catalog/ActionGalleryCard.tsx) | 117 | OK (Correct) |
| [apps/sosplanete-v1/src/pages/Scores/DeblocageAnimaux.jsx](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/sosplanete-v1/src/pages/Scores/DeblocageAnimaux.jsx) | 116 | OK (Correct) |
| [apps/backend-v2/test/test-006.ts](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/backend-v2/test/test-006.ts) | 113 | OK (Correct) |
| [apps/backend-v2/scratch/test-tracking-service.ts](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/backend-v2/scratch/test-tracking-service.ts) | 111 | OK (Correct) |
| [apps/sosplanete-v1/src/minigames/Bataille/BatailleContext.jsx](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/sosplanete-v1/src/minigames/Bataille/BatailleContext.jsx) | 109 | OK (Correct) |
| [apps/backend-v2/src/modules/child/child.service.ts](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/backend-v2/src/modules/child/child.service.ts) | 108 | OK (Correct) |
| [apps/backend-v2/src/modules/local-action/local-action.controller.ts](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/backend-v2/src/modules/local-action/local-action.controller.ts) | 107 | OK (Correct) |
| [apps/backend-v2/src/modules/action-ref/action-ref.service.ts](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/backend-v2/src/modules/action-ref/action-ref.service.ts) | 107 | OK (Correct) |
| [apps/sosplanete-v1/src/pages/Fiche/Fiche.jsx](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/sosplanete-v1/src/pages/Fiche/Fiche.jsx) | 105 | OK (Correct) |
| [apps/admin-sosplanete-v2/src/components/instances/InstanceDeleteConfirm.tsx](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/admin-sosplanete-v2/src/components/instances/InstanceDeleteConfirm.tsx) | 105 | OK (Correct) |
| [apps/admin-sosplanete-v2/src/hooks/useSession.ts](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/admin-sosplanete-v2/src/hooks/useSession.ts) | 101 | OK (Correct) |
| [apps/sosplanete-v1/src/minigames/Tri/TriGameContext.jsx](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/sosplanete-v1/src/minigames/Tri/TriGameContext.jsx) | 101 | OK (Correct) |
| [apps/sosplanete-v1/src/minigames/GameContext.jsx](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/sosplanete-v1/src/minigames/GameContext.jsx) | 100 | OK (Correct) |
| [apps/admin-sosplanete-v2/src/components/ui/FloatingActionBar.tsx](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/admin-sosplanete-v2/src/components/ui/FloatingActionBar.tsx) | 99 | OK (Correct) |
| [apps/sosplanete-v1/src/App.jsx](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/sosplanete-v1/src/App.jsx) | 98 | OK (Correct) |
| [apps/sosplanete-v1/src/minigames/Bataille/BatailleGame.jsx](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/sosplanete-v1/src/minigames/Bataille/BatailleGame.jsx) | 98 | OK (Correct) |
| [apps/sosplanete-v1/src/minigames/Tri/Resultats.jsx](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/sosplanete-v1/src/minigames/Tri/Resultats.jsx) | 98 | OK (Correct) |
| [apps/admin-sosplanete-v2/src/components/ui/ConfirmDialog.tsx](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/admin-sosplanete-v2/src/components/ui/ConfirmDialog.tsx) | 98 | OK (Correct) |
| [apps/backend-v2/src/modules/legacy-api/legacy-api.controller.ts](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/backend-v2/src/modules/legacy-api/legacy-api.controller.ts) | 94 | OK (Correct) |
| [apps/sosplanete-v1/src/minigames/Bataille/BatailleCard.jsx](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/sosplanete-v1/src/minigames/Bataille/BatailleCard.jsx) | 91 | OK (Correct) |
| [apps/sosplanete-v1/src/pages/Moi/ChildCard.jsx](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/sosplanete-v1/src/pages/Moi/ChildCard.jsx) | 88 | OK (Correct) |
| [apps/sosplanete-v1/src/pages/Moi/ActionRealisees.jsx](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/sosplanete-v1/src/pages/Moi/ActionRealisees.jsx) | 87 | OK (Correct) |
| [apps/backend-v2/src/main.ts](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/backend-v2/src/main.ts) | 87 | OK (Correct) |
| [apps/backend-v2/src/modules/stimulation/stimulation.controller.ts](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/backend-v2/src/modules/stimulation/stimulation.controller.ts) | 85 | OK (Correct) |
| [apps/sosplanete-v1/src/pages/Fiche/Categorie.jsx](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/sosplanete-v1/src/pages/Fiche/Categorie.jsx) | 85 | OK (Correct) |
| [apps/admin-sosplanete-v2/src/components/catalog/GalleryGroup.tsx](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/admin-sosplanete-v2/src/components/catalog/GalleryGroup.tsx) | 83 | OK (Correct) |
| [apps/sosplanete-v1/src/pages/Profile/Profile.jsx](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/sosplanete-v1/src/pages/Profile/Profile.jsx) | 83 | OK (Correct) |
| [apps/sosplanete-v1/src/minigames/Quizz/QuizzGame.jsx](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/sosplanete-v1/src/minigames/Quizz/QuizzGame.jsx) | 81 | OK (Correct) |
| [apps/backend-v2/src/modules/users/users.service.ts](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/backend-v2/src/modules/users/users.service.ts) | 80 | OK (Correct) |
| [apps/backend-v2/src/common/filters/global-exception.filter.ts](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/backend-v2/src/common/filters/global-exception.filter.ts) | 80 | OK (Correct) |
| [apps/admin-sosplanete-v2/src/hooks/useInstanceYear.ts](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/admin-sosplanete-v2/src/hooks/useInstanceYear.ts) | 80 | OK (Correct) |
| [apps/backend-v2/src/modules/category-ref/category-ref.controller.ts](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/backend-v2/src/modules/category-ref/category-ref.controller.ts) | 74 | OK (Correct) |
| [apps/backend-v2/prisma/apply_corrections_v2.ts](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/backend-v2/prisma/apply_corrections_v2.ts) | 74 | OK (Correct) |
| [apps/backend-v2/src/app.module.ts](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/backend-v2/src/app.module.ts) | 74 | OK (Correct) |
| [apps/sosplanete-v1/src/service-worker.js](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/sosplanete-v1/src/service-worker.js) | 73 | OK (Correct) |
| [apps/backend-v2/prisma/restore_test_env.ts](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/backend-v2/prisma/restore_test_env.ts) | 71 | OK (Correct) |
| [apps/backend-v2/src/seed.ts](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/backend-v2/src/seed.ts) | 70 | OK (Correct) |
| [apps/sosplanete-v1/src/hooks/useSwipe.jsx](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/sosplanete-v1/src/hooks/useSwipe.jsx) | 69 | OK (Correct) |
| [apps/sosplanete-v1/src/pages/Scores/ScoresSemaine.jsx](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/sosplanete-v1/src/pages/Scores/ScoresSemaine.jsx) | 68 | OK (Correct) |
| [apps/sosplanete-v1/src/api/nnauruAPI.jsx](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/sosplanete-v1/src/api/nnauruAPI.jsx) | 68 | OK (Correct) |
| [apps/sosplanete-v1/src/pages/Scores/Histogramme.jsx](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/sosplanete-v1/src/pages/Scores/Histogramme.jsx) | 66 | OK (Correct) |
| [apps/backend-v2/src/modules/category/category.controller.ts](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/backend-v2/src/modules/category/category.controller.ts) | 63 | OK (Correct) |
| [apps/sosplanete-v1/src/minigames/components/CountDown.jsx](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/sosplanete-v1/src/minigames/components/CountDown.jsx) | 60 | OK (Correct) |
| [apps/admin-sosplanete-v2/src/components/ui/PremiumProgressBar.tsx](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/admin-sosplanete-v2/src/components/ui/PremiumProgressBar.tsx) | 59 | OK (Correct) |
| [apps/admin-sosplanete-v2/src/components/ui/Button.tsx](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/admin-sosplanete-v2/src/components/ui/Button.tsx) | 58 | OK (Correct) |
| [apps/backend-v2/scratch/debug-ecobar.ts](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/backend-v2/scratch/debug-ecobar.ts) | 57 | OK (Correct) |
| [apps/sosplanete-v1/src/components/Toggles/ToggleSwitch.jsx](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/sosplanete-v1/src/components/Toggles/ToggleSwitch.jsx) | 57 | OK (Correct) |
| [apps/sosplanete-v1/src/pages/Scores/ImageSlider.jsx](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/sosplanete-v1/src/pages/Scores/ImageSlider.jsx) | 56 | OK (Correct) |
| [apps/sosplanete-v1/src/pages/Discovery/Discovery.jsx](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/sosplanete-v1/src/pages/Discovery/Discovery.jsx) | 56 | OK (Correct) |
| [apps/backend-v2/src/modules/auth/auth.controller.ts](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/backend-v2/src/modules/auth/auth.controller.ts) | 56 | OK (Correct) |
| [apps/sosplanete-v1/src/pages/Fiche/Categories.jsx](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/sosplanete-v1/src/pages/Fiche/Categories.jsx) | 55 | OK (Correct) |
| [apps/sosplanete-v1/src/minigames/Games.jsx](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/sosplanete-v1/src/minigames/Games.jsx) | 55 | OK (Correct) |
| [apps/backend-v2/src/modules/impact/impact.controller.ts](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/backend-v2/src/modules/impact/impact.controller.ts) | 55 | OK (Correct) |
| [apps/backend-v2/prisma/update_test_csvs_v3.ts](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/backend-v2/prisma/update_test_csvs_v3.ts) | 55 | OK (Correct) |
| [apps/backend-v2/src/modules/period/period.controller.ts](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/backend-v2/src/modules/period/period.controller.ts) | 54 | OK (Correct) |
| [apps/backend-v2/src/modules/group/group.service.ts](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/backend-v2/src/modules/group/group.service.ts) | 54 | OK (Correct) |
| [apps/sosplanete-v1/src/minigames/Tri/container.jsx](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/sosplanete-v1/src/minigames/Tri/container.jsx) | 53 | OK (Correct) |
| [apps/backend-v2/src/modules/instance/dto/create-instance.dto.ts](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/backend-v2/src/modules/instance/dto/create-instance.dto.ts) | 53 | OK (Correct) |
| [apps/sosplanete-v1/src/utils/MiniGamesUtils.js](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/sosplanete-v1/src/utils/MiniGamesUtils.js) | 51 | OK (Correct) |
| [apps/sosplanete-v1/src/api/ApiContext.jsx](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/sosplanete-v1/src/api/ApiContext.jsx) | 50 | OK (Correct) |
| [apps/sosplanete-v1/src/pages/Moi/Foret.jsx](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/sosplanete-v1/src/pages/Moi/Foret.jsx) | 50 | OK (Correct) |
| [apps/backend-v2/prisma/seed.ts](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/backend-v2/prisma/seed.ts) | 50 | OK (Correct) |
| [apps/sosplanete-v1/src/components/SpeechText.jsx](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/sosplanete-v1/src/components/SpeechText.jsx) | 49 | OK (Correct) |
| [apps/backend-v2/src/modules/action-ref/action-ref.controller.ts](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/backend-v2/src/modules/action-ref/action-ref.controller.ts) | 49 | OK (Correct) |
| [apps/admin-sosplanete-v2/src/hooks/useSchoolYear.ts](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/admin-sosplanete-v2/src/hooks/useSchoolYear.ts) | 48 | OK (Correct) |
| [apps/sosplanete-v1/src/components/Header.jsx](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/sosplanete-v1/src/components/Header.jsx) | 47 | OK (Correct) |
| [apps/backend-v2/scratch/check_scores.ts](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/backend-v2/scratch/check_scores.ts) | 47 | OK (Correct) |
| [apps/backend-v2/prisma/audit_full_catalog.ts](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/backend-v2/prisma/audit_full_catalog.ts) | 46 | OK (Correct) |
| [apps/backend-v2/scripts/migrate-school-year.ts](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/backend-v2/scripts/migrate-school-year.ts) | 45 | OK (Correct) |
| [apps/sosplanete-v1/src/components/Icons/GamePad.jsx](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/sosplanete-v1/src/components/Icons/GamePad.jsx) | 44 | OK (Correct) |
| [apps/backend-v2/scratch/diagnose-cancel.js](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/backend-v2/scratch/diagnose-cancel.js) | 43 | OK (Correct) |
| [apps/sosplanete-v1/src/main.jsx](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/sosplanete-v1/src/main.jsx) | 43 | OK (Correct) |
| [apps/backend-v2/src/modules/child/child.controller.ts](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/backend-v2/src/modules/child/child.controller.ts) | 42 | OK (Correct) |
| [apps/backend-v2/migrate.ts](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/backend-v2/migrate.ts) | 41 | OK (Correct) |
| [apps/sosplanete-v1/src/minigames/components/LevelManager.jsx](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/sosplanete-v1/src/minigames/components/LevelManager.jsx) | 41 | OK (Correct) |
| [apps/backend-v2/src/modules/tracking/tracking.controller.ts](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/backend-v2/src/modules/tracking/tracking.controller.ts) | 41 | OK (Correct) |
| [apps/sosplanete-v1/src/pages/Scores/ScoresTeams.jsx](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/sosplanete-v1/src/pages/Scores/ScoresTeams.jsx) | 41 | OK (Correct) |
| [apps/sosplanete-v1/src/components/audio/Player.jsx](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/sosplanete-v1/src/components/audio/Player.jsx) | 41 | OK (Correct) |
| [apps/backend-v2/test_query.js](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/backend-v2/test_query.js) | 40 | OK (Correct) |
| [apps/backend-v2/scratch/debug_findone.js](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/backend-v2/scratch/debug_findone.js) | 40 | OK (Correct) |
| [apps/backend-v2/prisma/sync_actions_impact.ts](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/backend-v2/prisma/sync_actions_impact.ts) | 40 | OK (Correct) |
| [apps/backend-v2/scratch/debug-neyron.ts](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/backend-v2/scratch/debug-neyron.ts) | 39 | OK (Correct) |
| [apps/admin-sosplanete-v2/src/components/ui/Input.tsx](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/admin-sosplanete-v2/src/components/ui/Input.tsx) | 38 | OK (Correct) |
| [apps/backend-v2/prisma/diag_neyron.ts](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/backend-v2/prisma/diag_neyron.ts) | 38 | OK (Correct) |
| [apps/backend-v2/scratch/debug-actions.ts](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/backend-v2/scratch/debug-actions.ts) | 37 | OK (Correct) |
| [apps/sosplanete-v1/src/components/Icons/Cogs.jsx](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/sosplanete-v1/src/components/Icons/Cogs.jsx) | 37 | OK (Correct) |
| [apps/admin-sosplanete-v2/src/utils/storage.ts](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/admin-sosplanete-v2/src/utils/storage.ts) | 36 | OK (Correct) |
| [apps/sosplanete-v1/src/api/config/axiosUtils.jsx](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/sosplanete-v1/src/api/config/axiosUtils.jsx) | 36 | OK (Correct) |
| [apps/sosplanete-v1/src/hooks/useBeforeUnload.js](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/sosplanete-v1/src/hooks/useBeforeUnload.js) | 35 | OK (Correct) |
| [apps/backend-v2/scratch/migrate-years.ts](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/backend-v2/scratch/migrate-years.ts) | 34 | OK (Correct) |
| [apps/backend-v2/src/modules/auth/jwt.strategy.ts](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/backend-v2/src/modules/auth/jwt.strategy.ts) | 34 | OK (Correct) |
| [apps/backend-v2/scratch/fix-sequences.ts](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/backend-v2/scratch/fix-sequences.ts) | 34 | OK (Correct) |
| [apps/sosplanete-v1/src/api/config/axiosConfig.jsx](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/sosplanete-v1/src/api/config/axiosConfig.jsx) | 34 | OK (Correct) |
| [apps/sosplanete-v1/src/histoires/sos/VignettesChapitres.jsx](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/sosplanete-v1/src/histoires/sos/VignettesChapitres.jsx) | 34 | OK (Correct) |
| [apps/backend-v2/prisma/diag_impact_recalcul.ts](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/backend-v2/prisma/diag_impact_recalcul.ts) | 33 | OK (Correct) |
| [apps/backend-v2/scripts/create-test-instances.ts](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/backend-v2/scripts/create-test-instances.ts) | 33 | OK (Correct) |
| [apps/backend-v2/src/modules/team/dto/create-team.dto.ts](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/backend-v2/src/modules/team/dto/create-team.dto.ts) | 33 | OK (Correct) |
| [apps/admin-sosplanete-v2/src/utils/format.ts](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/admin-sosplanete-v2/src/utils/format.ts) | 32 | OK (Correct) |
| [apps/backend-v2/src/modules/group/group.controller.ts](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/backend-v2/src/modules/group/group.controller.ts) | 32 | OK (Correct) |
| [apps/sosplanete-v1/src/components/Modals/Modal.jsx](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/sosplanete-v1/src/components/Modals/Modal.jsx) | 32 | OK (Correct) |
| [apps/backend-v2/scratch/debug_update.js](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/backend-v2/scratch/debug_update.js) | 30 | OK (Correct) |
| [apps/backend-v2/scratch/check-db.ts](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/backend-v2/scratch/check-db.ts) | 29 | OK (Correct) |
| [apps/sosplanete-v1/src/pages/Actions/LinkGame.jsx](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/sosplanete-v1/src/pages/Actions/LinkGame.jsx) | 29 | OK (Correct) |
| [apps/backend-v2/scratch/check_db.ts](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/backend-v2/scratch/check_db.ts) | 29 | OK (Correct) |
| [apps/backend-v2/scratch/debug_patch.js](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/backend-v2/scratch/debug_patch.js) | 28 | OK (Correct) |
| [apps/sosplanete-v1/src/pages/Scores/AnimauxData.js](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/sosplanete-v1/src/pages/Scores/AnimauxData.js) | 28 | OK (Correct) |
| [apps/backend-v2/src/modules/legacy-api/legacy-api.service.spec.ts](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/backend-v2/src/modules/legacy-api/legacy-api.service.spec.ts) | 27 | OK (Correct) |
| [apps/sosplanete-v1/src/components/Modals/ModalInfo.jsx](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/sosplanete-v1/src/components/Modals/ModalInfo.jsx) | 27 | OK (Correct) |
| [apps/sosplanete-v1/src/hooks/useBreakpoints.js](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/sosplanete-v1/src/hooks/useBreakpoints.js) | 27 | OK (Correct) |
| [apps/backend-v2/src/modules/stimulation/stimulation.controller.spec.ts](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/backend-v2/src/modules/stimulation/stimulation.controller.spec.ts) | 27 | OK (Correct) |
| [apps/backend-v2/src/modules/auth/auth.module.ts](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/backend-v2/src/modules/auth/auth.module.ts) | 26 | OK (Correct) |
| [apps/backend-v2/test/app.e2e-spec.ts](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/backend-v2/test/app.e2e-spec.ts) | 26 | OK (Correct) |
| [apps/admin-sosplanete-v2/src/app/dashboard/layout.tsx](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/admin-sosplanete-v2/src/app/dashboard/layout.tsx) | 26 | OK (Correct) |
| [apps/backend-v2/scratch/debug-tracking.ts](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/backend-v2/scratch/debug-tracking.ts) | 25 | OK (Correct) |
| [apps/backend-v2/src/modules/stimulation/stimulation.service.spec.ts](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/backend-v2/src/modules/stimulation/stimulation.service.spec.ts) | 25 | OK (Correct) |
| [apps/sosplanete-v1/src/components/Chart/Camembert.jsx](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/sosplanete-v1/src/components/Chart/Camembert.jsx) | 25 | OK (Correct) |
| [apps/admin-sosplanete-v2/src/utils/assets.ts](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/admin-sosplanete-v2/src/utils/assets.ts) | 25 | OK (Correct) |
| [apps/sosplanete-v1/src/components/animations/Flip/Flip.jsx](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/sosplanete-v1/src/components/animations/Flip/Flip.jsx) | 25 | OK (Correct) |
| [apps/sosplanete-v1/src/pages/Impacts/Impact.jsx](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/sosplanete-v1/src/pages/Impacts/Impact.jsx) | 24 | OK (Correct) |
| [apps/admin-sosplanete-v2/src/components/ui/GlassCard.tsx](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/admin-sosplanete-v2/src/components/ui/GlassCard.tsx) | 23 | OK (Correct) |
| [apps/admin-sosplanete-v2/src/app/layout.tsx](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/admin-sosplanete-v2/src/app/layout.tsx) | 23 | OK (Correct) |
| [apps/sosplanete-v1/src/minigames/GamesList.js](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/sosplanete-v1/src/minigames/GamesList.js) | 23 | OK (Correct) |
| [apps/backend-v2/src/modules/legacy-api/legacy-api.controller.spec.ts](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/backend-v2/src/modules/legacy-api/legacy-api.controller.spec.ts) | 23 | OK (Correct) |
| [apps/backend-v2/src/app.controller.spec.ts](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/backend-v2/src/app.controller.spec.ts) | 23 | OK (Correct) |
| [apps/backend-v2/src/modules/auth/roles.guard.ts](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/backend-v2/src/modules/auth/roles.guard.ts) | 22 | OK (Correct) |
| [apps/sosplanete-v1/src/components/Tabs/TabNavItem.jsx](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/sosplanete-v1/src/components/Tabs/TabNavItem.jsx) | 21 | OK (Correct) |
| [apps/backend-v2/src/modules/users/dto/create-user.dto.ts](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/backend-v2/src/modules/users/dto/create-user.dto.ts) | 21 | OK (Correct) |
| [apps/sosplanete-v1/src/minigames/components/Kids.jsx](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/sosplanete-v1/src/minigames/components/Kids.jsx) | 21 | OK (Correct) |
| [apps/backend-v2/scratch/list-users.ts](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/backend-v2/scratch/list-users.ts) | 21 | OK (Correct) |
| [apps/sosplanete-v1/src/components/Icons/Book.jsx](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/sosplanete-v1/src/components/Icons/Book.jsx) | 21 | OK (Correct) |
| [apps/backend-v2/scratch/fetch-stats.js](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/backend-v2/scratch/fetch-stats.js) | 20 | OK (Correct) |
| [apps/backend-v2/scratch/recalculate.ts](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/backend-v2/scratch/recalculate.ts) | 20 | OK (Correct) |
| [apps/sosplanete-v1/src/pages/Impacts/Depassement.jsx](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/sosplanete-v1/src/pages/Impacts/Depassement.jsx) | 19 | OK (Correct) |
| [apps/admin-sosplanete-v2/src/app/login/page.tsx](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/admin-sosplanete-v2/src/app/login/page.tsx) | 19 | OK (Correct) |
| [apps/sosplanete-v1/src/utils/Langage.js](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/sosplanete-v1/src/utils/Langage.js) | 18 | OK (Correct) |
| [apps/backend-v2/prisma/check_catalog.ts](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/backend-v2/prisma/check_catalog.ts) | 18 | OK (Correct) |
| [apps/backend-v2/src/modules/auth/dto/login.dto.ts](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/backend-v2/src/modules/auth/dto/login.dto.ts) | 18 | OK (Correct) |
| [apps/sosplanete-v1/src/components/animations/Slides/SlideIn/SlideIn.jsx](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/sosplanete-v1/src/components/animations/Slides/SlideIn/SlideIn.jsx) | 18 | OK (Correct) |
| [apps/sosplanete-v1/src/histoires/sos/ResumeChapitre.jsx](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/sosplanete-v1/src/histoires/sos/ResumeChapitre.jsx) | 17 | OK (Correct) |
| [apps/backend-v2/src/modules/stimulation/stimulation.module.ts](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/backend-v2/src/modules/stimulation/stimulation.module.ts) | 17 | OK (Correct) |
| [apps/backend-v2/src/common/interfaces/authenticated-user.interface.ts](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/backend-v2/src/common/interfaces/authenticated-user.interface.ts) | 17 | OK (Correct) |
| [apps/backend-v2/src/modules/category-ref/category-ref.module.ts](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/backend-v2/src/modules/category-ref/category-ref.module.ts) | 17 | OK (Correct) |
| [apps/sosplanete-v1/src/config.js](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/sosplanete-v1/src/config.js) | 17 | OK (Correct) |
| [apps/sosplanete-v1/src/components/Footer.jsx](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/sosplanete-v1/src/components/Footer.jsx) | 17 | OK (Correct) |
| [apps/sosplanete-v1/src/components/Icons/Impact.jsx](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/sosplanete-v1/src/components/Icons/Impact.jsx) | 16 | OK (Correct) |
| [apps/sosplanete-v1/src/components/Badges/BadgeInfo.jsx](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/sosplanete-v1/src/components/Badges/BadgeInfo.jsx) | 16 | OK (Correct) |
| [apps/backend-v2/src/modules/legacy-api/legacy-api.module.ts](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/backend-v2/src/modules/legacy-api/legacy-api.module.ts) | 15 | OK (Correct) |
| [apps/sosplanete-v1/src/components/animations/Bounce/Bounce.jsx](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/sosplanete-v1/src/components/animations/Bounce/Bounce.jsx) | 15 | OK (Correct) |
| [apps/sosplanete-v1/src/components/animations/ZoomIn/ZoomIn.jsx](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/sosplanete-v1/src/components/animations/ZoomIn/ZoomIn.jsx) | 14 | OK (Correct) |
| [apps/sosplanete-v1/src/components/Icons/Fiche.jsx](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/sosplanete-v1/src/components/Icons/Fiche.jsx) | 14 | OK (Correct) |
| [apps/sosplanete-v1/src/components/Icons/Scores.jsx](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/sosplanete-v1/src/components/Icons/Scores.jsx) | 14 | OK (Correct) |
| [apps/sosplanete-v1/src/components/Icons/Moi.jsx](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/sosplanete-v1/src/components/Icons/Moi.jsx) | 14 | OK (Correct) |
| [apps/backend-v2/scratch/check-instances.ts](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/backend-v2/scratch/check-instances.ts) | 14 | OK (Correct) |
| [apps/sosplanete-v1/src/hooks/useEffectOnce.js](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/sosplanete-v1/src/hooks/useEffectOnce.js) | 14 | OK (Correct) |
| [apps/backend-v2/src/modules/local-action/local-action.module.ts](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/backend-v2/src/modules/local-action/local-action.module.ts) | 14 | OK (Correct) |
| [apps/backend-v2/src/prisma/prisma.service.ts](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/backend-v2/src/prisma/prisma.service.ts) | 14 | OK (Correct) |
| [apps/backend-v2/src/modules/users/dto/update-user.dto.ts](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/backend-v2/src/modules/users/dto/update-user.dto.ts) | 14 | OK (Correct) |
| [apps/backend-v2/src/app.controller.ts](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/backend-v2/src/app.controller.ts) | 13 | OK (Correct) |
| [apps/backend-v2/test_db.js](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/backend-v2/test_db.js) | 13 | OK (Correct) |
| [apps/backend-v2/scratch/open-instances.ts](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/backend-v2/scratch/open-instances.ts) | 13 | OK (Correct) |
| [apps/backend-v2/src/modules/group/group.module.ts](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/backend-v2/src/modules/group/group.module.ts) | 13 | OK (Correct) |
| [apps/backend-v2/src/modules/category/category.module.ts](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/backend-v2/src/modules/category/category.module.ts) | 13 | OK (Correct) |
| [apps/backend-v2/src/modules/child/child.module.ts](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/backend-v2/src/modules/child/child.module.ts) | 13 | OK (Correct) |
| [apps/backend-v2/src/modules/impact/impact.module.ts](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/backend-v2/src/modules/impact/impact.module.ts) | 13 | OK (Correct) |
| [apps/backend-v2/src/modules/period/period.module.ts](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/backend-v2/src/modules/period/period.module.ts) | 13 | OK (Correct) |
| [apps/backend-v2/src/modules/team/team.module.ts](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/backend-v2/src/modules/team/team.module.ts) | 13 | OK (Correct) |
| [apps/sosplanete-v1/src/components/Tabs/TabContent.jsx](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/sosplanete-v1/src/components/Tabs/TabContent.jsx) | 13 | OK (Correct) |
| [apps/backend-v2/src/modules/instance/instance.module.ts](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/backend-v2/src/modules/instance/instance.module.ts) | 12 | OK (Correct) |
| [apps/backend-v2/src/modules/users/users.module.ts](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/backend-v2/src/modules/users/users.module.ts) | 11 | OK (Correct) |
| [apps/backend-v2/test_open_period.js](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/backend-v2/test_open_period.js) | 11 | OK (Correct) |
| [apps/backend-v2/scratch/call-recalculate.js](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/backend-v2/scratch/call-recalculate.js) | 11 | OK (Correct) |
| [apps/backend-v2/src/modules/action-ref/action-ref.module.ts](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/backend-v2/src/modules/action-ref/action-ref.module.ts) | 11 | OK (Correct) |
| [apps/admin-sosplanete-v2/fix_footer.js](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/admin-sosplanete-v2/fix_footer.js) | 11 | OK (Correct) |
| [apps/backend-v2/scratch/check-config.ts](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/backend-v2/scratch/check-config.ts) | 10 | OK (Correct) |
| [apps/backend-v2/src/modules/tracking/tracking.module.ts](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/backend-v2/src/modules/tracking/tracking.module.ts) | 10 | OK (Correct) |
| [apps/sosplanete-v1/src/utils/PrivateRoutes.jsx](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/sosplanete-v1/src/utils/PrivateRoutes.jsx) | 10 | OK (Correct) |
| [apps/admin-sosplanete-v2/next.config.ts](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/admin-sosplanete-v2/next.config.ts) | 10 | OK (Correct) |
| [apps/admin-sosplanete-v2/src/app/dashboard/reference/page.tsx](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/admin-sosplanete-v2/src/app/dashboard/reference/page.tsx) | 10 | OK (Correct) |
| [apps/backend-v2/src/prisma/prisma.module.ts](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/backend-v2/src/prisma/prisma.module.ts) | 10 | OK (Correct) |
| [apps/admin-sosplanete-v2/src/app/dashboard/users/page.tsx](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/admin-sosplanete-v2/src/app/dashboard/users/page.tsx) | 10 | OK (Correct) |
| [apps/backend-v2/src/app.service.ts](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/backend-v2/src/app.service.ts) | 9 | OK (Correct) |
| [apps/sosplanete-v1/src/minigames/Bataille/Cards.js](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/sosplanete-v1/src/minigames/Bataille/Cards.js) | 9 | OK (Correct) |
| [apps/sosplanete-v1/vite.config.js](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/sosplanete-v1/vite.config.js) | 9 | OK (Correct) |
| [apps/sosplanete-v1/src/minigames/Bataille/BatailleResultat.jsx](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/sosplanete-v1/src/minigames/Bataille/BatailleResultat.jsx) | 9 | OK (Correct) |
| [apps/sosplanete-v1/tailwind.config.js](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/sosplanete-v1/tailwind.config.js) | 9 | OK (Correct) |
| [apps/sosplanete-v1/src/components/Loading.jsx](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/sosplanete-v1/src/components/Loading.jsx) | 9 | OK (Correct) |
| [apps/backend-v2/scratch/check-dates.ts](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/backend-v2/scratch/check-dates.ts) | 8 | OK (Correct) |
| [apps/sosplanete-v1/postcss.config.js](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/sosplanete-v1/postcss.config.js) | 7 | OK (Correct) |
| [apps/backend-v2/src/modules/team/dto/import-csv.dto.ts](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/backend-v2/src/modules/team/dto/import-csv.dto.ts) | 7 | OK (Correct) |
| [apps/admin-sosplanete-v2/next-env.d.ts](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/admin-sosplanete-v2/next-env.d.ts) | 7 | OK (Correct) |
| [apps/admin-sosplanete-v2/postcss.config.js](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/admin-sosplanete-v2/postcss.config.js) | 6 | OK (Correct) |
| [apps/backend-v2/src/modules/auth/roles.decorator.ts](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/backend-v2/src/modules/auth/roles.decorator.ts) | 6 | OK (Correct) |
| [apps/backend-v2/src/modules/auth/jwt-auth.guard.ts](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/backend-v2/src/modules/auth/jwt-auth.guard.ts) | 6 | OK (Correct) |
| [apps/admin-sosplanete-v2/src/app/page.tsx](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/admin-sosplanete-v2/src/app/page.tsx) | 6 | OK (Correct) |
| [apps/backend-v2/src/modules/instance/dto/update-instance.dto.ts](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/backend-v2/src/modules/instance/dto/update-instance.dto.ts) | 5 | OK (Correct) |
| [apps/backend-v2/src/modules/team/dto/update-team.dto.ts](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/backend-v2/src/modules/team/dto/update-team.dto.ts) | 5 | OK (Correct) |
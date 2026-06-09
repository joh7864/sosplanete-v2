# Plan d'implémentation — Accès aux tableaux de bord (Suivi & Impact Global) depuis le jeu

Ce plan détaille l'ajout d'une fonctionnalité permettant à des élèves délégués d'accéder au **Suivi des actions** et à l'**Impact global** de leur établissement directement depuis l'interface du jeu `sosplanete-v1`, sans redirection vers le panneau d'administration.

---

## User Review Required

> [!IMPORTANT]
> **1. Option globale "Délégué pour tous"**  
> En plus de la désignation joueur par joueur, nous ajoutons un interrupteur global **"Délégué pour tous"** directement dans le bandeau de l'onglet **Configuration des équipes** de l'administration. Si cet interrupteur est activé, tous les élèves de cet établissement auront automatiquement accès à l'Espace Délégué depuis le jeu. Sinon, seuls les élèves individuellement marqués comme délégués y auront accès.
>
> **2. Sécurisation des routes héritées (Legacy API)**  
> Les requêtes envoyées depuis le jeu vers le backend pour récupérer les données d'impact ou de suivi seront sécurisées côté serveur (NestJS). Le backend validera l'authentification Basic de l'élève et vérifiera si l'accès global "Délégué pour tous" est activé pour l'établissement ou si le compte individuel de l'élève est marqué comme délégué.
>
> **3. Exclusivité des données affichées (Retrait Eco-BarRace / Terre-momètre)**  
> Afin de ne présenter que des fonctionnalités entièrement opérationnelles et prêtes, la vue Délégué dans le jeu n'affichera **pas** les modules *Eco-BarRace* et *Terre-momètre* pour le moment. L'interface se concentrera sur les 5 indicateurs clés d'impact global et le tableau de suivi des actions individuelles par semaine.
>
> **4. Calculs déportés côté serveur (Backend)**  
> Pour garantir des performances de chargement optimales et ne pas surcharger le client de jeu React de l'élève, tous les calculs d'impact (agrégations des actions, gains de CO2, eau, déchets et calcul du jour de dépassement) sont entièrement exécutés par le serveur backend (NestJS) et retournés sous forme de résultats pré-calculés prêts à l'affichage.

---

## Open Questions

> [!NOTE]
> Aucun point bloquant à ce stade. Des questions esthétiques pourront être affinées lors de la conception des écrans finaux (style des graphiques en SVG bois/ciel).

---

## Proposed Changes

### 1. Base de données (Prisma)

#### [MODIFY] [schema.prisma](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/backend-v2/prisma/schema.prisma)
- Ajouter le champ `isDelegate` dans le modèle `Child` :
  ```prisma
  model Child {
    id          Int          @id @default(autoincrement())
    pseudo      String
    password    String?
    groupId     Int
    avatar      String?
    isDelegate  Boolean      @default(false)
    actionsDone ActionDone[]
    group       Group        @relation(fields: [groupId], references: [id])

    @@unique([pseudo, groupId])
  }
  ```
- Ajouter le champ `allowAllDelegate` dans le modèle `InstanceYear` :
  ```prisma
  model InstanceYear {
    id               Int       @id @default(autoincrement())
    instanceId       Int
    schoolYear       String
    hostUrl          String?
    icon             String?
    isOpen           Boolean   @default(false)
    allowAllDelegate Boolean   @default(false) // <-- Nouveau champ pour l'option globale
    // ... reste des relations
  }
  ```

---

### 2. Backend (backend-v2 - NestJS)

#### [MODIFY] [tracking.module.ts](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/backend-v2/src/modules/tracking/tracking.module.ts)
- Exporter le service `TrackingService` afin de pouvoir l'injecter dans le module legacy :
  ```typescript
  exports: [TrackingService]
  ```

#### [MODIFY] [legacy-api.module.ts](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/backend-v2/src/modules/legacy-api/legacy-api.module.ts)
- Importer le module `TrackingModule` pour permettre l'injection de `TrackingService`.

#### [MODIFY] [legacy-api.service.ts](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/backend-v2/src/modules/legacy-api/legacy-api.service.ts)
- Injecter les services `ImpactService` et `TrackingService` dans le constructeur.
- Implémenter une méthode utilitaire `getChildFromAuth(authHeader: string)` pour authentifier l'élève à partir de l'en-tête Basic Auth et retourner son objet `Child` complet.
- Mettre à jour `checkAuthChild` et `getChildById` pour renvoyer le booléen `isDelegate` à l'interface de connexion du jeu, ainsi que l'état global `allowAllDelegate` de l'école.
- Ajouter la méthode `getDelegateImpact(authHeader: string)` :
  - Vérifie les droits délégués du joueur (soit individuellement, soit globalement pour l'école via `allowAllDelegate`).
  - Calcule et retourne l'impact de l'établissement associé via `ImpactService.calculateImpact(schoolYear, instanceId)`.
- Ajouter la méthode `getDelegateTracking(authHeader: string)` :
  - Vérifie les droits délégués du joueur.
  - Retourne les statistiques de suivi de l'établissement via `TrackingService.getTrackingStats(instanceId, schoolYear)`.

#### [MODIFY] [legacy-api.controller.ts](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/backend-v2/src/modules/legacy-api/legacy-api.controller.ts)
- Exposer deux nouveaux endpoints :
  - `GET /legacy/delegate/impact` : Retourne les résultats d'impact global pour l'école du délégué.
  - `GET /legacy/delegate/tracking` : Retourne la matrice de suivi des actions pour l'école du délégué.

#### [MODIFY] [team.service.ts](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/backend-v2/src/modules/team/team.service.ts)
- Mettre à jour `createChild` et `updateChild` pour prendre en charge le paramètre optionnel `isDelegate` dans les requêtes de création et modification.

#### [MODIFY] [team.controller.ts](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/backend-v2/src/modules/team/team.controller.ts)
- Permettre à l'API de recevoir `isDelegate` lors de la création d'un joueur (`POST /teams/children`) ou de sa modification (`PATCH /teams/children/:id`).

#### [MODIFY] [instance.service.ts](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/backend-v2/src/modules/instance/instance.service.ts)
- Dans la méthode `update()`, prendre en charge le champ `allowAllDelegate` pour modifier l'autorisation globale d'accès délégué au niveau de l'établissement pour l'année scolaire concernée.

---

### 3. Interface d'Administration (admin-sosplanete-v2)

#### [MODIFY] [page.tsx](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/admin-sosplanete-v2/src/app/dashboard/organization/page.tsx)
- **Au niveau de l'onglet configuration des équipes** :
  - Ajouter un bouton toggle global **"Délégué pour tous"** à côté du bouton d'import CSV dans la barre de contrôle.
  - Sauvegarder cet état en appelant `PATCH /instances/${instanceId}` avec le corps `{ allowAllDelegate: true/false, schoolYear }`.
- **Raccordement du modal d'édition individuel** :
  - Transmettre `isDelegate: selectedPlayer?.isDelegate` dans les données initiales de `<EditPlayerModal />`.
  - Mettre à jour `handleSavePlayer` pour inclure `isDelegate` dans le corps envoyé aux API backend.

#### [MODIFY] [EditPlayerModal.tsx](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/admin-sosplanete-v2/src/components/organization/EditPlayerModal.tsx)
- Ajouter la propriété `isDelegate` aux interfaces `EditPlayerModalProps` (dans `initialData` et `onSave`).
- Ajouter un état React local `isDelegate` (booléen).
- Ajouter un composant de bascule (toggle Switch stylisé) dans le formulaire avec un libellé clair comme **"Délégué de l'espace"** accompagné d'une description.

---

### 4. Interface du Jeu (sosplanete-v1 - React)

#### [MODIFY] [AuthContext.jsx](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/sosplanete-v1/src/utils/AuthContext.jsx)
- Exposer l'information `isDelegate` (calculée comme `childInfos?.isDelegate || school?.allowAllDelegate`) dans le contexte global d'authentification.

#### [MODIFY] [NavBar.jsx](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/sosplanete-v1/src/components/NavBar.jsx)
- Si l'élève connecté possède l'autorisation déléguée (individuelle ou globale), insérer à droite du bouton **Jeux** :
  1. Un séparateur vertical (`<div className="navbar-separator-vertical" />`).
  2. Un bouton **Délégué** redirigeant vers la route `/delegue` avec une icône de tableau de bord.

#### [MODIFY] [NavBar.css](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/sosplanete-v1/src/components/NavBar.css)
- Styliser le séparateur vertical (un trait gris léger de 40px de hauteur, centré verticalement) avec une adaptation sur mobile (24px de hauteur).

#### [MODIFY] [App.jsx](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/sosplanete-v1/src/App.jsx)
- Importer la nouvelle page `Delegue`.
- Déclarer la route sécurisée `<Route path="/delegue" element={<Delegue />} />` dans le `PrivateRoutes` du routeur React.

#### [NEW] [Delegue.jsx](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/sosplanete-v1/src/pages/Delegue/Delegue.jsx)
- Créer le composant de la page déléguée :
  - Intégrer l'en-tête de page standard (`Header`) avec le titre "Espace Délégué" et une icône correspondante.
  - Implémenter deux onglets de navigation : **Impact Global** et **Suivi des Actions**.
  - Charger dynamiquement les données depuis le backend en appelant `NnauruAPI.get(user, "/delegate/impact")` et `NnauruAPI.get(user, "/delegate/tracking")`.

#### [NEW] [Delegue.css](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/sosplanete-v1/src/pages/Delegue/Delegue.css)
- Fichier de styles pour harmoniser l'affichage avec la charte graphique du jeu (styles bois/nature combinés à la rigueur structurelle de l'admin).

#### [NEW] [IndicatorsView.jsx](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/sosplanete-v1/src/pages/Delegue/IndicatorsView.jsx)
- Composant pour l'onglet **Impact Global** :
  - Afficher les 5 indicateurs clés : *Impact Global (Planètes), Date de Dépassement, CO2 Évité, Eau Économisée, Déchets Évités*.
  - Utiliser la charte visuelle du jeu pour chaque carte d'indicateur.
  - Inclure des barres de progression en SVG/CSS natif pour présenter la part "Actionnable" (40%) vs "Incompressible" (60%).

#### [NEW] [TrackingMatrixView.jsx](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/sosplanete-v1/src/pages/Delegue/TrackingMatrixView.jsx)
- Composant pour l'onglet **Suivi des Actions** :
  - Rendre la matrice de suivi des actions.
  - Fournir des filtres pour filtrer par équipe, par groupe ou rechercher un élève par son pseudo.

---

## Verification Plan

### Tests Automatisés
- **Validation du schéma Prisma** : S'assurer que le modèle client se régénère sans erreur après l'ajout de `isDelegate` et `allowAllDelegate`.
- **Tests des routes Legacy** : Tester l'appel aux nouveaux endpoints legacy avec et sans authentification Basic, et avec un élève non-délégué.

### Validation Manuelle
1. Se connecter à l'administration en tant que référent.
2. Aller dans l'onglet **Configuration des équipes** de l'espace.
3. Modifier un joueur et cocher l'option **"Délégué de l'espace"**. Enregistrer.
4. Se connecter dans le jeu `sosplanete-v1` avec le compte de cet élève délégué.
5. Vérifier que la navbar affiche bien le séparateur et le bouton **Délégué** à droite de "Jeux".
6. Dans l'administration, activer le bouton toggle global **"Délégué pour tous"**.
7. Se connecter avec n'importe quel autre élève de l'école et s'assurer qu'il a désormais lui aussi accès au bouton et à l'espace Délégué.

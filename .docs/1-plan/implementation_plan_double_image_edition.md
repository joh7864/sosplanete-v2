# Implementation Plan - Double Visuel (SOS Planète / Évoé) & Édition des Actions/Missions

Permettre la distinction et la gestion de deux univers visuels pour chaque action/mission (**SOS Planète Legacy** pour le monde réel, et **Évoé SF** pour le monde futuriste), le remplacement complet de la terminologie **HP ➔ IT (Impulsions Temporelles)**, le calcul par défaut et la surcharge des points IT selon les métriques réelles (CO2e, Eau, Déchets), l'ajout du tri par **Niveau d'IT** pour Évoé, la préservation intégrale de la page « Configuration du catalogue » de Mon Établissement, et la préparation des scripts de déploiement en production (Docker Compose / Prisma Migrate).

---

## User Review & Validations Confirmées

> [!IMPORTANT]
> **Règles fondamentales validées :**
> 1. **Calcul des Points IT (Impulsions Temporelles) :**
>    - Par défaut, les points IT sont **calculés automatiquement** en fonction des indicateurs réels d'économie (**CO2e kg, Eau L, Déchets kg**) selon la formule de pondération d'impact.
>    - L'administrateur a la possibilité de **surcharger manuellement** cette valeur dans l'onglet Évoé pour attribuer un score de mission sur-mesure si désiré.
> 2. **Barre d'outils enrichie :**
>    - Maintien intégral de tous les outils existants (Recherche, Filtres, Tri par Étoiles/Catégorie/Impact, Liste/Cartes, Replier/Déplier, Import CSV).
>    - **Ajout pour Évoé :** Regroupement et tri **« Par niveau d'IT »** (tranches de points IT) pour classer les missions par amplitude énergétique.
>    - Commutateur de vue : Toggle **🌿 Vue SOS Planète / 🚀 Vue Évoé SF**.
> 3. **Terminologie unifiée IT :** Remplacement universel de `HP` par **`IT` (Points IT / Impulsions Temporelles)** dans tout le code, la base et l'interface.
> 4. **Protection de la page « Configuration du catalogue » de Mon Établissement :** Le composant `CatalogMapping.tsx` reste **100% intact et préservé**.
> 5. **Emplacements de stockage :**
>    - Images **SOS Planète** : `uploads/actions/`
>    - Images **Missions Évoé** : `uploads/missions/`
> 6. **Déploiement Production :** Migration Prisma SQL versionnée dans `prisma/migrations/` exécutable via `sudo docker compose exec backend npx prisma migrate deploy`.

---

## Proposed Changes

### Database & Modèle de Données (Prisma)

#### [MODIFY] [schema.prisma](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/backend-v2/prisma/schema.prisma)

- Ajouter `imageEvoe String?` sur le modèle `ActionRef` (visuel Évoé SF de référence).
- Ajouter `imageEvoe String?` sur le modèle `LocalAction` (surcharge locale du visuel Évoé).
- Ajouter `imageOverride String?` sur `EvoeMissionTranslation` (surcharge par mission).
- Renommer les champs de points dans `EvoeMissionTranslation` pour refléter les points IT (`pointsIT` / `pointsGagnes`).

```prisma
model ActionRef {
  id            Int           @id @default(autoincrement())
  code          String        @unique // ex: B01, C01, D01...
  referenceName String
  description   String?
  category      String?
  categoryRefId Int?
  
  // Visuels des 2 univers
  image         String?       // Image SOS Planète (dans uploads/actions/)
  imageEvoe     String?       // Image Évoé SF (dans uploads/missions/)
  
  // Indicateurs d'impact réels
  defaultCo2    Float?
  defaultWater  Float?
  defaultWaste  Float?
  defaultEnergy Float?
  weightedStars Int?
  
  localActions  LocalAction[]
  categoryRef   CategoryRef?  @relation(fields: [categoryRefId], references: [id])
}

model LocalAction {
  id             Int                     @id @default(autoincrement())
  label          String
  description    String?
  actionRefId    Int
  instanceId     Int
  categoryId     Int?
  
  // Surcharges locales de visuels
  image          String?                 // Surcharge locale SOS Planète
  imageEvoe      String?                 // Surcharge locale Évoé SF
  
  // Surcharges locales d'impact
  specificCo2    Float?
  specificWater  Float?
  specificWaste  Float?
  specificEnergy Float?
  
  actionRef      ActionRef               @relation(fields: [actionRefId], references: [id])
  evoeMission    EvoeMissionTranslation?
}

model EvoeMissionTranslation {
  id            Int         @id @default(autoincrement())
  localActionId Int         @unique
  titreSF       String
  descriptionSF String
  pointsGagnes  Int         // Points IT (Impulsions Temporelles)
  isHacked      Boolean     @default(false)
  imageOverride String?
  localAction   LocalAction @relation(fields: [localActionId], references: [id], onDelete: Cascade)
}
```

---

### Backend API (NestJS)

#### [MODIFY] [action-ref.controller.ts](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/backend-v2/src/modules/action-ref/action-ref.controller.ts) & [action-ref.service.ts](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/backend-v2/src/modules/action-ref/action-ref.service.ts)
- **`PATCH /action-ref/:id`** : Mise à jour complète du référentiel global :
  - Textes réels (`referenceName`, `description`, `category`)
  - Indicateurs d'impacts réels (`defaultCo2`, `defaultWater`, `defaultWaste`, `defaultEnergy`, `weightedStars`)
  - Visuels (`image` et `imageEvoe`).
- **`DELETE /action-ref/:id`** : Suppression d'une action du catalogue global.
- **`POST /action-ref/upload-image`** : Upload sécurisé vers `uploads/actions/` (SOS Planète) ou `uploads/missions/` (Évoé).

#### [MODIFY] [local-action.controller.ts](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/backend-v2/src/modules/local-action/local-action.controller.ts) & [local-action.service.ts](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/backend-v2/src/modules/local-action/local-action.service.ts)
- Étendre `PATCH /local-actions/:id` pour la mise à jour conjointe des surcharges locales SOS Planète et Évoé (`image`, `imageEvoe`, `titreSF`, `descriptionSF`, `pointsIT`).

#### [MODIFY] [evoe.service.ts](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/backend-v2/src/modules/stimulation/evoe/evoe.service.ts)
- Remplacement universel de `HP` par **`IT`** (Impulsions Temporelles).
- **Calcul par défaut des points IT** : calculé dynamiquement à partir de `(CO2e + Eau + Déchets)` ou formule d'impact, avec conservation de la surcharge manuelle si spécifiée.
- Résolution dynamique de l'image de mission :
  `image = localAction.imageEvoe || localAction.evoeMission?.imageOverride || actionRef.imageEvoe || localAction.image || actionRef.image || 'default-mission.png'`.

---

### Frontend Administration (Next.js / TailwindCSS)

#### [MODIFY] [types/index.ts](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/admin-sosplanete-v2/src/types/index.ts)
- Remplacement des types `hp` / `gainHP` par `pointsIT` / `it`.
- Ajout de `imageEvoe` aux interfaces `ActionRef`, `LocalAction`, `EvoeMissionTranslation`.

#### [NEW] [ActionRefEditModal.tsx](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/admin-sosplanete-v2/src/components/catalog/ActionRefEditModal.tsx)
- Popup d'édition unifiée du catalogue global (AS) :
  - **Onglet 🌿 SOS Planète** :
    - Titre réel, Description pédagogique, Catégorie
    - **Indicateurs d'impacts éditables** : CO2e (kg), Eau (L), Déchets (kg), Énergie (kWh), Étoiles pondérées (1 à 5 ★).
    - **Gestionnaire d'image SOS Planète** (Upload dans `uploads/actions/`, prévisualisation, sélection).
  - **Onglet 🚀 Évoé** :
    - Titre de mission SF, Secteur futuriste, Description narrative SF (Lore)
    - **Points IT (Impulsions Temporelles)** : Calculés automatiquement à partir des indicateurs réels avec affichage de la valeur calculée, et champ de saisie pour surcharger manuellement la valeur.
    - **Gestionnaire d'image Évoé** (Upload dans `uploads/missions/`, prévisualisation holographique, sélection).
  - **Aperçu interactif réactif** : Affichage dynamique de la carte correspondante selon l'onglet ouvert.

#### [MODIFY] [CatalogSection.tsx](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/admin-sosplanete-v2/src/components/settings/CatalogSection.tsx) & [GalleryGroup.tsx](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/admin-sosplanete-v2/src/components/catalog/GalleryGroup.tsx)
- **Barre d'outils complète préservée et enrichie :**
  - Maintien de la recherche textuelle
  - Maintien du tri et regroupement (par étoiles, par catégorie, par niveau d'impact)
  - **[NOUVEAU] Option de regroupement « Par niveau d'IT »** lorsque la vue Évoé est active (ex: *Missions 1-5 IT, 6-15 IT, 16-50 IT, 50+ IT*).
  - Maintien de la bascule d'affichage : Liste compacte / Cartes galerie
  - Maintien des boutons « Tout replier » / « Tout déplier »
  - Maintien de l'import CSV et des actions par lot
  - Commutateur de vue : Toggle *« 🌿 Vue SOS Planète »* / *« 🚀 Vue Évoé SF »*.
- **Interactions sur les cartes du catalogue global :**
  - **Clic sur la carte** ➔ Ouverture directe de `ActionRefEditModal`.
  - **Au survol (Hover)** :
    - Bouton `Settings2` (Éditer)
    - Bouton `Trash2` (Supprimer avec modal de confirmation).

#### [MODIFY] [LocalActionEditModal.tsx](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/admin-sosplanete-v2/src/components/catalog/LocalActionEditModal.tsx)
- Modal locale (AM) mise à niveau avec les 2 onglets (**🌿 SOS Planète** / **🚀 Évoé**) pour permettre la surcharge locale des visuels et des textes SF sans impacter le composant parent `CatalogMapping.tsx`.

---

### Production & Déploiement Docker

#### [NEW] [Migration Prisma & Procédure de Déploiement](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/backend-v2/prisma/migrations)
- Génération du dossier de migration SQL `prisma/migrations/<timestamp>_add_image_evoe_and_it/migration.sql`.
- Intégration dans le flux `sudo docker compose` pour mise à jour automatique sans coupure de service.

---

## Verification Plan

### Automated Tests
- Exécution de la suite de tests backend : `npm test` dans `apps/backend-v2`.
- Vérification de la compilation TypeScript : `npx tsc --noEmit` sur `apps/backend-v2` et `apps/admin-sosplanete-v2`.

### Manual Verification
1. **Édition Référentiel Global (AS)** :
   - Clic sur une carte (ex: `B01`).
   - Modifier les indicateurs CO2e, Eau, Déchets dans l'onglet SOS Planète et constater l'actualisation dynamique du calcul des points IT dans l'onglet Évoé.
   - Surcharger manuellement les points IT et vérifier la prise en compte.
2. **Barre d'outils & Tri par niveau d'IT** :
   - Basculer sur la *Vue Évoé SF*.
   - Sélectionner le regroupement *« Par niveau d'IT »* et vérifier le classement par tranche d'amplitude.
3. **Suppression de carte** :
   - Tester l'icône Corbeille au survol d'une carte avec confirmation.
4. **Vérification de « Mon Établissement »** :
   - Confirmer que la page de configuration du catalogue de l'établissement reste strictement inchangée et opérationnelle.
5. **Validation Docker / SQL** :
   - Vérifier la validité de la migration Prisma.

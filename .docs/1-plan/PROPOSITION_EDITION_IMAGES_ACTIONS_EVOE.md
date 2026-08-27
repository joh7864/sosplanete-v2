# 📝 Document de Cadrage & Spécification à Annoter
## Évolution Administration : Double Image (SOS Planète / Évoé) & Édition des Actions/Missions

> **Comment utiliser ce document :**  
> Vous pouvez directement modifier ou annoter ce fichier. Des encadrés **`[VOTRE ANNOTATION]`** et des cases à cocher `[ ]` ont été insérés pour recueillir vos retours, choix techniques ou préférences d'interface.

---

## 🎯 1. Objectifs & Périmètre

1. **Double Visuel par Action/Mission :**
   - **Univers 1 (SOS Planète - Legacy / Réel) :** Image pédagogique, concrète et illustrant l'éco-geste dans la vie quotidienne (ex: `B01.png`, photos réelles, illustrations douces).
   - **Univers 2 (Évoé - Futuriste / SF) :** Image stylisée, science-fiction / cyberpunk / spatial représentant la mission sur l'Arche spatiale (ex: `B01_evoe.png`, holo-badges, illustrations futuristes).
2. **Édition Complète dans l'Administration :**
   - Modifier les textes réels (nom, description, catégorie, impacts CO2/Eau/Déchets).
   - Modifier les textes SF Évoé (titre de mission, description narrative, gain HP/amplitude).
   - Changer, téléverser ou réaffecter les deux images (SOS Planète et/ou Évoé) avec prévisualisation immédiate.

---

## 🗄️ 2. Modèle de Données & Base de Données (Prisma)

### A. Proposition de Schéma

```prisma
// --- Référentiel Global (Niveau AS) ---
model ActionRef {
  id            Int           @id @default(autoincrement())
  code          String        @unique // ex: B01, C01, D01, E01, T01, W01...
  referenceName String
  description   String?
  category      String?
  categoryRefId Int?
  
  // Visuels
  image         String?       // Image SOS Planète Legacy (ex: "actions/B01.png")
  imageEvoe     String?       // [NOUVEAU] Image Évoé SF (ex: "missions-evoe/B01_evoe.png")
  
  // Impacts réels
  defaultCo2    Float?
  defaultWater  Float?
  defaultWaste  Float?
  defaultEnergy Float?
  weightedStars Int?
  
  // Relations
  localActions  LocalAction[]
  categoryRef   CategoryRef?  @relation(fields: [categoryRefId], references: [id])
}

// --- Action Locale par Instance / Établissement (Niveau AM) ---
model LocalAction {
  id             Int                     @id @default(autoincrement())
  label          String
  description    String?
  actionRefId    Int
  instanceId     Int
  categoryId     Int?
  
  // Surcharges locales de visuels (optionnel si l'établissement veut ses propres images)
  image          String?                 // Surcharge locale image SOS Planète
  imageEvoe      String?                 // [NOUVEAU] Surcharge locale image Évoé
  
  // Surcharges locales d'impact
  specificCo2    Float?
  specificWater  Float?
  specificWaste  Float?
  specificEnergy Float?
  
  // Relations
  actionRef      ActionRef               @relation(fields: [actionRefId], references: [id])
  evoeMission    EvoeMissionTranslation? // Textes narratifs SF associés
  // ...
}

// --- Traduction Narrative SF Évoé ---
model EvoeMissionTranslation {
  id            Int         @id @default(autoincrement())
  localActionId Int         @unique
  titreSF       String      // Titre de la mission dans l'Arche
  descriptionSF String      // Lore narratif / briefing SF
  pointsGagnes  Int         // Points HP / IT
  isHacked      Boolean     @default(false)
  imageOverride String?     // [OPTIONNEL] Surcharge visuel spécifique à la mission
  localAction   LocalAction @relation(fields: [localActionId], references: [id], onDelete: Cascade)
}
```

---

### ✍️ [VOTRE ANNOTATION - MODÈLE DE DONNÉES]
> **Vos retours sur la structure en base :**
> - [ ] Validé tel quel
> - [ ] Préférer stocker `imageEvoe` uniquement dans `EvoeMissionTranslation`
> - [ ] Autre remarque :
> 
> *Notes libres :*  
> `...`

---

## ⚙️ 3. Backend & API (NestJS)

### A. Nouveaux Endpoints & Évolutions

1. **`PATCH /action-ref/:id` (Réservé AS - Global)**
   - Permet de mettre à jour le nom de référence, les impacts, les textes, ainsi que `image` et `imageEvoe`.
2. **`PATCH /local-actions/:id` (Accessible AM & AS)**
   - Permet de mettre à jour les labels locaux, la catégorie, les surcharges d'impact, les surcharges d'images (`image`, `imageEvoe`), et synchronise les champs SF de `EvoeMissionTranslation` (`titreSF`, `descriptionSF`, `pointsGagnes`).
3. **`POST /uploads/actions` & `POST /uploads/missions-evoe`**
   - Upload sécurisé de fichiers images (formats acceptés : WebP, PNG, JPG).
   - Génération de vignettes ou redimensionnement optimisé si nécessaire.
4. **Fallback & Résolution intelligente (`evoe.service.ts`) :**
   ```ts
   // Résolution de l'image Évoé servie au jeu :
   const missionImage = 
     localAction.imageEvoe || 
     localAction.evoeMission?.imageOverride ||
     localAction.actionRef.imageEvoe || 
     localAction.image || 
     localAction.actionRef.image || 
     'default-mission.png';
   ```

---

### ✍️ [VOTRE ANNOTATION - BACKEND & API]
> **Vos remarques sur les règles API :**
> - [ ] Validé
> - [ ] Remarques sur les formats d'images ou le stockage :
> 
> *Notes libres :*  
> `...`

---

## 🖥️ 4. Interface Utilisateur & Expérience d'Édition (Next.js Admin)

### A. Modal d'Édition Unifiée (Action Réelle + Mission Évoé)

Lors du clic sur le bouton **"Modifier"** d'une carte d'action :

```text
+------------------------------------------------------------------------------------+
| 🛠️ MODIFIER L'ACTION & LA MISSION (Réf: B01)                                    [X] |
+------------------------------------------------------------------------------------+
|  [ Onglet 🌿 SOS Planète (Réel) ]     [ Onglet 🚀 Évoé (Futuriste / SF) ]          |
|------------------------------------------------------------------------------------|
|  (Onglet 1 actif - SOS Planète)                                                   |
|                                                                                    |
|  Titre de l'action :                                                               |
|  [ Ne pas arracher les plantes                                                   ] |
|                                                                                    |
|  Catégorie : [ Biodiversité ▼ ]         Impact étoiles : [ ★ ★ ★ ★ ☆ ]             |
|                                                                                    |
|  Description pédagogique :                                                         |
|  [ Les fleurs sont butinées par les abeilles et les abeilles sont très utiles... ] |
|                                                                                    |
|  --- VISUEL SOS PLANÈTE (LEGACY) ---                                              |
|  +------------------------+   Boutons :                                            |
|  |                        |   [ 📁 Choisir dans la bibliothèque ]                 |
|  |     [ Aperçu Image     |   [ ⬆️ Téléverser une nouvelle image ]                 |
|  |       SOS Planète ]    |   [ 🔄 Réinitialiser par défaut ]                     |
|  +------------------------+   Fichier actuel : B01.png                             |
|                                                                                    |
|------------------------------------------------------------------------------------|
|  (Onglet 2 - Évoé)                                                                |
|                                                                                    |
|  Titre de Mission SF :                                                             |
|  [ Mission : Préservation du Code Génétique Originel                             ] |
|                                                                                    |
|  Secteur futuriste : [ Biosphère & Faune ▼ ]     Points HP / IT : [ 10 HP ]        |
|                                                                                    |
|  Description narrative SF (Lore) :                                                 |
|  [ Les bio-ingénieurs de l'Arche détectent une perturbation dans le flux...      ] |
|                                                                                    |
|  --- VISUEL ÉVOÉ (SF / FUTURISTE) ---                                             |
|  +------------------------+   Boutons :                                            |
|  |                        |   [ 📁 Choisir dans la bibliothèque Évoé ]             |
|  |     [ Aperçu Hologramme|   [ ⬆️ Téléverser une nouvelle image SF ]              |
|  |       Évoé SF ]        |   [ 🔄 Réinitialiser par défaut ]                     |
|  +------------------------+   Fichier actuel : B01_evoe.png                        |
|                                                                                    |
+------------------------------------------------------------------------------------+
|  [ Annuler ]                                            [ 💾 Enregistrer les 2 ]  |
+------------------------------------------------------------------------------------+
```

### B. Affichage dans la Galerie & Catalogue (Vue Toggle)

Dans la page Catalogue (`/dashboard/catalog` et `CatalogSection`) :
- Ajout d'un sélecteur de mode d'affichage :
  - 🔘 **Mode "SOS Planète (Réel)"** : Cartes avec bordures pastel, badges catégories réelles, icônes d'impacts et image SOS Planète.
  - 🔘 **Mode "Évoé (SF)"** : Cartes style holographique / sombre, badges secteurs futuristes, points HP et image Évoé SF.
  - 🔘 **Mode "Comparatif Côte à Côte"** (optionnel).

---

### ✍️ [VOTRE ANNOTATION - INTERFACE UTILISATEUR]
> **Préférences d'ergonomie :**
> - [ ] Organisation par Onglets (SOS Planète / Évoé)
> - [ ] Organisation sur une seule page avec 2 colonnes (Gauche: SOS Planète, Droite: Évoé)
> - [ ] Ajouter un aperçu en direct des deux cartes de jeu pendant la frappe
> 
> *Notes libres :*  
> `...`

---

## 📦 5. État des Lieux des 92 Missions & Assignation des Images

| Plage d'actions | Origine | Nombre | Image SOS Planète | Image Évoé |
| :--- | :--- | :---: | :--- | :--- |
| **Lignes 1 à 31** | Actions historiques des écoles (Neyron/Balan/Bron) | 31 | Assignées aux codes `T03`, `C01`, `D01`... | Prêtes à recevoir leur visuel SF dédié |
| **Lignes 32 à 92** | Référentiel standard V3 complet (B01..W07) | 61 | Déjà associées aux codes `B01.png`, etc. | Prêtes à recevoir leur visuel SF dédié |
| **Total** | **Catalogue Commun Évoé** | **92** | **100% mappées** | **À initialiser / personnaliser** |

---

### ✍️ [VOTRE ANNOTATION - GESTION DES FICHIERS IMAGES]
> **Emplacement des dossiers d'images souhaité :**
> - Images SOS Planète : `apps/admin-sosplanete-v2/public/assets/actions/`
> - Images Évoé : `apps/admin-sosplanete-v2/public/assets/missions-evoe/`
> 
> *Notes libres :*  
> `...`

---

## 🚀 6. Prochaines Étapes après Validation

1. **Étape 1 :** Mise à jour du schéma Prisma & migration base de données.
2. **Étape 2 :** Implémentation des contrôleurs / services backend (endpoints PATCH + upload).
3. **Étape 3 :** Création du composant modal d'édition complète avec double sélecteur d'image.
4. **Étape 4 :** Ajout du commutateur de vue (SOS Planète / Évoé) dans le catalogue admin.
5. **Étape 5 :** Tests et validation de l'édition sur des actions réelles et missions Évoé.

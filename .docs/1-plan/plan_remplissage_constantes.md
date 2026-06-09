# Plan d'implémentation — Auto-remplissage des Constantes Mondiales via l'API Gemini

Ce plan détaille les modifications techniques pour intégrer un bouton d'auto-remplissage intelligent dans l'onglet **Constantes d'Impact Mondiales** de la page des paramètres d'administration. Ce bouton utilisera l'API Gemini avec la fonctionnalité de recherche web (Search Grounding) pour collecter, convertir et proposer les constantes mondiales d'une année donnée.

---

## Descriptif du flux de fonctionnement

1. **Déclenchement** : L'administrateur clique sur un bouton **"Auto-remplir via IA/Recherche"** à côté des entrées manuelles.
2. **Requête API** : Le frontend envoie l'année civile ciblée au serveur backend (ex: `2025` pour l'année scolaire `2025-2026`).
3. **Recherche & Extraction IA** : Le backend NestJS interroge le modèle `gemini-1.5-flash` en activant l'outil `googleSearch` pour obtenir les statistiques d'Overshoot Day, population et empreintes par habitant de cette année.
4. **Calculs** : Le serveur convertit la date d'Overshoot Day en numéro de jour de l'année (ex: *1er août* $\rightarrow$ `213`).
5. **Prévisualisation** : Le serveur renvoie un aperçu des chiffres ainsi que les URLs des sources trouvées pour validation humaine.
6. **Validation** : L'administrateur valide (et corrige si besoin) les chiffres directement pré-remplis dans le formulaire avant d'enregistrer.

---

## Modifications Proposées

### 1. Backend-v2 (NestJS & API Gemini)

#### [NEW] [gemini.service.ts](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/backend-v2/src/modules/impact/gemini.service.ts)
- Créer un nouveau service pour encapsuler les appels au SDK `@google/generative-ai`.
- Lire la clé API à partir de `process.env.GEMINI_API_KEY`.
- Configurer l'initialisation du modèle `gemini-1.5-flash` avec l'outil de recherche activé (`googleSearch`).
- Définir le prompt système et la structure JSON de retour attendue :
  ```json
  {
    "overshootDayDate": "YYYY-MM-DD",
    "globalCarbonFootprint": 4.7,
    "globalWaterFootprintLiters": 1385000,
    "globalWasteFootprintKg": 270,
    "worldPopulationBillions": 8.1,
    "sources": ["https://..."]
  }
  ```

#### [MODIFY] [impact.controller.ts](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/backend-v2/src/modules/impact/impact.controller.ts)
- Ajouter une nouvelle route POST sécurisée : `POST /impact/constants/auto-fetch`.
- Cette route nécessitera les rôles `AS` (Administrateur Référentiel) et l'utilisation de `JwtAuthGuard`.

#### [MODIFY] [impact.service.ts](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/backend-v2/src/modules/impact/impact.service.ts)
- Ajouter la méthode `fetchAnnualConstantsWithAI(schoolYear: string)` :
  - Déterminer l'année civile de référence.
  - Appeler `GeminiService` pour obtenir les statistiques de recherche.
  - Analyser la date `overshootDayDate` pour calculer la valeur numérique `dActuel` (numéro du jour entre 1 et 366).
  - Retourner les constantes formatées et les URLs des sources.

---

### 2. Frontend (Dashboard Administrateur)

#### [MODIFY] [GlobalDataSettings.tsx](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/admin-sosplanete-v2/src/components/settings/GlobalDataSettings.tsx)
- Ajouter un bouton **"Auto-remplir via IA/Recherche"** (avec icône ✨) à côté des instructions ou au-dessus du formulaire.
- Ajouter un état local pour gérer le chargement de la recherche et les éventuels messages d'erreur.
- Gérer l'intégration : au retour de l'appel backend, pré-remplir l'état `constants` du formulaire avec les valeurs suggérées et afficher un toast ou badge indiquant que les données ont été importées temporairement, permettant à l'utilisateur de les réviser avant d'enregistrer.
- Afficher les liens des sources trouvées en bas du formulaire pour vérification.

---

## Plan de Validation

### Tests Automatisés
- Écrire un test d'intégration local pour vérifier le parsing de la date d'Overshoot Day et la conversion en `dActuel`.
- Tester la robustesse si la clé `GEMINI_API_KEY` est absente (le backend doit renvoyer une erreur explicite sans planter).

### Vérification Manuelle
1. Cliquer sur le bouton "Auto-remplir" pour l'année 2025.
2. S'assurer que les champs se remplissent automatiquement (ex: jour de dépassement, population, etc.).
3. Vérifier la pertinence des sources URL proposées en bas.
4. Enregistrer et vérifier que les valeurs persistent correctement en base de données.

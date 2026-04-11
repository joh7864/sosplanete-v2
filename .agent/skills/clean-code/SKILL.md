---
name: clean-code
description: Standards de développement stricts pour Next.js 16+ (TypeScript, React, Architecture).
---

# Clean Code Standards - Next.js 16+

## 🎯 Philosophie "Zero Defaut"
* **Build :** Interdiction stricte de commiter si le build échoue.
* **Lint :** Zéro warning ESLint toléré.
* **Types :** TypeScript strict (mode paranoïaque).

## 1. TypeScript Strict
* **Interdiction absolue** du type `any`. Utiliser `unknown` avec type guards si nécessaire.
* **Interdiction** de `@ts-ignore`. Utiliser `@ts-expect-error` avec une justification en commentaire si indispensable.
* **Typage explicite** des props (`interface Props { ... }`) et des retours de fonctions.
* Utiliser **Zod** pour valider toutes les données externes (API, SearchParams, Forms).

## 2. Composants React (Server & Client)
* **Server Components par défaut**. Ajouter `'use client'` uniquement si besoin de :
    * State (`useState`, `useReducer`)
    * Effects (`useEffect`)
    * Listeners navigateur (`onClick`, `onChange`)
* **Atomicité :** 1 composant = 1 responsabilité. S'il dépasse 100 lignes, découper.
* **Nommage :** PascalCase pour les composants (`UserProfile.tsx`), camelCase pour les fonctions/variables.
* **Pas de logique métier dans l'UI.** Extraire dans des hooks (`useLeadActions`) ou des services (`lead-service.ts`).
* **- Pas de redondance: Réutiliser hooks/utils existants, factoriser avant de créer du nouveau.
- Imports: Groupés (React/third-party/local), absolute paths avec @/ alias.
- **Pilotage & Prédictibilité :** Respecter STRICTEMENT le skill `velocity-tracking`. Toute nouvelle tâche doit être estimée en SP et son temps de réalisation prédit sur la base de la vélocité établie (7.0 SP/h).
- Sécurité/Perf: Valider inputs (Zod), Server Actions sécurisées, pas de mutations directes en client.

## 3. Data Fetching & Mutations
* **Server Actions** privilégiées pour les mutations (POST/PUT/DELETE).
* **Fetch** natif étendu dans les Server Components (pas de useEffect pour fetcher).
* **Validation Zod** obligatoire pour toute donnée entrante dans une Server Action.

## 4. Gestion d'Erreurs
* **Jamais de `console.log`** en production. Utiliser un logger structuré.
* Utiliser `error.tsx` pour les frontières d'erreurs UI.
* Wrapper les appels risqués dans des blocs `try/catch` avec typage de l'erreur.

## 5. Performance & Web Vitals
* Optimiser les images avec `<Image />` et `priority` pour le LCP.
* Code splitting automatique via les imports dynamiques si composant lourd.
* Éviter le *Prop Drilling* excessif -> Composition ou Context (avec parcimonie).

## 6. Structure des Fichiers
* `app/` : Routes et pages (Page Router interdit).
* `[feature]/` : Feature.
    * `_components_/` : Composants métier spécifique à la feature (LeadForm, PipelineList).
* `components/` : UI réutilisable.
    * `ui/` : Primitives design system (Boutons, Cards).
* `lib/` : Logique pure, utilitaires, schémas Zod, accès DB.
* `hooks/` : Hooks réutilisables.
* `services/` : Services métier.
* `utils/` : Utilitaires.

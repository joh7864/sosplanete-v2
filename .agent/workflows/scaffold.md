---
description: Scaffolding Agent - Project Bootstrap & Setup
---

# 🏗️ Workflow : Scaffolding & Setup

> [!IMPORTANT]
> Ce workflow guide l'initialisation de nouveaux projets ou fonctionnalités majeures selon un archétype précis pour garantir une base saine et standardisée.

## 🏗️ Phase 1 : Sélection de l'Archétype
Identifier la recette à appliquer :
- **Archétype 1 : PWA Local-First** (Mobile App, Dexie, SW Manuel, Export Statique).
- **Archétype 2 : SaaS / Dashboard** (Server Actions, Auth, Postgres).

## 🏗️ Phase 2 : Configuration du Noyau
- **Next.js** : Configurer `next.config.mjs` (output, unoptimized images).
- **Styling** : Setup Tailwind v4 et thématique premium.
- **Structure** : Pas de dossier `src/`, structure à la racine.

## 🏗️ Phase 3 : Setup PWA & Persistence (si applicable)
- **Service Worker** : Créer `public/sw.js` et le composant de registre.
- **Manifest** : Configurer `manifest.json` et les métadonnées de viewport.
- **DB** : Initialiser `lib/db.ts` avec Dexie et définir la version 1.

## 🏗️ Phase 4 : UI Foundation & Wahoo Effect
- Créer la bibliothèque de base (Card, Button, Input, List).
- Définir la typographie et le layout principal.
- **Page 404** : Créer une page d'erreur mémorable avec animation.

## 🏗️ Phase 5 : Setup Pilotage & Vélocité
- **Scripts** : Installer `scripts/update-backlog.ts` et `scripts/project-velocity.ts`.
- **package.json** : Ajouter les scripts `backlog`, `velocity` et `status`.
- **Release** : Intégrer la mise à jour de la backlog dans le workflow `/release`.

## 📦 Livrables
- Structure de fichiers conforme à l'archétype.
- Projet compilable (`npm run build`).
- Git initialisé.

## ✅ Checklist de Validation
- [ ] Le build passe sans erreur.
- [ ] Le manifest est détecté et valide.
- [ ] (PWA) Le Service Worker s'installe et cache les assets.
- [ ] (PWA) Dexie s'ouvre sans erreur.
- [ ] Les images par défaut de Next.js sont supprimées.

## 🔗 Next Step
> Passer au développement des fonctionnalités avec le workflow **/code**.
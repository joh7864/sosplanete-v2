---
name: pwa-static
description: Architecture "Local-First" et configuration PWA optimisée pour Next.js en mode Export Statique.
---

# PWA Static Export & Local-First

> [!TIP]
> **Nouveau Projet ?**
> Utilisez le workflow `/scaffold` pour générer la configuration initiale (Next.js config, Manifest, PWA Manuelle) automatiquement.

## 🎯 Philosophie
* **Zero Server :** L'application doit fonctionner sans runtime Node.js (hébergement CDN simple).
* **Offline First :** L'utilisateur ne doit jamais voir de "Page blanche" hors connexion.
* **Instant Load :** Le Shell de l'application (HTML/CSS/JS critique) doit charger < 1s.
* **Build Stability** : Utilisation d'une stratégie **Manuelle** pour éviter les conflits Webpack/Turbopack.

## 1. Contraintes Techniques (Next.js Export)
* ❌ **Pas de `next/image` dynamique :** Utiliser `unoptimized: true` ou un loader externe (Cloudinary, Imgix) si nécessaire.
* ❌ **Pas d'API Routes (`/api/*`) :** Tout le backend doit être soit :
    * Build-time (getStaticProps/generateStaticParams).
    * Client-side (fetch vers API externe).
    * Local (IndexedDB).
* ❌ **Pas de `headers()`, `cookies()` server-side :** La gestion de session se fait 100% côté client (JWT dans localStorage/IndexedDB).
* ❌ **Pas de Plugins de Build PWA (`next-pwa`, `serwist`)** : Trop instables avec Turbopack/Next 15+.

## 2. Architecture de Données (Local-First)
Utiliser **IndexedDB** comme source de vérité unique pour l'UI.
1.  **Read :** L'UI lit depuis IndexedDB (via `useLiveQuery` de Dexie ou TanStack Query `networkMode: 'offlineFirst'`).
2.  **Write :** L'utilisateur écrit dans IndexedDB.
3.  **Sync :** Un processus d'arrière-plan (Service Worker ou Hook) synchronise IndexedDB avec l'API quand le réseau est disponible.

## 3. Configuration Manuelle (Service Worker)
Créer un fichier `public/sw.js` natif pour contrôler le cache sans dépendance de build.

### Strategie de Caching Recommandée
* **Precache** : `/`, `index.html`, `manifest.json`, icônes (dans `install` event).
* **Assets (JS/CSS/Images)** : Stale-While-Revalidate (via `fetch` event).
* **Data (API)** : Network-First (ne pas cacher agressivement les données dynamiques).

```javascript
// public/sw.js
const CACHE_NAME = 'app-cache-v1';

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(['/', '/manifest.json'])));
  self.skipWaiting();
});

self.addEventListener('fetch', (event) => {
  // Implémenter Stale-While-Revalidate ici
});
```

### Enregistrement Client
Créer un composant `<RegisterSW />` (Client Component) à insérer dans le `layout.tsx`.

```tsx
'use client';
import { useEffect } from 'react';

export function RegisterSW() {
  useEffect(() => {
    if ('serviceWorker' in navigator && window.location.protocol === 'https:') {
      navigator.serviceWorker.register('/sw.js');
    }
  }, []);
  return null;
}
```

## 4. UX Hors Connexion
* **Indicateurs :** Afficher un toast/badge discret "Mode hors ligne".
* **Formulaires :** Désactiver le bouton "Envoyer" SI l'action requiert impérativement le serveur, SINON permettre l'ajout en file d'attente (Queue).
* **Images :** Prévoir des placeholders CSS (squelettes colorés) si l'image n'est pas en cache.

## 5. Déploiement & Assets
* **Trailing Slash :** Configurer `trailingSlash: true` dans `next.config.ts` pour compatibilité S3/Static hosting.
* **Manifest :** Fichier statique `public/manifest.json`.

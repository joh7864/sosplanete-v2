---
name: nextjs-app-router
description: Architecture technique et performance pour Next.js App Router (Server Components, Actions).
---

# Next.js App Router Standards

## 🏛️ Architecture Technique
* **Server-Centric** : Déplacer un maximum de logique sur le serveur.
    * ✅ Accès DB direct.
    * ✅ Validation de données sensible.
    * ✅ Génération de HTML statique.
* **Client Islands** : Utiliser `'use client'` uniquement aux feuilles de l'arbre de composants (là où l'interaction se trouve).
* **Streaming** : Utiliser `<Suspense />` pour les parties lentes de l'UI (ex: liste de données lourde) afin d'afficher le layout immédiatement.

> [!WARNING]
> **CONTEXTE PWA LOCAL-FIRST** :
> Dans ce projet, la **Base de Données est LOCALE (IndexedDB)**.
> * Ne **PAS** utiliser de Server Actions pour lire/écrire des données métiers (Courses, Rounds, etc.).
> * Utiliser le skill `local-first-db` (Dexie) à la place.
> * Les Server Actions restent valides pour des tâches purement serveur (envoyer un email, revalider le cache ISR pour des pages publiques).

## ⚡ Server Actions
* **Mutations** : Remplacer les API Routes (`/api/*`) par des Server Actions pour les formulaires et interactions.
* **Sécurité** : Toujours valider les inputs avec Zod dans l'Action.
* **Feedback** : Retourner des objets `{ success: boolean, error?: string }` ou utiliser `useFormState`.

## 📂 Gestion des Routes (`app/`)
* **Layouts** : Utiliser `layout.tsx` pour envelopper des sections communes (Nav, Sidebar).
* **Loading** : Créer `loading.tsx` pour les états de chargement automatiques (Skeleton).
* **Error** : Créer `error.tsx` pour catcher les erreurs inattendues proprement.
* **Not Found** : `not-found.tsx` personnalisé.

## 🚀 Performance (Core Web Vitals)
* **LCP (Largest Contentful Paint)** :
    * Optimiser l'image principale (`priority`).
    * Server Components pour le rendu initial rapide.
* **CLS (Cumulative Layout Shift)** :
    * Dimensions fixes sur les images/vidéos.
    * Skeletons de taille fixe pendant le chargement.
* **INP (Interaction to Next Paint)** :
    * Réduire le JS client.
    * startTransition pour les mises à jour d'état lourdes.

## 📦 Dépendances
* **Packages** : Privilégier les libs "edge-compatible" ou légères.
* **Bundle Analysis** : Surveiller la taille du bundle client (`@next/bundle-analyzer` si besoin).

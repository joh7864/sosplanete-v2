---
name: accessibility
description: Guide pour rendre l'application accessible à tous (WCAG, Clavier, Lecteurs d'écran).
---

# Accessibility Standards (a11y)

## 🎯 Philosophie
* **Pour tous :** Une app accessible est une meilleure app pour tout le monde (SEO, Assistants vocaux, Power users).
* **Sémantique :** Utiliser les bons tags HTML (`<button>`, `<nav>`, `<main>`) avant de penser ARIA.
* **Clavier :** Tout doit être navigable sans souris.

## 1. Structure & Sémantique
* Utiliser les landmarks : `<header>`, `<main>`, `<footer>`, `<nav>`, `<aside>`.
* Titres hiérarchiques : Un seul `<h1>` par page, pas de saut de niveau (`h2` -> `h4` interdit).
* Listes : Toujours utiliser `<ul>` ou `<ol>` pour les énumérations.

## 2. Formulaires & Inputs
* **Labels :** Chaque input DOIT avoir un label (visible ou `aria-label`).
* **Erreurs :** Relier les messages d'erreur aux inputs via `aria-describedby`.
* **Focus :** Ne jamais supprimer l'outline du focus (`outline-none`) sans le remplacer (`ring-2 ring-primary`).

## 3. Navigation Clavier
* **Ordre du tab :** Logique visuelle (Haut -> Bas, Gauche -> Droite).
* **Skip Links :** Prévoir un lien "Aller au contenu principal" caché par défaut.
* **Modales :**
    * Focus piégé dans la modale (`focus-trap`).
    * Touche `Esc` pour fermer.
    * Focus retourné à l'élément déclencheur à la fermeture.

## 4. Images & Icônes
* **Images décoratives :** `alt=""` vide.
* **Images informatives :** `alt="Description précise"`.
* **Icônes seules (Boutons) :** Toujours accompagner d'un `aria-label` ou `<span className="sr-only">`.

## 5. Couleurs & Contrastes
* Ratio minimum de 4.5:1 pour le texte normal (WCAG AA).
* Ne pas utiliser la couleur comme seul indicateur (ex: Erreur = Rouge + Icône + Texte).

## 🛠️ Outils de vérification
* Naviguer au clavier (Tab, Shift+Tab, Enter, Space).
* Utiliser l'extension "AXE DevTools" ou Lighthouse.

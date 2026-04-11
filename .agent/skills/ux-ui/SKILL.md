---
name: ux-ui
description: Règles de design et d'expérience utilisateur (Premium, Glassmorphism, Mobile First).
---

# UX/UI Standards - Premium & Mobile First

## 💎 Philosophie Design
* **Premium First :** Chaque écran doit avoir un "Wow effect" (animations subtiles, typographie soignée).
* **Mobile First :** Penser l'interface pour le tactile (zones de touch > 44px) avant le desktop.
* **Theme Adaptable :** Utiliser STRICTEMENT les tokens du design system (pas de hardcoded colors).

## 1. Identité Visuelle (Glassmorphism)
Appliquer ces règles pour tous les conteneurs flottants, en utilisant l'opacité sur les couleurs du thème :
* **Background :** Semi-transparent (`backdrop-blur-xl bg-background/80` ou `bg-card/50`).
* **Bordures :** Fines et subtiles (`border border-border/50`).
* **Ombres :** Douces (`shadow-xl` ou `shadow-2xl`).
* **Contraste :** Texte toujours lisible (`text-foreground` ou `text-card-foreground`).

## 2. Règles Mobile (iOS & Android)
* **Safe Areas :** Respecter les encoches (`safe-area-inset-*`).
* **Inputs :** Taille de police >= 16px pour éviter le zoom automatique iOS.
* **Touch Targets :** Boutons et liens interactifs de minimum 44x44px.
* **Feedback :** État actif/press visible instantanément (`active:scale-95`).

## 3. PWA & Expérience Native
* **Scroll :** Fluide et élastique (`-webkit-overflow-scrolling: touch`).
* **Overscroll :** Bloquer le "pull-to-refresh" natif si l'app a sa propre navigation (`overscroll-behavior-y: contain`).
* **Selection :** Désactiver la sélection de texte sur l'UI (`user-select: none`).
* **Splash Screen :**
    * **Wahoo Effect :** Doit être immédiat, animé et spectaculaire ("Exceptional Image" en rapport avec le thème).
    * **Version :** Doit TOUJOURS afficher le numéro de version (vX.Y.Z) de manière discrète mais lisible.
    * **Branding :** Logo centré, typographie Premium.

## 4. Micro-Interactions
* **Hover (Desktop) :** Feedback visuel au survol (`hover:bg-accent`).
* **Transitions :** Jamais de changement brusque. Utiliser `transition-all duration-200`.
* **Loading :** Skeletons (`bg-muted`) préférés aux spinners pour le contenu.

## 5. Typographie & Contenu
* **Polices :** Utiliser les variables CSS font-family (ex: `font-sans`, `font-display`).
* **Hierarchie :** H1 > H2 > H3 clairement définis (`text-foreground` vs `text-muted-foreground`).
* **Labels :** Courts, précis, orientés action (Verbe + Objet).

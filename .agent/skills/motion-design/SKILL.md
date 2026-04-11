---
name: motion-design
description: Règles et patterns pour des animations fluides et premium (Framer Motion).
---

# Motion Design & Animations Premium

## 💎 Philosophie
* **Subtilité :** L'animation doit guider l'utilisateur, pas le distraire.
* **Fluidité :** Toujours viser 60fps. Utiliser `transform` et `opacity` préférentiellement.
* **Réactivité :** Les interactions (hover, tap) doivent avoir un feedback immédiat (< 100ms).
* **Adaptabilité :** Utiliser les variables CSS (`var(--primary)`, `var(--shadow-lg)`) pour respecter le thème.

## 🛠️ Stack Technique
* **Bibliothèque :** `framer-motion` (Standard imposé).
* **CSS :** `transition-all duration-300 ease-out` pour les changements simples.

## 1. Page Transitions
Chaque changement de route doit être fluide :
```tsx
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  exit={{ opacity: 0, y: -20 }}
  transition={{ duration: 0.3, ease: "easeOut" }}
>
  {children}
</motion.div>
```

## 1.5. Splash Screen (Wahoo)
L'entrée dans l'application doit être mémorable :
```tsx
<motion.div
  initial={{ opacity: 0, scale: 0.9, filter: "blur(10px)" }}
  animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
  exit={{ opacity: 0, scale: 1.1, filter: "blur(20px)" }}
  transition={{ duration: 0.8, ease: "anticipate" }}
>
  <Logo />
</motion.div>
```

## 2. Listes & Staggering
Pour l'apparition de listes (leads, cartes), utiliser `staggerChildren` avec le parent `initial="hidden" animate="show"` :
```tsx
const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
};
```

## 3. Micro-Interactions (Theme Aware)
* **Boutons :** Scale down au clic (`whileTap={{ scale: 0.95 }}`).
* **Hover :** Légère élévation ou glow.
    * ❌ `boxShadow: "0 10px 20px rgba(0,0,0,0.1)"` (Hardcodé)
    * ✅ `boxShadow: "var(--shadow-lg)"` (Thème)
    * ✅ `borderColor: "hsl(var(--primary))"` (Bordure dynamique)

Example :
```tsx
<motion.button
  whileHover={{ y: -2, boxShadow: "var(--shadow-xl)" }}
  whileTap={{ scale: 0.98 }}
  className="bg-card text-card-foreground p-4 rounded-xl"
>
  Action
</motion.button>
```

## 4. Performance
* Utiliser `layout` prop pour les changements de dimensions automatiques.
* Utiliser `WillChange` CSS property pour les éléments complexes.
* Désactiver les animations lourdes sur mobile si nécessaire (`useReducedMotion`).

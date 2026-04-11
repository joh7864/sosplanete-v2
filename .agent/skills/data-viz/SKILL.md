---
name: data-viz
description: Règles et patterns pour des visualisations de données claires et esthétiques (Recharts).
---

# Data Visualization Standards

## 🎯 Philosophie
* **Clarté avant tout :** "Less is more". Ne pas surcharger les graphiques.
* **Co-hérence :** Utiliser STRICTEMENT les couleurs sémantiques de l'application (Primary, Danger, Success) via Tailwind ou CSS Variables.
* **Interactivité :** Tooltips au survol, légendes cliquables.

## 🛠️ Stack Technique
* **Bibliothèque :** `recharts` (Standard imposé).
* **Wrapper :** `ResponsiveContainer` obligatoire pour la fluidité.

## 1. Couleurs & Thème (Adaptabilité)
Ne JAMAIS coder de valeurs Hexadécimales en dur (`#10b981`). Utiliser les variables CSS du thème :
* **Primaire (Marque) :** `hsl(var(--primary))`
* **Succès (Gain) :** `hsl(var(--success))` ou `var(--color-emerald-500)`
* **Danger (Perte, Erreur) :** `hsl(var(--destructive))` ou `var(--color-rose-500)`
* **Neutre (Fond, Grilles) :** `hsl(var(--border))` ou `hsl(var(--muted-foreground))`

## 2. Configuration Standard (Recharts)
```tsx
// Récupérer les couleurs depuis le CSS computed ou une config centralisée
const colors = {
  primary: "hsl(var(--primary))",
  grid: "hsl(var(--border))",
  text: "hsl(var(--muted-foreground))",
  tooltipBg: "hsl(var(--popover))",
  tooltipBorder: "hsl(var(--border))"
};

<ResponsiveContainer width="100%" height={300}>
  <AreaChart data={data}>
    <defs>
      <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
        <stop offset="5%" stopColor={colors.primary} stopOpacity={0.3}/>
        <stop offset="95%" stopColor={colors.primary} stopOpacity={0}/>
      </linearGradient>
    </defs>
    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={colors.grid} />
    <XAxis 
      dataKey="name" 
      stroke={colors.text} 
      fontSize={12} 
      tickLine={false} 
      axisLine={false} 
    />
    <YAxis 
      stroke={colors.text} 
      fontSize={12} 
      tickLine={false} 
      axisLine={false} 
      tickFormatter={(value) => `$${value}`} 
    />
    <Tooltip 
      contentStyle={{ 
        backgroundColor: colors.tooltipBg, 
        borderColor: colors.tooltipBorder, 
        borderRadius: 'var(--radius)',
        color: 'hsl(var(--popover-foreground))'
      }}
    />
    <Area 
      type="monotone" 
      dataKey="value" 
      stroke={colors.primary} 
      fillOpacity={1} 
      fill="url(#colorValue)" 
    />
  </AreaChart>
</ResponsiveContainer>
```

## 3. Empty States & Loading
* Toujours prévoir un état de chargement (Skeleton rectangulaire `bg-muted`).
* Toujours prévoir un état "Pas de données" (Message centré avec icône `text-muted-foreground`).

## 4. Légendes & Axes
* Supprimer les lignes d'axes inutiles (`axisLine={false}`).
* Alléger les grilles (`strokeDasharray="3 3"`, opacité réduite).
* Formater les valeurs (K, M, %) pour la lisibilité.

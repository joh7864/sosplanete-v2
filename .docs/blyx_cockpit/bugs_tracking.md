# 🐛 Suivi des Bugs (Bug Tracking)

| ID | Statut | Date | US | Description | Sévérité | Fix Appliqué |
|---|---|---|---|---|---|---|
| `B1A2C3` | 🟢 Résolu | 2026-04-16 | Navigation | Redirection incorrecte lors de la création d'un nouvel espace (fall-back localStorage) | Moyenne | Désactivation du fallback localStorage si `new=true` est présent dans l'URL. |
| `D4E5F6` | 🟢 Résolu | 2026-04-16 | Catalogue | Absence de bouton de suppression groupée pour les actions locales | Basse | Ajout d'un bouton `Trash2` animé dans la toolbar du catalogue avec confirmation native. |
| `E7F8G9` | 🟢 Résolu | 2026-04-16 | Layout | Erreur TS: `className` non défini sur le composant `TopBar` | Basse | Ajout de `className` et `subtitle` dans l'interface `TopBarProps` et implémentation dans le composant. |
| `H0I1J2` | 🟢 Résolu | 2026-04-16 | UI | Erreur TS: Taille `"xs"` non supportée par le composant `Button` | Basse | Remplacement de `"xs"` par `"sm"` dans `LocalActionEditModal.tsx`. |
| `K3L4M5` | 🟢 Résolu | 2026-04-16 | Catalogue | Erreur TS: Comparaison invalide type `Category` vs `string` | Moyenne | Correction de la comparaison dans `LocalList.tsx` pour utiliser `.name` si c'est un objet. |

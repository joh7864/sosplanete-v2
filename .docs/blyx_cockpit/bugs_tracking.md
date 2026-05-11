# 🐛 Suivi des Bugs (Bug Tracking)

| ID | Statut | Date | US | Description | Sévérité | Fix Appliqué |
|---|---|---|---|---|---|---|
| `B1A2C3` | 🟢 Résolu | 2026-04-16 | Navigation | Redirection incorrecte lors de la création d'un nouvel espace (fall-back localStorage) | Moyenne | Désactivation du fallback localStorage si `new=true` est présent dans l'URL. |
| `D4E5F6` | 🟢 Résolu | 2026-04-16 | Catalogue | Absence de bouton de suppression groupée pour les actions locales | Basse | Ajout d'un bouton `Trash2` animé dans la toolbar du catalogue avec confirmation native. |
| `E7F8G9` | 🟢 Résolu | 2026-04-16 | Layout | Erreur TS: `className` non défini sur le composant `TopBar` | Basse | Ajout de `className` et `subtitle` dans l'interface `TopBarProps` et implémentation dans le composant. |
| `H0I1J2` | 🟢 Résolu | 2026-04-16 | UI | Erreur TS: Taille `"xs"` non supportée par le composant `Button` | Basse | Remplacement de `"xs"` par `"sm"` dans `LocalActionEditModal.tsx`. |
| `K3L4M5` | 🟢 Résolu | 2026-04-16 | Catalogue | Erreur TS: Comparaison invalide type `Category` vs `string` | Moyenne | Correction de la comparaison dans `LocalList.tsx` pour utiliser `.name` si c'est un objet. |
| `B001A1` | 🟢 Résolu | 2026-05-10 | Instance | Erreur `Unique constraint failed` (id) lors de la création d'espace (séquence PG décalée). | Majeure | Synchronisation globale des séquences PG via script `fix-sequences.ts`. |
| `B002A2` | 🟢 Résolu | 2026-05-10 | Instance | `syncPeriods` échoue silencieusement si `gameEndDate` est nul, bloquant les imports CSV. | Majeure | Ajout d'un log d'avertissement explicite et prévention du retour silencieux. |
| `B003A3` | 🟢 Résolu | 2026-05-10 | Instance | À l'ouverture d'un espace, la période de la date courante ne s'ouvre pas automatiquement. | Majeure | (1) Suppression du filtre `schoolYear` dans `handleCurrentPeriodActivation` (compatibilité legacy). (2) Ajout de l'appel à `handleCurrentPeriodActivation` dans `create()` après `syncPeriods`. |
| `B31400` | 🟢 Résolu | 2026-05-11 | Refonte InstanceYear | **API Périodes** : Erreur 400 sur `GET /periods` lors de la création d'un espace. | Bloquant | Extraction du bloc Périodes dans un nouvel onglet dédié pour éviter l'appel prématuré et utilisation stricte de `instanceYearId`. |
| `B99ALL` | 🟢 Résolu | 2026-05-11 | Refonte InstanceYear | **Fuite d'années** : Une instance s'affiche sur toutes les années même sans `InstanceYear` actif. | Majeure | Ajout d'une condition `some: { schoolYear: sy }` dans `InstanceService.findAll` pour filtrer proprement. |

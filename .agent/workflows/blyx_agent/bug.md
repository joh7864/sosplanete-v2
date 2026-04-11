---
description: Workflow - Déclaration, correction et suivi des bugs post-implémentation
---

# 🐛 Workflow : Gestion des Bugs (Bug Tracking)

> [!IMPORTANT]
> Ce workflow garantit la gestion rapide, efficace et tracée des bugs rencontrés **après l'implémentation** d'une tâche ou d'une User Story (US).

## 1️⃣ Phase de Déclaration & Consignation
1. **Analyse de l'Erreur** : Identifier la région du code fautive via les logs ou la console.
2. **Consignation** : Ouvrir obligatoirement le fichier `.docs/blyx_cockpit/bugs_tracking.md`.
3. Ajouter une nouvelle entrée dans le tableau `Liste des Bugs` avec :
   - Un ID unique (6 caractères hexa, ex: `A1B2C3`).
   - Le statut à `🔴 Ouvert` (ou `🟡 En cours`).
   - La date du jour.
   - L'US concernée.
   - Une description claire.
   - La sévérité (Basse, Moyenne, Haute, Critique).

## 2️⃣ Phase de Résolution
1. **Correction** : Implémenter le correctif en suivant les principes de Clean Code.
2. **Validation** : Vérifier que le bug est résolu sans régressions.
// turbo
```bash
npm run quality
```

## 3️⃣ Phase de Clôture
1. **Mise à jour du Tracker** : Passer le statut à `🟢 Résolu` et ajouter la date de résolution ainsi que le fix appliqué.
2. **Synchronisation** : Lancer `/blyx_sync` pour mettre à jour les indicateurs de vélocité.

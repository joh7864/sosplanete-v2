---
name: local-first-db
description: Architecture de base de données locale (IndexedDB) avec Dexie.js pour PWA Offline-First.
---

# Local-First DB Standards (Dexie.js)

## 🎯 Philosophie
*   **Single Source of Truth** : IndexedDB est la source de vérité pour l'UI, pas le State React, pas l'API distante.
*   **Réactivité** : L'interface réagit aux changements de la DB (via `useLiveQuery`), pas aux retours de fonctions.
*   **Typage Strict** : Les schémas Zod valident les données à l'entrée et à la sortie.

## 1. Modélisation des Données
*   Définir les interfaces TypeScript dans `app/lib/db.ts`.
*   Définir les stores Dexie dans la classe `MyDatabase` (héritant de `Dexie`).
*   **Migration** : Utiliser `db.version(X).stores(...)` pour gérer les évolutions de schéma. Ne jamais casser la compatibilité existante sans migration de données.

## 2. Accès aux Données (Read)
*   **Hooks Réactifs** : Utiliser `useLiveQuery` pour tout affichage de données.
    ```typescript
    // ✅ BON
    const rounds = useLiveQuery(() => db.rounds.toArray());
    
    // ❌ MAUVAIS (useEffect manuel)
    const [rounds, setRounds] = useState([]);
    useEffect(() => { db.rounds.toArray().then(setRounds) }, []);
    ```
*   **Performance** : Indexer les champs utilisés dans les clauses `.where()`.

## 3. Modification des Données (Write)
*   **Transactions Atomic** : Utiliser `db.transaction('rw', [table1, table2], async () => { ... })` pour toute opération impliquant plusieurs tables ou plusieurs étapes critiques.
*   **Validation** : Valider les données avec Zod **avant** l'insertion `db.table.add()`.

## 4. Synchronisation (Optionnel)
*   Si synchronisation cloud : Séparer la logique de sync (Service Worker ou Hook dédié) de la logique UI.
*   Conflits : Stratégie "Last Write Wins" ou fusion intelligente (CRDTs via `y-dexie` si activé).

## 5. Bonnes Pratiques
*   **Ids** : Utiliser UUID v4 pour les clés primaires (permet la génération offline sans collision).
*   **Dates** : Stocker les dates sous forme de `string` ISO 8601 ou `number` (timestamp) pour faciliter le tri/filtrage (IndexedDB gère mal les objets Date natifs dans les index).
*   **Images/Blobs** : Ne pas stocker de gros Blobs dans IndexedDB si possible (perf). Préférer le File System API ou stocker des URLs references.

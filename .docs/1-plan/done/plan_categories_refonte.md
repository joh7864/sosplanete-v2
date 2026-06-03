# Plan d'Implémentation — Refonte du Système de Catégories

> **Décisions validées** : une seule catégorie par action · gestion CategoryRef en UI + CSV · interface intégrée à l'onglet Catégories existant · héritage conditionnel aux actions présentes.

## Contexte et Problèmes Identifiés

### Problème 1 : Le champ `category` n'est pas stocké dans `ActionRef`
Lors de l'import CSV du référentiel global (route `/action-ref/import`), la colonne "Catégorie" est **lue** mais **jamais persistée** en base (`ActionRef` n'a pas de champ `category` dans le schéma Prisma). Résultat : toutes les actions sont "SANS CATÉGORIE".

### Problème 2 : Les catégories sont locales par école/année
Le modèle `Category` est lié à une instance et une année scolaire. Quand une école crée ses catégories manuellement, les actions de son catalogue n'y sont pas liées. Le lien textuel (nom de catégorie dans le CSV) est fragile.

### Problème 3 : L'Eco-Bar-Race est indépendant des catégories
**Bonne nouvelle : l'Eco-Bar-Race ne dépend PAS des catégories.** Il calcule uniquement les impacts CO2/eau/déchets par école. Ce problème est **distinct** et lié à un autre paramètre (`gamePeriodsCount`). Si `gamePeriodsCount` vaut 0 en prod, le recalcul est annulé silencieusement (ligne 142 du service). **Ce point est à vérifier séparément.**

---

## Architecture Cible : Système de Catégories à Deux Niveaux

```
[CategoryRef] ←── Géré par l'AS (global)
     ↓ héritage automatique
[Category] ←── Personnalisable par l'AM (local, par école / par année)
     ↑
[LocalAction] ←── Chaque action de l'école pointe vers une catégorie locale (ou globale par défaut)
```

---

## Composants du Plan

### Phase 1 — Correction du Bug Immédiat (ActionRef sans catégorie)

#### 1.1 Ajouter `category` au schéma `ActionRef`
- Ajouter un champ `category String?` dans le modèle `ActionRef` (Prisma).
- Créer une migration Prisma.
- Mettre à jour `action-ref.service.ts` pour persister la valeur lors de l'import CSV.

> **Impact** : Le tri par catégorie dans l'onglet Catalogue (vue AS) fonctionnera immédiatement sans autre changement.

#### 1.2 Ré-importer le référentiel AS
Après le déploiement, l'AS réimporte le CSV référentiel pour peupler le nouveau champ `category`.

---

### Phase 2 — Catégories Communes (CategoryRef)

> **Réponse à votre question** : Oui, les AM pourront toujours avoir des catégories spécifiques, en plus des catégories communes héritées.

#### 2.1 Nouveau modèle `CategoryRef` (Backend)
```prisma
model CategoryRef {
  id        Int     @id @default(autoincrement())
  name      String  // ex: "Transport", "Alimentation"
  icon      String? // ex: "transport.png"
  order     Int     @default(0)
  // Pas d'instanceId ni de schoolYear → GLOBAL
}
```

#### 2.2 Lier `ActionRef` aux `CategoryRef`
- Ajouter `categoryRefId Int?` dans `ActionRef` en plus du champ texte `category`.
- L'import CSV AS renseigne les deux (texte pour rétrocompatibilité, FK pour la structure).

#### 2.3 Route de gestion des `CategoryRef` (AS uniquement)
- `GET /category-ref` — liste des catégories globales
- `POST /category-ref` — créer
- `PATCH /category-ref/:id` — modifier
- `DELETE /category-ref/:id` — supprimer
- `POST /category-ref/import` — import CSV des catégories globales

#### 2.4 Héritage automatique pour les nouvelles écoles
Lors de l'initialisation d'une instance ou d'une année scolaire, le système copie automatiquement les `CategoryRef` dans des `Category` locales (avec `instanceId` + `schoolYear`). L'AM peut ensuite personnaliser ces copies (renommer, changer l'icône) sans affecter les autres écoles.

---

### Phase 3 — Association Actions ↔ Catégories par Drag & Drop (AM)

C'est la **fonctionnalité clé** qui permet à l'AM de personnaliser le mapping action/catégorie.

#### 3.1 Intégration dans l'onglet "Catégories" existant (Paramètres)
Pas de nouvelle page — l'interface est intégrée à l'onglet **Configuration > Catégories** déjà en place.
Deux vues complémentaires dans cet onglet :

**Vue « Gérer les catégories »** (existante, conservée) :
- Création / modification / réordonnancement des catégories locales.

**Vue « Associer les actions »** (nouvelle section sous la grille de catégories) :
- **Zone de gauche** : liste des actions du catalogue de l'espace, non encore affectées (ou filtrables).
- **Zone de droite** : catégories sous forme de colonnes / zones de dépôt.
- **Drag & Drop unitaire** : glisser une action dans une catégorie.
- **Sélection multiple** : cocher plusieurs actions + bouton "Affecter à..." pour une affectation groupée.
- **Une seule catégorie par action** (pas de tags multiples).

#### 3.2 Backend : endpoint de réaffectation en masse
- `PATCH /local-actions/bulk-assign-category` avec `{ actionIds: number[], categoryId: number | null }`.

#### 3.3 Règle de priorité des catégories
```
LocalAction.categoryId → Category locale (AM)
  ↳ si null → CategoryRef via ActionRef.categoryRefId (global)
    ↳ si null → "Sans catégorie"
```
Le frontend applique cette règle au moment de l'affichage.

---

### Phase 4 — Correction Eco-Bar-Race (Problème Séparé)

Le recalcul de l'Eco-Bar-Race échoue **silencieusement** si `gamePeriodsCount = 0` dans la `GameConfig` en production. L'investigation à mener :

1. **Vérifier en prod** : `SELECT "gamePeriodsCount" FROM "GameConfig" WHERE "instanceId" = 1;`
2. **Si 0** : mettre à jour la valeur via l'interface Paramètres > Données de calcul.
3. **Si correct** : vérifier que les `ActionDone` existent bien pour les périodes concernées.

> Ce point est **indépendant** des catégories et ne sera pas résolu par la Phase 1, 2 ou 3.

---

## Résumé des Changements

| Phase | Complexité | Impact | Priorité suggérée |
|---|---|---|---|
| 1. Fix bug `category` dans ActionRef | Faible | Règle le tri dans le catalogue AS | 🔴 Urgent |
| 2. `CategoryRef` globales | Moyenne | Cohérence inter-écoles, héritage auto | 🟡 Court terme |
| 3. Drag & Drop AM | Élevée | UX avancée pour la personnalisation locale | 🟢 Moyen terme |
| 4. Fix Eco-Bar-Race | Faible | Recalcul correct de la course | 🔴 Urgent (séparé) |

---

## Décisions Validées

| Question | Décision |
|---|---|
| Héritage automatique des actions vers les CategoryRef | **Conditionnel** : si l'action est déjà présente dans l'espace → pré-affectée. Sinon → non affectée. |
| Multi-catégorie par action | **Non** — une seule catégorie par action. |
| Gestion des CategoryRef (AS) | **Les deux** : import CSV + interface de gestion manuelle dans Paramètres > Catalogue. |
| Emplacement interface Drag & Drop AM | **Intégré** à l'onglet Catégories existant (Configuration), pas de nouvelle page. |

---

## Vérification Eco-Bar-Race en Production

### Résultat obtenu
✅ `gamePeriodsCount = 39` — La configuration est correcte. Le recalcul ne bloque pas sur ce paramètre.

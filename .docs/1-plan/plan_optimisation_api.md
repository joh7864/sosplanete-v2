# Plan d'Optimisation API - SOS Planète v1

Ce document détaille l'analyse des performances et le plan d'action pour réduire le nombre de requêtes effectuées par le jeu (v1) vers le serveur (v2), évitant ainsi les erreurs `429 (Too Many Requests)`.

## 1. Analyse des Causes de Surcharge

### A. Le Phénomène de Waterfall (Cascade)
Dans `AuthContext.jsx`, le chargement des données après connexion suit un schéma séquentiel inefficace :
1. `GET /week` 
2. `GET /children`
3. `GET /children/:pseudo/pseudo`
4. `GET /child/:id`
5. `GET /teams`, `/actions`, `/school`

**Total :** ~7 requêtes successives à chaque démarrage ou rafraîchissement.

> **Commentaires :**
> 

### B. Redondance et Granularité
- **Finesse excessive** : Le jeu demande chaque entité séparément.
- **Double appel Scores** : Sur la page "Moi", appels séparés pour la semaine et l'historique.
- **Absence de Cache** : Données statiques rechargées inutilement.

> **Commentaires :**
> 

---

## 2. Plan d'Amélioration

### Phase 1 : Agrégation Backend (Priorité Haute)
L'objectif est de réduire drastiquement le nombre de "poignées de main" HTTP.
- [ ] **Création de `GET /legacy/sync`** : Un point d'entrée unique retournant un objet complet (week, childInfos, teams, actionsReference, school).
- [ ] **Optimisation des scores (`/actionsdone` vs `/actionsdone2`)** : Fusionner ou clarifier le rôle de ces deux appels (sujet mis de côté pour l'instant).

> **Commentaires :**
> 

### Phase 2 : Refactoring du Front-end (`AuthContext`)
- [ ] **Nettoyage de `finishLogin`** : Remplacer la cascade de `axios.get` par un appel unique au nouvel endpoint `/sync`.
- [ ] **Gestion des erreurs centralisée**.

> **Commentaires :**
> 

### Phase 3 : Stratégie de Cache Client
- [ ] **Persistance LocalStorage** : Stocker les données "froides" (Référentiel des actions, Liste des équipes).
- [ ] **Validation de Cache** : N'invalider le cache que si l'ID de l'instance change.

> **Commentaires :**
> 

### Phase 4 : Optimisation des Pages
- [ ] **Moi.jsx** : Utiliser les données déjà présentes dans le contexte au lieu de re-solliciter le serveur.
- [ ] **Actions.jsx** : Optimiser le chargement des images d'actions.

> **Commentaires :**
> 

---

## 3. Conclusion et Validation Globale

*Cochez les phases validées :*
- [ ] Phase 1
- [ ] Phase 2
- [ ] Phase 3
- [ ] Phase 4

**Note de synthèse finale :**

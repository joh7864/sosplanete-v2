# 📊 Audit Global & Performance (Rapport Technique)
**Date :** 2026-08-06
**Version Cible :** v5.1.0

> [!IMPORTANT]
> Ce rapport a été généré suite à l'observation d'un temps de chargement critique (environ 15 secondes) sur le dashboard Evoe 2026. L'audit complet a été exécuté en lecture seule conformément à la demande.

## 🕵️ Analyse du Goulot d'Étranglement (15s de chargement)

L'enquête technique a révélé que la lenteur n'est pas due au code frontend standard, mais à une combinaison de facteurs liés à **Three.js**, **React Three Fiber (R3F)** et aux **requêtes réseau concurrentes** sur l'environnement de développement.

### 1. La Tempête de Requêtes 404 (Cascade)
Sur l'environnement local, le dossier `uploads/avatars` ne contient pas tous les avatars des joueurs de la production.
- L'application tente de charger les vrais avatars pour **tous les joueurs** en même temps (ex: `http://localhost:3011/static/avatars/1784730964954-512003.png`).
- Ces images n'existant pas en local, le backend NestJS met un certain temps à traiter et renvoyer une pluie de **404 Not Found**.
- **Conséquence :** Le navigateur sature sa limite de requêtes simultanées (en général 6 par domaine), bloquant les autres ressources critiques comme `earth.jpg` (500 Ko) qui se retrouvent en file d'attente.

### 2. L'Effet "Promise Cache" et le Blocage R3F
Bien que la mise en cache globale des Promesses ait résolu les appels redondants aux avatars par défaut (`H_avatar_015.png`), elle a un effet secondaire :
- Les avatars tentent tous de se résoudre en parallèle.
- Le moteur 3D (Three.js) attend la résolution de ces images. Le décodage d'images (même échouées) monopolise le fil d'exécution principal (Main Thread).
- Le rendu de la scène (Canvas) est bloqué tant que les Promesses réseau ne sont pas évacuées par le navigateur.

### 3. Serveur de développement (Vite)
Lors du premier lancement ou rafraîchissement lourd, Vite recompile les modules à la volée. Avec une scène 3D complexe, cette compilation combinée au rendu initial ajoute des secondes précieuses au "Time To Interactive".

---

## 🛠️ Plan d'Action Recommandé (Solutions)

Pour redescendre sous la barre des 2 secondes de chargement :

1. **Lazy Loading des Avatars 3D**
   Ne charger les textures des avatars que lorsqu'ils entrent dans le champ de vision (Frustum Culling) ou introduire un délai aléatoire (stagger) pour ne pas lancer 30 requêtes HTTP à la milliseconde 0.

2. **Backend : Pré-résolution des avatars**
   Le backend ne devrait renvoyer l'URL d'un avatar custom *que* si le fichier existe physiquement. Sinon, il doit renvoyer directement le nom de l'avatar par défaut. **Ceci éliminera 100% des erreurs 404 côté client.**

3. **Compression des Textures (WebP / KTX2)**
   La texture `earth.jpg` fait plus de 500 Ko. Elle devrait être servie en WebP (poids divisé par 3) ou via le format GPU optimisé KTX2 pour soulager le navigateur.

---

## 📋 Bilan de l'Audit (Workflow /audit-global)

| Catégorie | Statut | Observations |
| :--- | :---: | :--- |
| **Codebase & Linting** | ⚠️ | Le script `npm run metrics` n'existe pas dans le monorepo racine. La couverture des tests n'est pas mesurable actuellement. |
| **Dependencies** | 🟢 | Packages globaux à jour suite au `bump-version` (v5.1.0). |
| **UI / UX Design** | 🟢 | La barre latérale des profils a été optimisée (plus de scrollbar horizontale). Le design est "Premium" comme attendu. |
| **Sécurité (.env)** | 🟢 | Correction appliquée : `UPLOADS_DIR` n'est plus forcé localement, résolvant la fuite de chemin de production vers le dev local. |

> [!TIP]
> **Prochaine étape :** Je te conseille fortement de mettre en place la solution n°2 (vérification de l'avatar côté backend). C'est la méthode la plus élégante et elle soulagera définitivement le réseau. Dis-moi si tu souhaites que je l'implémente plus tard !

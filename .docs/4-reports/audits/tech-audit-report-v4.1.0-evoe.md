# 🛡️ Rapport d'Audit Technique — Evoe Frontend

**Version analysée :** `4.1.0`
**Date d'audit :** 2026-07-08
**Auditeur :** Antigravity Agent (Tech Lead Mode)
**Périmètre :** Client Frontend Evoe (`apps/evoe-frontend`)

---

## 📋 Synthèse Exécutive

| Dimension | Note | Observations |
|---|---|---|
| **Architecture** | 🟢 A | Excellente séparation des responsabilités. Logique métier isolée dans des hooks d'état et socket. |
| **Qualité du Code** | 🟢 A- | Fichiers allégés respectant la limite de 300 lignes (sauf App/ChatPanel). Typage TypeScript strict et cohérent. |
| **Sécurité** | 🔴 D | Faille critique : stockage du couple identifiant:mot de passe en Basic Auth dans le stockage local du navigateur. |
| **Robustesse** | 🟡 B | Gestion de la perte de socket saine, mais retours utilisateur inexistants lors de l'échec de chargement réseau. |
| **Documentation** | 🟡 B- | Shaders et calculs géométriques R3F bien documentés, manque de JSDoc sur les signatures des hooks. |

**Score global estimé : 14/20**

---

## 🏗️ Phase 1 : Analyse du Contexte Technique

### Stack Technologique

| Composant | Technologie | Version |
|---|---|---|
| **Librairie UI** | React | `^19.2.6` |
| **Routage** | react-router-dom | `^7.17.0` |
| **Outils de Build** | Vite + TypeScript | Vite `8.0.16`, TS `5.x` |
| **Librairie 3D** | Three.js | `^0.184.0` |
| **Rendu 3D React** | `@react-three/fiber` | `^9.6.1` |
| **Utilitaires 3D** | `@react-three/drei` | `^10.7.7` |
| **Post-processing 3D** | `@react-three/postprocessing` | `^3.0.4` |
| **Client HTTP** | Axios | `^1.18.0` |
| **Client Temps Réel** | Socket.io Client | `^4.8.3` |
| **Animations 2D** | Framer Motion | `^12.40.0` |

### Architecture Globale

```
apps/evoe-frontend/
├── src/
│   ├── components/
│   │   ├── 3d/                 <- PlayerAvatar.tsx, VesselEngines.tsx, CosmicEnvironment.tsx
│   │   ├── chat/               <- ChatMessageItem.tsx
│   │   ├── ui/                 <- Modales autonomes (AgentProfile, Leaderboard, Challenge...)
│   │   ├── Portal2026.tsx      <- Rendu QG 2026 (Terre + Avatars)
│   │   ├── Portal2070.tsx      <- Rendu Radar 2070 (Trou noir + Vaisseaux)
│   │   ├── Vessel2070.tsx      <- Représentation du vaisseau
│   │   ├── Arch2070.tsx        <- Arche temporelle
│   │   ├── TemporalBriefing.tsx<- Briefing introductif (effet machine à écrire)
│   │   └── ChatPanel.tsx       <- Panneau d'interface du chat Comm-Link
│   ├── context/
│   │   └── AuthContext.tsx     <- Contexte de session (Basic Auth)
│   ├── hooks/
│   │   ├── useChatSocket.ts    <- Hook gérant la connexion et écoutes socket du chat
│   │   └── useEvoeData.ts      <- Hook gérant l'état des défis et requêtes d'impulsions
│   ├── types/
│   │   └── evoe.ts             <- Modèles de typage commun
│   ├── App.tsx                 <- Routeur principal et gestionnaire d'époques
│   ├── App.css                 <- Styles globaux et animations du chat Comm-Link
│   └── main.tsx                <- Point d'entrée de l'application
```

---

## 🏗️ Phase 2 : Audit Qualité & Robustesse

### 2.1 Clarté & SOLID (Séparation des responsabilités)
* **Point Fort** : La logique R3F complexe a été dissociée de la mise en place de la scène. Les systèmes de particules de combustion et réacteurs (`VesselEngines.tsx`), les avatars 3D (`PlayerAvatar.tsx`) ainsi que les environnements cosmiques (`CosmicEnvironment.tsx`) possèdent leurs propres fichiers isolés.
* **Point Fort** : La logique de discussion en temps réel a été retirée de l'UI et placée dans le hook `useChatSocket.ts`.
* **Point d'amélioration** : [App.tsx](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/evoe-frontend/src/App.tsx) (1501 lignes) et [ChatPanel.tsx](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/evoe-frontend/src/components/ChatPanel.tsx) (530 lignes) restent volumineux malgré la modularisation globale. Ces fichiers ont toutefois été allégés de plus de 50% de leur taille initiale.

### 2.2 Gestion d'Erreurs et robustesse
* **Silencing d'erreurs** : Dans [AuthContext.tsx](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/evoe-frontend/src/context/AuthContext.tsx) (lignes 60 et 87), les blocs `.catch()` réinitialisent l'état local ou affichent une erreur console, mais l'utilisateur n'est pas averti visuellement de la coupure de flux ou de l'échec de la récupération des données.
* **Erreur de chargement** : De la même manière, si la requête de context (`/context`) échoue au démarrage, les missions, avatars et joueurs sont simplement initialisés à vide sans retour d'erreur ni bouton de reconnexion.

### 2.3 Code Mort & Inconsistances
* **Conformité** : Aucun code mort n'est recensé dans `apps/evoe-frontend/src/`. La compilation avec `npm run build` se déroule avec succès, prouvant qu'aucun import orphelin n'a été conservé.

---

## 🏗️ Phase 3 : Audit de Sécurité & Conformité

### 3.1 🔴 STOCKAGE DU MOT DE PASSE EN CLAIR DANS LE LOCALSTORAGE
* **Fait observable** : Dans [AuthContext.tsx](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/evoe-frontend/src/context/AuthContext.tsx) (lignes 100 à 135), l'authentification de l'utilisateur utilise le protocole **HTTP Basic Authentication** :
  ```typescript
  const resolvedUname = userInfo.pseudo + ":" + userInfo.password;
  const encodedAuth = btoa(resolvedUname);
  ```
* **Vulnérabilité** : Cette chaîne encodée est stockée telle quelle dans `localStorage` ou `sessionStorage` sous la clé `evoe_auth` :
  ```typescript
  localStorage.setItem("evoe_auth", encodedAuth);
  ```
* **Impact** : Le Base64 n'est pas un chiffrement mais un simple encodage réversible. En cas de vulnérabilité XSS (injection de script tiers via une librairie compromise ou une dépendance npm), un attaquant peut extraire la clé du stockage local et décoder instantanément le mot de passe de l'utilisateur :
  ```javascript
  const motDePasseEnClair = atob(localStorage.getItem("evoe_auth")).split(":")[1];
  ```

### 3.2 🔴 MODIFICATION DE L'INSTANCE AXIOS GLOBALE
* **Fait observable** : Lors de la connexion, le header d'authentification et l'ID de nexus sont injectés globalement sur l'instance par défaut d'Axios :
  ```typescript
  axios.defaults.headers.common['Authorization'] = headers['Authorization'];
  axios.defaults.headers.common['x-instance-id'] = instId;
  ```
* **Impact** : Cela contamine toutes les requêtes faites avec l'instance axios globale de l'application. Si des APIs tierces externes venaient à être appelées par l'application (ex: un widget météo, un tracker de stats tiers ou un CDN), le mot de passe de l'utilisateur sous forme de token Basic Auth leur serait automatiquement envoyé.

### 3.3 🟢 PROTECTION CONTRE LES INJECTIONS XSS DU CHAT (CONFORMITÉ RENDU)
* **Fait observable** : Dans [ChatMessageItem.tsx](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/evoe-frontend/src/components/chat/ChatMessageItem.tsx) (lignes 124 à 158 et 360), l'affichage du texte des messages Comm-Link et le formatage des mentions `@` s'appuient sur un parsing transformant le texte brut en composants React typés :
  ```typescript
  // formatMentions retourne un tableau de (string | JSX.Element)
  {msg.role === 'SYSTEM' ? decodeHtmlEntities(msg.content) : formatMentions(decodeHtmlEntities(msg.content))}
  ```
* **Sécurité** : L'application n'utilise pas `dangerouslySetInnerHTML`. Les caractères spéciaux saisis par les utilisateurs ne peuvent donc pas être interprétés comme du code HTML ou JavaScript par le navigateur, éliminant les risques de faille XSS stockée via le chat.

---

## 🏗️ Phase 4 : Documentation In-Code

### 4.1 Points Positifs
* Les calculs de shaders (magma, transition d'évolution de la Terre) de `Portal2070.tsx` et les formules de positionnement trigonométrique en arc de cercle de `Portal2026.tsx` possèdent des commentaires mathématiques instructifs très utiles au débogage visuel.

### 4.2 Points Négatifs
* Les signatures des méthodes exposées par les nouveaux hooks custom [useEvoeData.ts](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/evoe-frontend/src/hooks/useEvoeData.ts) et [useChatSocket.ts](file:///c:/Users/User/Documents/Sync%20Pcloud/Professionnel/Dev/sosplanete-v2/apps/evoe-frontend/src/hooks/useChatSocket.ts) ne comportent aucune documentation JSDoc.

---

## 📊 Liste Consolidée des Écarts

| ID | Sévérité | Catégorie | Description | Fichier(s) |
|---|---|---|---|---|
| **SEC-FE-01** | 🔴 CRITIQUE | Sécurité | Stockage Basic Auth (pseudo:mot-de-passe en base64) dans localStorage / sessionStorage | `AuthContext.tsx` |
| **SEC-FE-02** | 🟠 ÉLEVÉ | Sécurité | Pollution de l'instance Axios globale via `axios.defaults` | `AuthContext.tsx` |
| **QUAL-FE-01**| 🟡 MOYEN | Qualité | Silencing d'erreurs d'initialisation et de requêtes réseau sans feedback utilisateur | `AuthContext.tsx`, `useEvoeData.ts` |
| **DOC-FE-01** | 🟡 MOYEN | Doc | Absence d'en-têtes JSDoc explicatifs sur les hooks personnalisés | `useEvoeData.ts`, `useChatSocket.ts` |

---

## ✅ Checklist de Validation
- [x] Analyse basée uniquement sur des faits observables
- [x] Aucun jugement personnel
- [x] Rapport stocké dans le bon dossier `.docs/4-reports/audits/`
- [x] Version analysée clairement identifiée (`v4.1.0`)

---

## 🔗 Next Steps Recommandés

1. **Migration d'Authentification (SEC-FE-01)** : Remplacer l'authentification par entête HTTP Basic Auth (nécessitant le mot de passe brut de l'utilisateur à chaque requête) par une authentification par session (Cookie HTTP-Only) ou jeton d'accès à durée limitée (JWT signé) géré uniquement en mémoire par l'application frontend.
2. **Isolation Axios (SEC-FE-02)** : Créer une instance Axios dédiée pour l'API Evoe (`const evoeClient = axios.create(...)`) au lieu d'utiliser l'instance globale `axios` par défaut.
3. **Retour Utilisateur (QUAL-FE-01)** : Mettre en place un système de notification de type toast pour avertir l'utilisateur en cas d'erreur de chargement réseau.

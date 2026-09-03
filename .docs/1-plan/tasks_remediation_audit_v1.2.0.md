# Tasks — Plan de Remédiation Audit v1.2.0

> Référence : `implementation_plan.md` & Rapports d'audit du 2026-09-03
> Démarré le : 2026-09-03
> Statut global : 🟢 PILIER 1 TERMINÉ / PILIER 2 PRÊT

---

## 🔐 Pilier 1 — Sécurité & Authentification Joueur (`SEC-01`)

### 1.1 Backend NestJS : Émission & Validation JWT
- [x] Injecter `JwtService` dans `LegacyApiService` ou `LegacyApiModule`
- [x] Mettre à jour `checkAuthChild` pour générer un `accessToken` JWT signé contenant `childId`, `pseudo`, `instanceId`, `role: 'CHILD'`
- [x] Adapter `LegacyApiController` pour supporter l'en-tête `Authorization: Bearer <token>`
- [x] Mettre à jour `getChildFromAuth` dans `LegacyApiService` pour valider le JWT `Bearer` en priorité, tout en conservant le fallback transparent `Basic` pour SOSPlanète v1
- [x] Supprimer les appels redondants à `bcrypt.compare` sur chaque requête lorsqu'un JWT valide est fourni

### 1.2 Frontend Evoe : Intégration du Jeton
- [x] Modifier `AuthContext.tsx` d'Evoe Frontend pour stocker `evoe_token` (JWT opaque) au lieu de `evoe_auth`
- [x] Conserver la logique `keepLogged` (stockage dans `localStorage` si `true`, `sessionStorage` si `false`)
- [x] Mettre à jour `checkUserStatus` pour valider le token existant au démarrage
- [x] Configurer `evoeClient.defaults.headers.common['Authorization'] = 'Bearer ' + token`
- [x] Nettoyer les clés `evoe_auth` obsolètes lors de la déconnexion ou de la mise à jour

### 1.3 Validation & Non-Régression
- [x] Compiler et builder `backend-v2` (`npm run build`) ✔️
- [x] Compiler et builder `evoe-frontend` (`npm run build`) ✔️
- [x] Valider les tests unitaires Jest (`legacy-api.service.spec.ts`, `legacy-api.controller.spec.ts`, `evoe.service.spec.ts`) ✔️

---

## 🧹 Pilier 2 — Nettoyage Qualité & Linter (`QUAL-01` & `QUAL-02`)

### 2.1 Frontend Evoe : React 19 & Hooks
- [ ] Corriger l'appel synchrone à `setShowBriefing` dans le `useEffect` de `useEvoeData.ts`
- [ ] Supprimer les `setState` synchrones en cascade dans `fetchChallenges`
- [ ] Typer les structures de données récurrentes pour éliminer les types `any` résiduels

### 2.2 Admin Next.js 16 : Entités & Imports
- [ ] Échapper les apostrophes et guillemets (`&apos;`, `&quot;`) dans `Step6Gamification.tsx`, `Step7Communication.tsx`, `Step8ReviewLaunch.tsx`
- [ ] Nettoyer les imports d'icônes `lucide-react` et composants orphelins
- [ ] Corriger l'effet `useInstanceYear.ts` (`setInstanceYearId`)
- [ ] Exécuter `npm run lint -- --fix` et vérifier la conformité ESLint

---

## 📱 Pilier 3 — Accessibilité & Ergonomie Tactile (`DES-01`)

### 3.1 Zones de Contact Tactile Mobile (>= 44x44px)
- [ ] Élargir la hitbox invisible des boutons d'action et croix de fermeture `X` dans `ChallengeModal.tsx` sans altérer le design visuel
- [ ] Ajuster les cibles tactiles dans `AgentProfileModal.tsx` et `ChatMessageItem.tsx`
- [ ] Vérifier les boutons d'onglets et de commandes sur mobile

### 3.2 Sémantique ARIA & Gestion du Clavier
- [ ] Ajouter les écouteurs d'événement clavier `Escape` pour fermer les modales ouvertes
- [ ] Ajouter les attributs `role="dialog"`, `aria-modal="true"` et `aria-label` sur les fenêtres modales
- [ ] Mettre en place un composant de toast ou notification visuelle en cas d'erreur de requête réseau

---

## ✂️ Pilier 4 — Refactorisation Modulaire (`ARCH-01`)

### 4.1 Découpage de `ChallengeModal.tsx` (1 164 lignes)
- [ ] Extraire `TeamSelector.tsx` (sélection de l'équipe et filtre)
- [ ] Extraire `MissionSelector.tsx` & `MissionPreviewCard.tsx` (sélection et rendu 3D)
- [ ] Extraire `PledgeSelector.tsx` (gestion et gages personnalisés)
- [ ] Alléger `ChallengeModal.tsx` à < 300 lignes

### 4.2 Découpage de `ChatPanel.tsx` (1 410 lignes)
- [ ] Extraire `ChatHeader.tsx` (onglets de canaux, compteurs non-lus)
- [ ] Extraire `ChatMessageList.tsx` (scroll dynamique et séparateurs temporels)
- [ ] Extraire `ChatInputBar.tsx` (saisie, mentions `@`, boutons d'action)
- [ ] Alléger `ChatPanel.tsx` à < 350 lignes

### 4.3 Découpage de `App.tsx` (2 416 lignes)
- [ ] Extraire `useSoundManager.ts` (effets sonores et ambiance)
- [ ] Extraire `useEpochManager.ts` (gestion des époques 2026/2070 et transitions)
- [ ] Extraire `EvoeTopNav.tsx` et `ModalsContainer.tsx`
- [ ] Ramener `App.tsx` à < 400 lignes

# 💬 EPIC-09 : Comm-Link / Messagerie Temps Réel Quantique (WebSockets)

## 📋 Présentation
Cet Epic couvre la messagerie instantanée multicanale en temps réel basée sur WebSockets (`Socket.io` / `ChatGateway`), les canaux Global/Nexus, Équipe, Système, les messages privés inter-joueurs et inter-équipes, la gestion des statuts de présence en ligne, l'édition/suppression de messages et l'intégration des liens WhatsApp.

---

### 📖 US-EVOE-29 : Canaux de Discussion du Comm-Link
- **En tant qu'** Agent Temporel,
- **Je veux** échanger des messages sur différents canaux (Global, Équipe, Système, MP Joueur, MP Équipe),
- **Afin de** coordonner les actions écologiques avec mes camarades.

#### ⚙️ Règles de Gestion & Fonctionnement
1. Le panneau Comm-Link (`ChatPanel.tsx` / `useChatSocket.ts`) se déploie via l'icône de messagerie `MessageSquare` ou `Radio`.
2. Les canaux disponibles sont :
   - 🌐 **Nexus Global** : discussion ouverte à tous les élèves de l'école.
   - 🛡️ **Canal d'Équipe** : discussion privée réservée aux membres de la même classe.
   - 🤖 **Nexus Système** : alertes automatiques d'impulsions, déblocages d'animaux et annonces système.
   - 👤 **Messages Privés (MP Joueur)** : discussion confidentielle 1-à-1 entre deux agents temporels.
   - ⚔️ **Messages Privés d'Équipe (MP Inter-Équipes)** : discussion stratégique entre deux classes complètes.
3. Le socket s'authentifie via le token de session et rejoint les rooms spécifiques (`global_${instanceId}`, `team_${teamId}`).

#### 🧪 Critères d'Acceptation (Gherkin)
- **Scénario 1 : Envoi sur le canal d'équipe**
  - **Given** le canal "Équipe" sélectionné dans le Comm-Link.
  - **When** le joueur envoie le message `"N'oubliez pas d'éteindre les ordinateurs ce soir !"`.
  - **Then** le message est diffusé instantanément à tous les membres connectés de cette équipe via WebSockets.
  - **And** les élèves des autres classes ne reçoivent pas ce message.

---

### 📖 US-EVOE-30 : Édition et Suppression de Messages en Temps Réel
- **En tant qu'** Agent Temporel ayant envoyé un message,
- **Je veux** pouvoir modifier son texte ou le supprimer,
- **Afin de** corriger une coquille ou retirer un message inapproprié.

#### ⚙️ Règles de Gestion & Fonctionnement
1. L'auteur d'un message dispose d'un menu d'actions (icônes d'édition et de corbeille) sur ses propres messages.
2. L'édition émet l'événement socket `editMsg` : le message est mis à jour chez tous les clients avec la mention « *(modifié)* ».
3. La suppression émet l'événement socket `deleteMsg` : le message disparaît instantanément du flux de tous les participants.

#### 🧪 Critères d'Acceptation (Gherkin)
- **Scénario 1 : Suppression de message**
  - **Given** un message envoyé par le joueur connecté.
  - **When** il clique sur l'icône de suppression.
  - **Then** le message est retiré en direct de l'affichage de tous les utilisateurs du canal.

---

### 📖 US-EVOE-31 : Badges de Notifications & Statut de Présence En Ligne
- **En tant qu'** Agent Temporel,
- **Je veux** voir le nombre de messages non lus par canal et repérer quels camarades sont connectés,
- **Afin de** ne manquer aucune communication importante.

#### ⚙️ Règles de Gestion & Fonctionnement
1. Lorsqu'un message arrive sur un canal non actif, un badge numérique néon s'incrémente sur l'onglet correspondant (`unreadGlobal`, `unreadTeam`, `unreadMps`, etc.).
2. Le bouton principal du Comm-Link affiche le total cumulé des messages non lus (`unreadChat.total`).
3. La liste des agents connectés (`onlineUsersUpdate`) affiche une pastille verte clignotante à côté des pseudos en ligne.

#### 🧪 Critères d'Acceptation (Gherkin)
- **Scénario 1 : Réception d'un message non lu**
  - **Given** le panneau de chat fermé.
  - **When** un coéquipier envoie un message dans le canal d'équipe.
  - **Then** le badge de notification de l'icône Comm-Link passe à 1.

---

### 📖 US-EVOE-32 : Liens Communautaires WhatsApp
- **En tant qu'** Agent Temporel ou Délégué d'Équipe,
- **Je veux** accéder au lien d'invitation vers le groupe WhatsApp officiel de mon équipe ou de l'école,
- **Afin de** prolonger les échanges sur smartphone en dehors de la plateforme de jeu.

#### ⚙️ Règles de Gestion & Fonctionnement
1. Si un lien de groupe WhatsApp (`whatsappInviteUrl` ou `whatsappCommunityUrl`) a été configuré pour l'équipe ou l'instance, une icône WhatsApp dédiée (`FaWhatsapp`) est visible dans le Comm-Link.
2. Le clic ouvre une modale ou redirige de manière sécurisée vers le groupe WhatsApp officiel de la classe.

#### 🧪 Critères d'Acceptation (Gherkin)
- **Scénario 1 : Clic sur le lien WhatsApp de l'équipe**
  - **Given** un lien configuré pour l'équipe du joueur.
  - **When** il clique sur l'icône WhatsApp dans le Comm-Link.
  - **Then** une invitation vers le groupe WhatsApp correspondant est proposée.

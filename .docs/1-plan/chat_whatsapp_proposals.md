# Propositions Techniques & Fonctionnelles : WhatsApp & Chat en Ligne (Evoe)

Ce document présente les pistes d'intégration pour le paramétrage des groupes WhatsApp (US 3.2) et la création d'un chat en ligne interactif au sein d'Evoe.

*Vous pouvez annoter directement ce document pour valider ou modifier les choix proposés.*

---

## 📞 1. Paramétrage des Groupes WhatsApp (US 3.2)

Pour assurer l'envoi de rapports ciblés (généraux et par équipe), le système doit connaître la structure des groupes WhatsApp.

### 🎨 Proposition UI/UX (Page de configuration Admin)
Dans l'interface d'administration, un onglet dédié **"Canaux Temporels (WhatsApp)"** permettra de configurer :
*   **Le Nexus Général (Groupe Global)** :
    *   `whatsappGeneralInviteUrl` : Lien public visible par tous les joueurs pour rejoindre le groupe.
    *   `whatsappGeneralWebhook` : Identifiant ou clé d'API (Twilio, Green-API, Evolution-API) pour l'envoi des rapports hebdomadaires globaux.
*   **Les Canaux de Vaisseaux (Par Équipe)** :
    *   Pour chaque équipe enregistrée en base (ex: *Air*, *Terre*, *Feu*), des champs en vis-à-vis :
        1. **Lien d'invitation d'équipe** (pour rejoindre le groupe).
        2. **ID / Webhook WhatsApp** d'équipe (pour les alertes automatisées de paradoxe temporel).

### ⚙️ Modèle de Données (Prisma)
```prisma
// Extension suggérée pour stocker la configuration
model Team {
  id                 String  @id @default(uuid())
  name               String
  color              String
  // ... champs existants ...
  whatsappInviteUrl  String?
  whatsappGroupId    String? // ID technique pour l'API WhatsApp
}

model SystemConfig {
  id                  String  @id @default("default")
  whatsappGeneralUrl  String?
  whatsappGeneralId   String?
}
```

### ✍️ Vos Annotations / Retours sur la partie WhatsApp :
*   *(Ajoutez vos notes ici)*
*   
*   

---

## 💬 2. Intégration d'un Chat en ligne dans Evoe (Live Chat)

Pour augmenter l'engagement et l'immersion multijoueur, nous proposons l'intégration d'un chat en temps réel directement dans le portail d'Evoe.

### 🎨 Design UI/UX : Le "Nexus Comm-Link"
*   **Comportement** : Panneau latéral droit rétractable. Raccourci clavier de déclenchement rapide via la touche **`Entrée`** (ou `/`).
*   **Esthétique** :
    *   Fond sombre translucide flouté (`backdrop-filter: blur(12px)`).
    *   Police terminal de commande (monospace) et curseur clignotant.
    *   **Canaux colorés** :
        *   `[GLOBAL]` (Cyan/Blanc) : Échanges entre tous les 30 joueurs.
        *   `[ÉQUIPE]` (Vert) : Échanges privés de la team pour élaborer les stratégies de défis.
        *   `[SYSTEM]` (Or/Jaune) : Alertes automatisées du jeu (ex: *"@dinosaure a résolu sa mission ! Traînée solaire débloquée"*, *"L'Équipe Air a envoyé un défi à l'Équipe Terre"*).
*   **Micro-animations** : Sons discrets de notification "holographique" (désactivables) + effet de glissement vertical lors de l'apparition des messages.

### 🛠️ Options d'Architecture Technique

#### Option A (Recommandée) : WebSockets (FastAPI + Socket.io)
*   **Principe** : Connexion temps réel bidirectionnelle permanente ouverte entre le navigateur et le serveur.
*   **Avantages** : Latence quasi nulle (< 50ms), indicateur de saisie (*"X est en train d'écrire..."*), rafraîchissement instantané.
*   **Inconvénients** : Nécessite une configuration proxy mineure pour Docker (permettre le passage des connexions `ws://` à travers Nginx).

#### Option B : Server-Sent Events (SSE) ou Long Polling
*   **Principe** : Le navigateur fait des requêtes HTTP régulières (ex: toutes les 3 secondes) ou maintient une connexion unidirectionnelle ouverte pour recevoir les messages, et envoie les siens via des requêtes POST classiques.
*   **Avantages** : Très facile à implémenter, pas de protocole WebSocket à configurer.
*   **Inconvénients** : Décalage de quelques secondes, charge de requêtes répétées plus lourde sur la base de données.

### ✍️ Vos Annotations / Retours sur le Chat en ligne :
*   *(Ajoutez vos notes ici)*
*   
*   

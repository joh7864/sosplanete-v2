# 🚀 Guide d'Activation d'Evolution API en Production (VPS)

Ce document explique comment le conteneur **Evolution API** s'exécute automatiquement sur votre VPS et comment procéder à la première association par QR Code.

---

## 🛠️ 1. Déploiement Automatique sur le VPS

Le service `evolution-api` a été intégré dans le fichier principal `docker-compose.yml`. Lors de votre déploiement habituel sur votre serveur VPS :

```bash
docker compose up -d --build
```

Docker va automatiquement :
1. Télécharger l'image officielle `atendai/evolution-api:v2.1.1`.
2. Démarrer le conteneur `sos_evolution_api` sur le réseau interne sécurisé (`sos_internal`).
3. Créer le volume persistant `evolution_instances` pour conserver la session WhatsApp active même en cas de redémarrage du VPS.

---

## 🔒 2. Sécurité & Authentification

- **Réseau Isolé** : Le conteneur communique uniquement avec le backend EVOE sur le réseau interne Docker (`http://evolution-api:8080`). Il n'est **pas ouvert publiquement sur Internet**.
- **Clé Secrète** : L'accès est verrouillé par la clé `AUTHENTICATION_API_KEY` (par défaut `EVOE_SECRET_WHATSAPP_KEY_2026` ou définie via votre fichier `.env`).

---

## 📱 3. Première Association par QR Code (2 minutes)

Une fois les conteneurs démarrés sur le VPS :

1. **Créer l'instance WhatsApp EVOE** (sur le VPS) :
   ```bash
   curl -X POST "http://localhost:8080/instance/create" \
     -H "Content-Type: application/json" \
     -H "apikey: EVOE_SECRET_WHATSAPP_KEY_2026" \
     -d '{"instanceName": "evoe", "qrcode": true}'
   ```

2. **Afficher et Scanner le QR Code** :
   * Le terminal vous retourne une image base64 du QR Code.
   * Ouvrez WhatsApp sur le smartphone de l'établissement $\rightarrow$ *Appareils connectés* $\rightarrow$ *Connecter un appareil* $\rightarrow$ **Scannez le QR Code**.

3. **Renseigner les paramètres dans l'Admin EVOE** :
   Dans l'interface Admin SOS Planète, onglet **Canaux WhatsApp** :
   * **URL de la Passerelle API** : `http://evolution-api:8080/message/sendText/evoe`
   * **Identifiant du Fil Global (Group ID)** : `120363xxx@g.us`
   * Cliquez sur **Enregistrer** !

---

## 🧪 4. Validation & Test Réel
* Dans l'Admin SOS Planète, cliquez sur l'icône **📱 Smartphone** (*Aperçu Smartphone & Test Virtuel*).
* Cliquez sur **"TESTER L'ENVOI RÉEL VERS WHATSAPP"**.
* Le message est instantanément transmis par le conteneur VPS `sos_evolution_api` et livré sur votre vraie application WhatsApp !

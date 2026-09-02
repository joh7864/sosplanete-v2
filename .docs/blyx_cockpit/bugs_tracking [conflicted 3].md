# 🐛 Suivi des Anomalies — sosplanete-v2

Ce document centralise l'ensemble des anomalies et bugs détectés lors des campagnes de recette fonctionnelle et d'intégration.

---

## 📋 Registre des Anomalies

| ID | Date | US | Description | Sévérité | Statut | Date Résolution | Correctif Appliqué |
| :--- | :---: | :---: | :--- | :---: | :---: | :---: | :--- |
| BUG01 | 30/08/2026 | US 9.2 | TST-EVOE-051 : Événement Socket.io `edit_message` non implémenté dans ChatGateway | 🟠 Majeur | done | 31/08/2026 | Implémenté et synchronisé dans `chat.gateway.ts`, `useChatSocket.ts` & `ChatMessageItem.tsx` |
| BUG02 | 30/08/2026 | US 9.2 | TST-EVOE-052 : Événement Socket.io `delete_message` non implémenté dans ChatGateway | 🟠 Majeur | done | 31/08/2026 | Implémenté dans `chat.gateway.ts`, modale de confirmation Cyber-Red dans `ChatPanel.tsx` |

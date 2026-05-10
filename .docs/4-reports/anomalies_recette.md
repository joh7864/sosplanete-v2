# 🛠️ Rapport d'Anomalies - Campagne de Recette V2

Ce document répertorie les anomalies détectées lors de l'exécution automatique de la recette.

| ID | Campagne | Date | Test | Description de l'anomalie | Sévérité | Statut |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **ANO-001** | CAMP-002 | 10/05/2026 | TST-011 | `Unique constraint failed on field (id)` lors de la création d'instance (séquence PG décalée potentiellement) | Haute | 🟢 Résolu |
| **ANO-002** | CAMP-002 | 10/05/2026 | TST-011 | `syncPeriods` échoue silencieusement si `gameEndDate` n'est pas fourni (pas de périodes créées ce qui fait échouer l'import CSV ensuite) | Moyenne | 🟢 Résolu |

| TST-003 | 10/05/2026 | Recette Auto | Le login avec un mauvais mot de passe n'a pas échoué. | Moyenne | 🔴 À corriger |

| TST-005 | 10/05/2026 | Recette Auto | L'accès à /instance sans token a renvoyé un statut 404 au lieu de 401. | Haute | 🔴 À corriger |

# 🛠️ Rapport d'Anomalies - Campagne de Recette V2

Ce document répertorie les anomalies détectées lors de l'exécution automatique de la recette.

| ID | Campagne | Date | Test | Description de l'anomalie | Sévérité | Statut |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **ANO-001** | CAMP-002 | 10/05/2026 | TST-011 | `Unique constraint failed on field (id)` lors de la création d'instance (séquence PG décalée potentiellement) | Haute | 🟢 Résolu |
| **ANO-002** | CAMP-002 | 10/05/2026 | TST-011 | `syncPeriods` échoue silencieusement si `gameEndDate` n'est pas fourni (pas de périodes créées ce qui fait échouer l'import CSV ensuite) | Moyenne | 🟢 Résolu |

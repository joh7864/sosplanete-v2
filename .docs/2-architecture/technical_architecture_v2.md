# 🏗️ Architecture Technique - sos-planete (v2 Avancée)

Ce document décrit la stack technique et l'organisation multi-instances.

## 🚀 Stack Technologique
- **Backend** : NestJS / Prisma / PostgreSQL (Inspiré de Wagmoo).
- **Frontend** : Next.js 15 (Premium Design).

## 📊 Modèle de Données (v2)

```mermaid
erDiagram
    ROLE {
        int id PK
        string name
    }
    ADMIN {
        int id PK
        string email
        string password
        int roleId FK
    }
    INSTANCE {
        int id PK
        string schoolName
        string hostUrl
        int amId FK
    }
    ACTION_REF {
        int id PK
        string referenceName
        float co2
        float water
        float waste
        int year
    }
    LOCAL_ACTION {
        int id PK
        string label
        string description
        int categoryId FK
        int actionRefId FK
        int instanceId FK
    }
    PERIOD {
        int id PK
        datetime startDate
        datetime endDate
        int instanceId FK
    }
    ACTION_DONE {
        int id PK
        datetime createdAt
        int childId FK
        int localActionId FK
        int periodId FK
        float saved_co2
        float saved_water
        float saved_waste
    }

    ADMIN ||--o{ INSTANCE : manages
    INSTANCE ||--o{ LOCAL_ACTION : customizes
    INSTANCE ||--o{ PERIOD : defines
    ACTION_REF ||--o{ LOCAL_ACTION : links_to
    LOCAL_ACTION ||--o{ ACTION_DONE : recorded_as
    PERIOD ||--o{ ACTION_DONE : contains
```

## 🔐 Sécurité & Multi-Instance
- **Isolation** : Chaque AM ne voit que les données de son `INSTANCE_ID`.
- **Mots de passe** : Hachage bcrypt/Argon2 (Standard Wagmoo).
- **Authentification** : JWT avec payload incluant le `role` et le `instanceId`.

## ⚓ Couche de Compatibilité (Legacy Game)
Pour assurer le fonctionnement du jeu vidéo sans modification :
- **Reverse Routing** : Les anciennes routes API (ex: `/api/v1/...`) seront redirigées ou implémentées en miroir dans le nouveau backend.
- **Data Mapping** : Les objets retournés par le nouveau backend respecteront scrupuleusement le format JSON attendu par le jeu original.

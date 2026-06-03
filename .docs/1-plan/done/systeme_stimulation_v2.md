# Plan d'Implémentation Détaillé : Système de Stimulation SOS Planète v2

## Contexte Général

Ce plan couvre la conception et l'implémentation des **3 piliers de stimulation** pour SOS Planète v2 :

1. 🐾 **Les Animaux (Tunnel Adaptatif)** — Progression locale de chaque espace. Les enfants débloquent jusqu'à 9 animaux au fil de l'année scolaire selon leur rythme d'actions.
2. 🏆 **L'Eco-Bar-Race (Classement Inter-Écoles)** — Compétition saine en parallèle entre tous les espaces de toutes les écoles. Stimule la motivation même après avoir débloqué les 9 animaux.
3. 🌡️ **Le Terre-momètre (Impact Global Planétaire)** — Montre comment l'effort collectif de tous les enfants fait baisser la "fièvre" de la planète (de 42°C vers 37°C).

Ces 3 fonctionnalités partagent la même architecture :
- **Backend** (Node.js/Express + Prisma + PostgreSQL) : Calculs et routes API.
- **Frontend Admin** (Next.js) : Configuration et suivi.
- **Application Jeu** : Consommation de l'API et animations.

> [!IMPORTANT]
> L'application jeu ne fait **aucun calcul**. Elle consomme uniquement l'API qui lui retourne des chiffres simples.

> [!IMPORTANT]
> **Déclenchement automatique** : Les calculs des 3 piliers sont déclenchés **automatiquement à 23h59 le dernier jour de chaque période** via un cron job. L'AM n'a pas à intervenir.

---

## Page Paramètres Admin — Nouveaux Onglets

La page Paramètres existante accueillera **2 nouveaux onglets**, dont les valeurs évoluent chaque année scolaire comme les autres paramètres globaux :

### [NEW] Onglet "Paramètres Déblocage Animaux"

| Paramètre | Valeur par défaut | Description |
|---|---|---|
| `avgActionsPerChildPerPeriod` | **8** | Nombre d'actions attendues par enfant par période |
| `animalAdvanceMargin` | **2** | Nombre d'animaux d'avance max (plafond du tunnel) |
| `bienveillanceThreshold` | **40%** | Effort minimum pour le coup de pouce final (dernière période) |

### [NEW] Onglet "Paramètres Terre-momètre"

| Paramètre | Valeur par défaut | Description |
|---|---|---|
| `emissionsParHabitantAn` | **11 tCO2e** | Émissions France par habitant/an (source ADEME, révisable annuellement) |
| `temperatureMalade` | **42°C** | Température "malade" de la planète (scénario BAU à 50 ans) |
| `temperatureSaine` | **37°C** | Température "saine" (objectif) |
| `populationReference` | **68 000 000** | Population de référence pour l'extrapolation mondiale |

---

## PILIER 1 — 🐾 Les Animaux (Tunnel Adaptatif)

### 1.1 — Base de Données

#### [NEW] Modèle `SpaceAnimalUnlock`
```prisma
model SpaceAnimalUnlock {
  id           Int      @id @default(autoincrement())
  spaceId      Int
  period       Int      // Numéro de la période
  periodDate   DateTime // Date de fin de période
  animalsCount Int      // Nombre d'animaux débloqués (0 à 9)
  createdAt    DateTime @default(now())
  space        Space    @relation(fields: [spaceId], references: [id])
}
```

#### [NEW] Modèle `GameConfig` (lié aux onglets Paramètres)
```prisma
model GameConfig {
  id                          Int      @id @default(autoincrement())
  instanceId                  Int      @unique
  avgActionsPerChildPerPeriod Int      @default(8)
  animalAdvanceMargin         Int      @default(2)
  bienveillanceThreshold      Float    @default(0.40)
  emissionsParHabitantAn      Float    @default(11.0)
  temperatureMalade           Float    @default(42.0)
  temperatureSaine            Float    @default(37.0)
  populationReference         Int      @default(68000000)
  instance                    Instance @relation(...)
}
```

### 1.2 — Backend

#### [NEW] `services/animalUnlockService.ts`
```
FONCTION calculerAnimaux(space, periodeActuelle, periodeTotal, config):
  objectif = space.nbEnfants × config.avgActionsPerChildPerPeriod × periodeTotal
  actionsRealisees = SUM(actions validées de l'espace)

  minimum = ARRONDI(9 × periodeActuelle / periodeTotal)
  maximum = minimum + config.animalAdvanceMargin
  animauxMerités = PLANCHER(9 × actionsRealisees / objectif)

  SI periodeActuelle == periodeTotal:
    SI actionsRealisees / objectif >= config.bienveillanceThreshold:
      RETOURNER 9

  RETOURNER RESTREINDRE(animauxMerités, entre minimum et maximum)
```

#### [NEW] Cron Job `jobs/endOfPeriodJob.ts` (23h59 dernier jour de période)
```
POUR CHAQUE instance active:
  POUR CHAQUE espace:
    résultat = calculerAnimaux(...)
    SAUVEGARDER SpaceAnimalUnlock
  calculerClassementEcoBarRace(instance, période)
  calculerTerreThermomètre(instance, période)
```

#### Routes API Animaux

| Méthode | Route | Description |
|---|---|---|
| `GET` | `/api/game/spaces/:id/animals` | `{ animalsUnlocked: 5 }` pour le jeu |
| `GET` | `/api/admin/spaces/:id/animal-history` | Historique complet par période |

### 1.3 — Frontend Admin

#### [NEW] Page "Suivi Jeux" > Onglet "Déblocage Animaux"
- Nombre d'animaux débloqués pour l'espace sélectionné.
- Liste des 9 animaux avec leur statut (débloqué/verrouillé) :
  `Écureuil | Loup | Lion | Ours | Éléphant | Poisson | Thon | Requin | Baleine`
- Barre de progression actions réalisées vs objectif.
- Tableau historique du déblocage période par période.

### 1.4 — Application Jeu

- Appelle `GET /api/game/spaces/:id/animals`.
- Lance l'animation de déblocage si le chiffre a augmenté.
- Affiche la Terre avec le bon nombre d'animaux (0 à 9).

---

## PILIER 2 — 🏆 L'Eco-Bar-Race (Classement Inter-Écoles)

> [!NOTE]
> Le classement est **inter-instances** : toutes les écoles participantes sont comparées entre elles. Chaque espace voit son rang parmi tous les espaces de toutes les écoles.

### 2.1 — Base de Données

#### [MODIFY] Modèle `ActionRef`
```prisma
model ActionRef {
  ...
  co2Impact    Float @default(0) // kg CO2e économisés par action
  waterImpact  Float @default(0) // litres d'eau économisés
  energyImpact Float @default(0) // kWh économisés
  wasteImpact  Float @default(0) // kg déchets évités
}
```

#### [NEW] Modèle `EcoBarRaceSnapshot`
```prisma
model EcoBarRaceSnapshot {
  id         Int      @id @default(autoincrement())
  period     Int
  periodDate DateTime
  rankings   Json     // [{ instanceId, instanceName, co2Total, waterTotal, rank }, ...]
  createdAt  DateTime @default(now())
}
```

### 2.2 — Backend

#### [NEW] `services/ecoBarRaceService.ts`
```
FONCTION calculerClassement(période):
  résultats = []
  POUR CHAQUE instance (école) active:
    co2Total = SUM(actions validées de tous espaces × co2Impact)
    waterTotal = SUM(actions validées × waterImpact)
    résultats.AJOUTER({ instanceId, instanceName, co2Total, waterTotal })
  
  CLASSER résultats par co2Total DESC
  SAUVEGARDER EcoBarRaceSnapshot(période, résultats)
```

#### Routes API Eco-Bar-Race

| Méthode | Route | Description |
|---|---|---|
| `GET` | `/api/game/eco-bar-race/current` | Classement actuel toutes écoles |
| `GET` | `/api/game/eco-bar-race/history` | Historique par période pour l'animation |
| `GET` | `/api/admin/eco-bar-race` | Vue admin détaillée |

### 2.3 — Frontend Admin

#### [NEW] Page "Suivi Jeux" > Onglet "Suivi Graphique"
*(Regroupe l'Eco-Bar-Race ET le Terre-momètre — voir section ci-dessous)*

- Tableau de classement inter-écoles : Rang | École | CO2e | Eau | Énergie.
- Graphique en barres animé (Bar Chart Race) par période.
- Indicateur de progression du rang de l'école courante.

### 2.4 — Application Jeu

#### [NEW] Écran "Eco-Bar-Race"
- Animation Bar Chart Race : barres des espaces s'animent de période en période.
- Indicateur : "🏆 Vous êtes 2ème parmi toutes les écoles !"

---

## PILIER 3 — 🌡️ Le Terre-momètre (Impact Global Planétaire)

### 3.1 — Formule Validée

**Principe :** *"Si tout le monde agissait comme ces enfants, voilà à quelle température serait la Terre dans 50 ans."*

```
# Extrapolation mondiale
co2MoyenParEnfant = co2TotalEspace / nbEnfants
co2Extrapole = co2MoyenParEnfant × populationReference

# Taux de réduction appliqué à la plage de température
tCO2_Mondial_Reference = populationReference × emissionsParHabitantAn
tauxReduction = co2Extrapole / tCO2_Mondial_Reference

# Température finale
temperature = MAX(temperatureSaine, temperatureMalade - tauxReduction × (temperatureMalade - temperatureSaine))
```

> [!NOTE]
> La légère différence avec les données legacy (39.41°C vs notre calcul) est due à un changement de méthodologie de calcul des indicateurs entre l'ancienne et la nouvelle version. La formule ci-dessus est la référence pour la v2.

### 3.2 — Base de Données

#### [NEW] Modèle `TerreThermometerSnapshot`
```prisma
model TerreThermometerSnapshot {
  id               Int      @id @default(autoincrement())
  instanceId       Int
  period           Int
  periodDate       DateTime
  temperatureValue Float    // ex: 39.4 °C
  totalCo2Saved    Float    // en kg CO2e
  nbChildrenPlaying Int
  createdAt        DateTime @default(now())
}
```

### 3.3 — Backend

#### [NEW] `services/terreThermometerService.ts`
```
FONCTION calculerTemperature(instanceId, période, config):
  co2TotalTousEspaces = SUM(toutes actions validées × co2Impact)
  nbEnfants = COUNT(enfants actifs)
  
  co2MoyenParEnfant = co2TotalTousEspaces / nbEnfants
  co2Extrapole = co2MoyenParEnfant × config.populationReference
  tCO2_Reference = config.populationReference × config.emissionsParHabitantAn
  
  tauxReduction = co2Extrapole / tCO2_Reference
  plage = config.temperatureMalade - config.temperatureSaine
  temperature = MAX(config.temperatureSaine, config.temperatureMalade - tauxReduction × plage)
  
  SAUVEGARDER TerreThermometerSnapshot
  RETOURNER { temperature, totalCo2Saved, nbChildrenPlaying }
```

#### Routes API Terre-momètre

| Méthode | Route | Description |
|---|---|---|
| `GET` | `/api/game/instances/:id/terre-thermometer` | Température actuelle + CO2 |
| `GET` | `/api/admin/instances/:id/terre-thermometer` | Vue admin + historique |

### 3.4 — Frontend Admin

#### [NEW] Page "Suivi Jeux" > Onglet "Suivi Graphique"
*(Onglet partagé avec l'Eco-Bar-Race)*

**Section Terre-momètre :**
- Thermomètre visuel avec température actuelle.
- CO2e total économisé + extrapolation mondiale.
- Courbe d'évolution de la température sur toutes les périodes.
- Message : *"Si tout le monde agissait comme vos enfants, la Terre ne ferait que X,X°C de fièvre."*

### 3.5 — Application Jeu

#### [NEW] Animation "Terre-momètre"
> [!NOTE]
> L'animation est **visible en permanence** sur la page Score. Le thermomètre affiche toujours la dernière valeur calculée. Il n'est **mis à jour** (nouvelle valeur + animation de descente) qu'à la fin de chaque période via le cron job.

- Thermomètre animé affichant la température en continu.
- Lors d'une mise à jour de fin de période : animation de descente du mercure + message *"Grâce à vous, la température de la Terre a baissé de 0,2°C !"*.

---

## Architecture Complète de la Page "Suivi Jeux" (Admin)

```
Page "Suivi Jeux"
├── Onglet "Suivi Actions - <espace>"  (EXISTANT — actions réalisées par espace)
├── Onglet "Suivi des indicateurs"     (EXISTANT — indicateurs CO2, eau, énergie)
├── Onglet "Déblocage Animaux"         (NOUVEAU — progression, historique, liste des 9 animaux)
└── Onglet "Suivi Graphique"           (NOUVEAU — Eco-Bar-Race inter-écoles + Terre-momètre)
```

## Séquence d'Affichage dans le Jeu (Fin de Période)

```
1. 🐾 ANIMAUX     → "Vous avez débloqué le Loup !" + animation Terre
2. 🌡️ TERRE-MOMÈTRE → "La température de la Terre a baissé de 0,2°C !" + animation thermomètre
3. 🏆 ECO-BAR-RACE → "Vous êtes 2ème parmi toutes les écoles !" + Bar Chart Race
```

---

## Ordre de Développement Recommandé

### Phase 1 : Fondations BDD, Config & Cron Job (Sprint 1)
- [ ] Créer `GameConfig` (paramètres Animaux + Terre-momètre) + migration Prisma.
- [ ] Ajouter les champs d'impact écologique sur `ActionRef` + migration.
- [ ] Implémenter le **Cron Job** `endOfPeriodJob.ts` (23h59 fin de période).
- [ ] Ajouter l'onglet **"Paramètres Déblocage Animaux"** dans la page Paramètres.
- [ ] Ajouter l'onglet **"Paramètres Terre-momètre"** dans la page Paramètres.

### Phase 2 : Pilier 1 — Animaux (Sprint 2)
- [ ] Créer `SpaceAnimalUnlock` + migration Prisma.
- [ ] Implémenter `animalUnlockService.ts`.
- [ ] Créer les routes API animaux.
- [ ] Créer la section "Animaux" dans la page "Suivi Jeux" de l'admin.
- [ ] Intégrer dans le jeu : écran score + animation déblocage.

### Phase 3 : Pilier 2 — Eco-Bar-Race (Sprint 3)
- [ ] Créer `EcoBarRaceSnapshot` + migration Prisma.
- [ ] Implémenter `ecoBarRaceService.ts`.
- [ ] Créer les routes API classement.
- [ ] Créer l'onglet **"Suivi Graphique"** dans "Suivi Jeux" (section Eco-Bar-Race).
- [ ] Implémenter l'animation Bar Chart Race dans le jeu.

### Phase 4 : Pilier 3 — Terre-momètre (Sprint 4)
- [ ] Créer `TerreThermometerSnapshot` + migration Prisma.
- [ ] Implémenter `terreThermometerService.ts`.
- [ ] Créer les routes API Terre-momètre.
- [ ] Ajouter la section Terre-momètre dans l'onglet "Suivi Graphique".
- [ ] Implémenter l'animation thermomètre (visible en permanence, mis à jour en fin de période).

# Modèle de Calcul des Indicateurs d'Impact (SOSPlanète-v2 & Evoe)

Ce document consigne la méthode de calcul et d'extrapolation mondiale des indicateurs écologiques et planétaires du projet (CO2e, Eau, Déchets, Jour de dépassement et Planètes). 

Le principe de base repose sur l'extrapolation :
*« Si l'humanité entière adoptait le même comportement annuel moyen qu'un joueur de notre groupe, quel serait l'impact global ? »*

Pour obtenir un calcul juste, nous utilisons un **Joueur Virtuel Moyen** (l'économie totale du groupe divisée par le nombre de joueurs) et nous appliquons le calcul en 5 étapes simples ci-dessous.

---

### Étape 1 : Calculer l'économie annuelle de notre « Joueur Moyen »
On prend tout ce que le groupe a économisé réellement depuis le début, on le divise par le nombre de joueurs, et on le ramène sur une année complète (52 semaines) :
*   **CO2 moyen d'un joueur par an** = (Total CO2 économisé par le groupe / Nombre de joueurs) * (52 / Nombre de semaines de jeu) *(en kg/an)*
*   **Eau moyenne d'un joueur par an** = (Total Eau économisé par le groupe / Nombre de joueurs) * (52 / Nombre de semaines de jeu) *(en litres/an)*
*   **Déchets moyens d'un joueur par an** = (Total Déchets économisés par le groupe / Nombre de joueurs) * (52 / Nombre de semaines de jeu) *(en kg/an)*

*Note : Le nombre de semaines de jeu correspond à la durée réelle de la session configurée.*

---

### Étape 2 : Extrapoler à la planète entière (Projection Mondiale)
On imagine que les 8,1 milliards d'habitants de la planète font chacun le même effort annuel que notre joueur moyen. Les unités sont automatiquement converties en tonnes et en mètres cubes (m³) car les volumes mondiaux dépassent largement les 1000 kg/litres :
*   **CO2 projeté mondialement** = CO2 moyen d'un joueur par an * 8 100 000 000 / 1000 *(exprimé en Tonnes/an)*
*   **Eau projetée mondialement** = Eau moyenne d'un joueur par an * 8 100 000 000 / 1000 *(exprimé en m³/an)*
*   **Déchets projetés mondialement** = Déchets moyens d'un joueur par an * 8 100 000 000 / 1000 *(exprimé en Tonnes/an)*

*Note : Le facteur d'influence du foyer (ambassadeur x4) et la division de la population par foyer s'annulant mathématiquement, l'extrapolation mondiale correspond directement à l'effort individuel projeté sur toute la population.*

---

### Étape 3 : Comparer l'effort individuel à l'empreinte de référence d'un humain
On calcule le pourcentage de son empreinte annuelle mondiale que notre joueur moyen est parvenu à économiser par rapport aux moyennes de consommation mondiales de référence (qui sont révisées chaque année en base de données) :
*   **Pourcentage CO2 économisé** = CO2 moyen d'un joueur par an / (Empreinte CO2 annuelle de référence d'un humain * 1000)
*   **Pourcentage Eau économisé** = Eau moyenne d'un joueur par an / Empreinte Eau annuelle de référence d'un humain
*   **Pourcentage Déchets économisé** = Déchets moyens d'un joueur par an / Empreinte Déchets annuelle de référence d'un humain

*(À titre d'exemple, les empreintes de référence individuelles configurées sont de 4,7 tonnes de CO2, 1 385 000 litres d'eau et 270 kg de déchets).*

---

### Étape 4 : Calculer l'Effort Réel Global
On combine ces trois pourcentages selon l'importance écologique relative de chaque indicateur (60% pour le CO2, 20% pour l'Eau, 20% pour les Déchets) :
*   **Effort Réel Global** = (Pourcentage CO2 économisé * 0.60) + (Pourcentage Eau économisé * 0.20) + (Pourcentage Déchets économisé * 0.20)

*(Cette valeur représente fidèlement la réduction d'empreinte individuelle réalisée par notre joueur virtuel).*

---

### Étape 5 : Calculer le besoin en Planètes et le Jour de Dépassement
Afin de refléter la réalité scientifique (la limite de l'impact des éco-gestes quotidiens) et d'éviter une extrapolation irréaliste, un modèle de calcul asymptotique est appliqué.

1. **Plafond d'Actionnabilité Quotidienne** : Les études démontrent que les actions individuelles quotidiennes (sans investissement lourd) ne peuvent réduire l'empreinte globale que de **25% au maximum**. Les 75% restants sont incompressibles à l'échelle individuelle car liés aux infrastructures publiques, industrielles et étatiques.
2. **Courbe d'Effort Asymptotique** : L'effort cumulé des joueurs ne réduit plus l'impact de manière linéaire. Les premiers points marqués ont un impact rapide et gratifiant, mais plus le score monte, plus la courbe s'aplatit pour tendre vers le plafond absolu de 25%.

Les calculs s'opèrent ainsi :
*   **Réduction d'impact sur la Terre** = 0.25 * (1 - Math.exp(-Effort Réel Global * FACTEUR_DE_DIFFICULTE))
*   **Nouveau besoin en Planètes** = Nombre de planètes de base * (1 - Réduction d'impact sur la Terre)
*   **Nouveau jour de dépassement** = 365 / Nouveau besoin en Planètes

*Notes :*
-   *Le **Nombre de planètes de base** (ex: 1,71) est calculé dynamiquement à partir du jour de dépassement de l'année précédente (EOD).*
-   *La nouvelle date s'obtient en ajoutant le nombre de jours calculé au 1er janvier de l'année en cours.*
-   *Le `FACTEUR_DE_DIFFICULTE` (ex: 1.5 ou 2.0) permet de régler la vitesse à laquelle les joueurs atteignent le "plafond de verre" des 25%.*

---

### Étape 6 : Progression Spatiale et Ligne Temporelle (Evoe 2070)
Dans le hub 3D Evoe 2070, la progression des vaisseaux sur la ligne temporelle (de 0 à 100%) ne reflète pas le besoin mondial en planètes, mais **l'effort interne de l'équipe** par rapport à un objectif de jeu parfait.

**Objectif "100%" (Ligne d'arrivée) :**
Pour être réaliste et dynamique, le plafond 100% de la course n'est pas fixe. Il se base sur la règle d'une **« Semaine Type » d'un joueur élite** :
1. On calcule la valeur moyenne en points (1 point = 1g CO2, 1L Eau, 1kg Déchets) d'une action du catalogue local de l'établissement.
2. On fixe l'objectif parfait à **5 actions moyennes réalisées par enfant et par semaine**.
3. **Score 100%** = `(Valeur Action Moyenne × 5) × Nombre d'enfants × Nombre total de semaines de jeu`.

L'avancement d'un vaisseau (en %) est donc le ratio entre les points réels de l'équipe et ce plafond théorique parfait.

**Paliers Technologiques (Niveaux des vaisseaux) :**
Les vaisseaux évoluent en fonction de leur progression en pourcentage sur cette même ligne :
- **N1 - Friction Thermique** : 0% - 19%
- **N2 - Voiles Photovoltaïques** : 20% - 39%
- **N3 - Fusion Magnétique** : 40% - 59%
- **N4 - Résonance Quantique** : 60% - 79%
- **N5 - Singularité Protonique** : 80% - 100%

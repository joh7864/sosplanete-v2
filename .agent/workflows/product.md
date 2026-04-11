---
description: Conception produit pour cadrer, affiner et formaliser un besoin applicatif
---

# 🎨 Workflow : Conception Produit

> [!CAUTION]
> **ZÉRO GÉNÉRATION DE CODE**
> Ce workflow est strictement réservé à la phase de **Conception Produit**.
> - Ne **JAMAIS** générer de code (JS/TS/CSS).
> - Ne **JAMAIS** modifier de fichiers source.
> - L'output attendu est **uniquement documentaire** (Markdown).

## 🏗️ Phase 1 : Analyse du Brief Projet
- Lire et comprendre le brief initial (objectifs business, cible, contraintes, contexte).
- Identifier les zones floues, hypothèses implicites et risques majeurs.
- Extraire les objectifs mesurables (succès produit, KPIs attendus).
- Être synthétique et se concentrer sur l'essentiel.

## 🏗️ Phase 2 : Clarification & Affinage du Besoin
- Proposer une liste de questions structurées pour lever les ambiguïtés.
- Identifier les utilisateurs clés et leurs problématiques principales.
- Définir le périmètre fonctionnel initial (In / Out).
- Formaliser une première vision produit courte et actionnable.

## 🏗️ Phase 3 : Personas & Parcours Clés
- Créer 2 à 4 personas maximum, orientés usage réel.
- Décrire les parcours utilisateurs critiques de bout en bout.
- Identifier les moments de valeur et les points de friction.

## 🏗️ Phase 4 : Architecture Fonctionnelle (Epics)
- Identifier les grands domaines fonctionnels de l’application.
- Regrouper ces domaines sous forme d’Epics fonctionnels.
- Prioriser les Epics selon valeur métier et complexité.

## 🏗️ Phase 5 : Spécifications Détaillées (US)
- Décomposer chaque Epic en User Stories au format standard (*En tant que... / Je veux... / Afin de...*).
- Associer des critères d'acceptation mesurables.
- Préciser les règles de gestion, cas nominaux, alternatifs et d'erreur.

## 📦 Livrables
Les documents suivants doivent être stockés dans `.docs/3-fct/` :
- **`PRD.md`** : Vision, périmètre, personas, epics et KPIs.
- **`functional_specifications.md`** : Arborescence fonctionnelle, US et règles de gestion.
- **`product_summary.md`** : Synthèse courte (Vision, Features clés, Points d'attention).

## ✅ Checklist de Validation
- [ ] Le `PRD.md` est complet et compréhensible sans contexte oral.
- [ ] Les `functional_specifications.md` couvrent tous les parcours critiques.
- [ ] L'identité visuelle (Splash screen, thématique) est esquissée.
- [ ] Le `product_summary.md` est à jour.

## 🔗 Next Step
> Passer à la création des User Stories détaillées avec le workflow **/spec**.
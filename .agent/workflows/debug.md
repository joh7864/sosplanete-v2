---
description: Workflow — Debugging Specification v1.2
---

# 🔍 Workflow : Debugging & Hotfix

> [!IMPORTANT]
> Le debugging est traité comme une discipline d’ingénierie rigoureuse. On observe avant d'interpréter, et on corrige la cause racine, pas le symptôme.

## 🏗️ Phase 1 : Compréhension & Reproduction
- Décrire précisément le comportement observé vs attendu.
- Identifier des étapes de reproduction fiables (idéalement un test automatisé).
- Ne proposer aucun correctif à ce stade.

## 🏗️ Phase 2 : Hypothèses & Investigation
- Produire plusieurs hypothèses falsifiables classées par probabilité.
- Réduire le périmètre par approche binaire.
- Tracer le flux de données jusqu'au point de défaillance.

## 🏗️ Phase 3 : Identification de la Cause Racine
- Utiliser la méthode des "5 Pourquoi".
- Distinguer clairement l'origine du bug de ses effets secondaires.
- Valider l'hypothèse finale par une preuve observable (logs, debugger).

## 🏗️ Phase 4 : Correctif & Non-Régression
- Appliquer le correctif minimal et durable.
- Ajouter ou ajuster des tests pour couvrir ce cas spécifique à l'avenir.
// turbo
```bash
npm run quality
```

## 📦 Livrables
- **`.docs/4-reports/debug-report-v[version].md`** : Rapport détaillé de l'incident.
- **`.docs/4-reports/walkthroughs/walkthrough-debug-fix.md`** : Preuve visuelle du correctif.

## ✅ Checklist de Validation
- [ ] Le bug n'est plus reproductible.
- [ ] Aucun warning ou régression introduits.
- [ ] Test automatisé de non-régression en place.

## 🔗 Next Step
> Clore l'incident et mettre à jour le dashboard avec **/pilotage**.
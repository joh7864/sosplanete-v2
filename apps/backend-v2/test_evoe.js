const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const PROPULSION_THRESHOLDS = [
  { level: 1, percentRequired: 0, name: "Friction Thermique", description: "Charbon / Fioul spatial" },
  { level: 2, percentRequired: 20, name: "Voiles Photovoltaïques", description: "Solaire / Vents Stellaires" },
  { level: 3, percentRequired: 40, name: "Fusion Magnétique", description: "Tokamak / Nucléaire Propre" },
  { level: 4, percentRequired: 60, name: "Résonance Quantique", description: "Énergie du Vide" },
  { level: 5, percentRequired: 80, name: "Singularité Protonique", description: "Trou Noir Artificiel" }
];

async function getDashboardStatus(instanceId, schoolYear) {
  try {
    const teams = await prisma.team.findMany({
      where: {
        instanceYear: {
          instanceId,
          schoolYear
        }
      },
      include: {
        groups: {
          include: {
            children: true
          }
        }
      }
    });

    const instanceYearObj = await prisma.instanceYear.findUnique({
      where: {
        instanceId_schoolYear: { instanceId, schoolYear }
      }
    });
    const gamePeriodsCount = instanceYearObj?.gamePeriodsCount || 40;

    const activePeriod = await prisma.period.findFirst({
      where: {
        instanceYear: {
          instanceId,
          schoolYear
        },
        isOpen: true
      }
    });

    const year = parseInt(schoolYear.split('-')[0], 10);
    const annualData = await prisma.annualImpactData.findUnique({ where: { year } });
    const moyCo2Monde = annualData?.moyCo2Monde ?? 4.7;
    const moyEauMonde = annualData?.moyEauMonde ?? 1385000;
    const moyDechetsMonde = annualData?.moyDechetsMonde ?? 270;

    const localActions = await prisma.localAction.findMany({
      where: { instanceId },
      include: { actionRef: true }
    });

    const catalogMaxCo2Period   = localActions.reduce((s, a) => s + ((a.specificCo2 ?? a.actionRef?.co2Year) ?? 0), 0) / 52;
    const catalogMaxWaterPeriod = localActions.reduce((s, a) => s + ((a.specificWater ?? a.actionRef?.defaultWater) ?? 0), 0);
    const catalogMaxWastePeriod = localActions.reduce((s, a) => s + ((a.specificWaste ?? a.actionRef?.defaultWaste) ?? 0), 0);

    const refCo2Period  = (moyCo2Monde * 1000) / 52;
    const refWaterPeriod = moyEauMonde / 52;
    const refWastePeriod = moyDechetsMonde / 52;

    const maxHealthRatioCo2  = refCo2Period  > 0 ? Math.min(1, catalogMaxCo2Period  / refCo2Period)  : 1;
    const maxHealthRatioWater = refWaterPeriod > 0 ? Math.min(1, catalogMaxWaterPeriod / refWaterPeriod) : 1;
    const maxHealthRatioWaste = refWastePeriod > 0 ? Math.min(1, catalogMaxWastePeriod / refWastePeriod) : 1;
    const maxHealthScore = Math.min(100, Math.round(
      (maxHealthRatioCo2 * 0.60 + maxHealthRatioWater * 0.20 + maxHealthRatioWaste * 0.20) * 100
    )) || 100;

    const formattedTeams = [];
    const allPlayersHealth = [];

    for (const team of teams) {
      const teamImpact = await prisma.actionDone.aggregate({
        where: {
          child: { group: { teamId: team.id } }
        },
        _sum: {
          savedCo2: true,
          savedWater: true,
          savedWaste: true
        }
      });

      const co2 = teamImpact._sum?.savedCo2 || 0;
      const water = teamImpact._sum?.savedWater || 0;
      const waste = teamImpact._sum?.savedWaste || 0;
      const totalPoints = Math.round(co2 + water + waste);

      const teamChildrenCount = team.groups.reduce((acc, g) => acc + g.children.length, 0) || 1;
      const pointsPerChildPerPeriod = catalogMaxCo2Period + catalogMaxWaterPeriod + catalogMaxWastePeriod;
      
      const avgActionPoints = pointsPerChildPerPeriod / Math.max(1, localActions.length);
      const targetPointsPerChildPerPeriod = avgActionPoints * 5;
      const teamTargetPoints = (targetPointsPerChildPerPeriod * gamePeriodsCount * teamChildrenCount) || 5000;
      
      const position = Math.min(100, Number(((totalPoints / teamTargetPoints) * 100).toFixed(1)));

      let calculatedLevel = 1;
      let propTech = PROPULSION_THRESHOLDS[0];
      for (const threshold of PROPULSION_THRESHOLDS) {
        if (position >= threshold.percentRequired) {
          calculatedLevel = threshold.level;
          propTech = threshold;
        }
      }

      const existingTech = await prisma.evoeTeamTechnology.findUnique({
        where: { teamId: team.id }
      });

      let currentMaxLevel = existingTech?.maxLevel || 1;
      if (calculatedLevel > currentMaxLevel) {
        currentMaxLevel = calculatedLevel;
        await prisma.evoeTeamTechnology.upsert({
          where: { teamId: team.id },
          update: { maxLevel: calculatedLevel },
          create: { teamId: team.id, maxLevel: calculatedLevel }
        });
        const matchedTech = PROPULSION_THRESHOLDS.find(t => t.level === currentMaxLevel);
        if (matchedTech) propTech = matchedTech;
      } else if (existingTech) {
        const matchedTech = PROPULSION_THRESHOLDS.find(t => t.level === currentMaxLevel);
        if (matchedTech) propTech = matchedTech;
      }

      let actionsThisPeriod = 0;
      if (activePeriod) {
        actionsThisPeriod = await prisma.actionDone.count({
          where: {
            periodId: activePeriod.id,
            child: { group: { teamId: team.id } }
          }
        });
      }
      const speed = 10 * currentMaxLevel + actionsThisPeriod * 5;

      const children = [];
      team.groups.forEach(g => children.push(...g.children));

      const teamPlayersHealth = [];
      for (const child of children) {
        let health = 0;
        if (activePeriod) {
          const childImpact = await prisma.actionDone.aggregate({
            where: { childId: child.id, periodId: activePeriod.id },
            _sum: { savedCo2: true, savedWater: true, savedWaste: true }
          });
          const childCo2  = childImpact._sum?.savedCo2  ?? 0;
          const childWater = childImpact._sum?.savedWater ?? 0;
          const childWaste = childImpact._sum?.savedWaste ?? 0;

          const rCo2  = refCo2Period  > 0 ? childCo2  / refCo2Period  : 0;
          const rWater = refWaterPeriod > 0 ? childWater / refWaterPeriod : 0;
          const rWaste = refWastePeriod > 0 ? childWaste / refWastePeriod : 0;
          const rawRatio = rCo2 * 0.60 + rWater * 0.20 + rWaste * 0.20;

          const normalized = maxHealthScore > 0 ? rawRatio / (maxHealthScore / 100) : rawRatio;
          health = Math.min(100, Math.round(normalized * 100));
        }
        const ph = {
          childId: child.id,
          pseudo: child.pseudo,
          health
        };
        teamPlayersHealth.push(ph);
        allPlayersHealth.push(ph);
      }

      const crewBioStability = teamPlayersHealth.length > 0
        ? Math.round(teamPlayersHealth.reduce((acc, ph) => acc + ph.health, 0) / teamPlayersHealth.length)
        : 100;

      formattedTeams.push({
        id: team.id,
        name: team.name,
        color: team.color,
        level: currentMaxLevel,
        propulsionType: propTech.name,
        propulsionDesc: propTech.description,
        points: totalPoints,
        speed,
        position,
        crewBioStability
      });
    }

    const globalProgression = formattedTeams.length > 0
      ? Number((formattedTeams.reduce((acc, t) => acc + t.position, 0) / formattedTeams.length).toFixed(1))
      : 0;

    return {
      teams: formattedTeams,
      playersHealth: allPlayersHealth,
      globalProgression
    };
  } catch (error) {
    console.error('ERROR DETECTED:', error);
  }
}

async function run() {
  const status = await getDashboardStatus(10, '2025-2026');
  console.log('RESULT STATUS:', JSON.stringify(status, null, 2));
}

run().finally(() => prisma.$disconnect());

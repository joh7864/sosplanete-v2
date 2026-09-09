const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const hubert = await prisma.child.findFirst({
    where: { pseudo: 'hubert' },
    include: {
      group: {
        include: {
          team: {
            include: {
              instanceYear: {
                include: {
                  periods: { orderBy: { startDate: 'asc' } }
                }
              }
            }
          }
        }
      }
    }
  });

  const childId = hubert.id;
  const team = hubert.group.team;
  const instanceYear = team.instanceYear;
  const periods = instanceYear.periods;

  console.log('=== INSTANCE YEAR ===');
  console.log('ID:', instanceYear.id);
  console.log('Name:', instanceYear.name);
  console.log('easterEggFrequency:', instanceYear.easterEggFrequency);
  console.log('Total periods:', periods.length);

  const frequency = Math.max(1, instanceYear.easterEggFrequency || 2);
  const totalCycles = Math.ceil(periods.length / frequency);
  console.log('Total cycles (2 weeks):', totalCycles);

  const activeCatalog = await prisma.evoeEasterEgg.findMany({
    where: { isActive: true },
    orderBy: { orderIndex: 'asc' },
  });
  console.log('\n=== ACTIVE CATALOG EGGS === (Total:', activeCatalog.length, ')');
  activeCatalog.forEach((e) => {
    console.log(`- ID ${e.id}: "${e.title}" (order: ${e.orderIndex}, reward: ${e.specialReward})`);
  });

  // Instances configured by AM:
  const instances = await prisma.evoeEasterEggInstance.findMany({
    where: { instanceYearId: instanceYear.id },
    include: { easterEgg: true }
  });
  console.log('\n=== EXPLICIT INSTANCES IN DB === (Total:', instances.length, ')');
  instances.forEach((inst) => {
    console.log(`- Instance ${inst.id}: periodStart=${inst.periodStartId}, periodEnd=${inst.periodEndId}, eggId=${inst.easterEggId} ("${inst.easterEgg?.title}")`);
  });

  // Player progress for Hubert
  const hubertProgress = await prisma.evoeEasterEggPlayerProgress.findMany({
    where: { childId },
    include: { easterEgg: true }
  });
  console.log('\n=== HUBERT PROGRESSES IN DB === (Total:', hubertProgress.length, ')');
  hubertProgress.forEach((p) => {
    console.log(`- Egg ${p.easterEggId} ("${p.easterEgg?.title}"): periodId=${p.periodId}, discovered=${p.discoveredAt !== null}`);
  });

  // Team discoveries (all children in team)
  const teamChildren = await prisma.child.findMany({
    where: { group: { teamId: team.id } },
    select: { id: true, pseudo: true }
  });
  const teamChildIds = teamChildren.map(c => c.id);
  console.log('\n=== TEAM 16 CHILDREN ===', teamChildren);

  const allTeamProgress = await prisma.evoeEasterEggPlayerProgress.findMany({
    where: { childId: { in: teamChildIds } },
    include: { easterEgg: true }
  });
  console.log('Total discoveries in team 16:', allTeamProgress.length);

  // Now simulate getChronoEggArchive for each of the 23 cycles:
  const defaultEmptyCycles = new Set([4, 8, 14, 19]);
  let eggCatalogCursor = 0;
  const cycleEggMapping = {};
  for (let cIdx = 1; cIdx <= totalCycles; cIdx++) {
    if (!defaultEmptyCycles.has(cIdx)) {
      if (activeCatalog.length > 0) {
        cycleEggMapping[cIdx] = [activeCatalog[eggCatalogCursor % activeCatalog.length].id];
        eggCatalogCursor++;
      }
    } else {
      cycleEggMapping[cIdx] = [];
    }
  }

  console.log('\n=== SIMULATING ARCHIVE CYCLES ===');
  let countSolved = 0;
  let countHasEgg = 0;
  let countEmpty = 0;
  let countLocked = 0;

  // Let's find current period index:
  const now = new Date('2026-09-09T18:43:00');
  const currentPeriod = periods.find(p => new Date(p.startDate) <= now && new Date(p.endDate) >= now) || periods[periods.length - 1];
  const currentPeriodIndex = periods.findIndex(p => p.id === currentPeriod.id) + 1;
  const currentCycleIndex = Math.floor(Math.max(0, currentPeriodIndex - 1) / frequency) + 1;
  console.log('Current Period Index:', currentPeriodIndex, 'Current Cycle Index:', currentCycleIndex);

  for (let cIdx = 1; cIdx <= totalCycles; cIdx++) {
    const startPIndex = (cIdx - 1) * frequency;
    const endPIndex = Math.min(periods.length - 1, startPIndex + frequency - 1);
    const cyclePeriods = periods.slice(startPIndex, endPIndex + 1);
    const cyclePeriodIds = cyclePeriods.map((p) => p.id);

    const isCurrentCycle = cIdx === currentCycleIndex;
    const isPast = cIdx < currentCycleIndex;
    const isFuture = cIdx > currentCycleIndex;
    const isLocked = isFuture;

    const explicitInstances = instances.filter(i =>
      cyclePeriodIds.includes(i.periodStartId) || cyclePeriodIds.includes(i.periodEndId)
    );

    let eggIds = [];
    let hasEgg = false;

    if (explicitInstances.length > 0) {
      const activeInst = explicitInstances.filter(i => !i.isClosed && i.easterEgg && i.easterEgg.isActive);
      if (activeInst.length > 0) {
        hasEgg = true;
        eggIds = activeInst.map(i => i.easterEggId);
      }
    } else {
      if (!defaultEmptyCycles.has(cIdx) && cycleEggMapping[cIdx]?.length > 0) {
        hasEgg = true;
        eggIds = cycleEggMapping[cIdx];
      }
    }

    let solvedEggs = 0;
    if (hasEgg && eggIds.length > 0) {
      const solvedDistinct = await prisma.evoeEasterEggPlayerProgress.findMany({
        where: {
          easterEggId: { in: eggIds },
          childId: { in: teamChildIds },
          discoveredAt: { not: null },
        },
        distinct: ['easterEggId'],
      });
      solvedEggs = solvedDistinct.length;
    }

    const isCompleted = hasEgg && solvedEggs >= eggIds.length && eggIds.length > 0;

    if (isLocked) countLocked++;
    else if (!hasEgg) countEmpty++;
    else {
      countHasEgg++;
      if (isCompleted) countSolved++;
    }

    const eggObj = activeCatalog.find(e => e.id === eggIds[0]);
    console.log(`Cycle ${cIdx}: hasEgg=${hasEgg} (${eggObj?.title || 'AUCUN'}), status=${isLocked ? 'Verrouillé' : !hasEgg ? 'Sans Egg' : isCompleted ? 'RÉSOLU' : isCurrentCycle ? 'En cours' : 'NON RÉSOLU'}`);
  }

  console.log('\n=== SUMMARY ===');
  console.log(`Total Cycles: ${totalCycles}`);
  console.log(`Cycles Verrouillés (futurs): ${countLocked}`);
  console.log(`Cycles Sans Egg: ${countEmpty}`);
  console.log(`Cycles Passés/En cours Avec Egg: ${countHasEgg}`);
  console.log(`Cycles Résolus: ${countSolved}`);
  console.log(`Cycles Non Résolus: ${countHasEgg - countSolved}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());

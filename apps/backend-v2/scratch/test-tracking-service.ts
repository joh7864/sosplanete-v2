import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function getTrackingStats(instanceId: number, schoolYear: string) {
  const instance = await prisma.instance.findUnique({
    where: { id: instanceId },
  });

  const config = await prisma.gameConfig.findUnique({
    where: { instanceId_schoolYear: { instanceId, schoolYear } }
  });

  const dbPeriods = await prisma.period.findMany({
    where: { instanceId, schoolYear },
    orderBy: { startDate: 'asc' },
  });

  const allPeriodIds = dbPeriods.map(p => p.id);
  const actions = await prisma.actionDone.findMany({
    where: {
      child: { group: { team: { instanceId, schoolYear } } },
      period: { schoolYear },
      periodId: { in: allPeriodIds },
    },
  });

  const activePeriodIds = new Set(actions.map(a => a.periodId));
  const maxPeriodsCount = config?.gamePeriodsCount || 24;
  const periodsToDisplay = dbPeriods.filter((p, index) => 
    index < maxPeriodsCount || activePeriodIds.has(p.id)
  );

  const periodsCount = periodsToDisplay.length;
  
  const periodIdToIndex = new Map<number, number>();
  const periodsHeader = periodsToDisplay.map((p, i) => {
    periodIdToIndex.set(p.id, i);
    return {
      label: `S${i + 1}`,
      start: p.startDate.toISOString(),
      end: p.endDate.toISOString(),
    };
  });

  const allChildren = await prisma.child.findMany({
    where: { group: { team: { instanceId, schoolYear } } },
    include: {
      group: {
        include: { team: true },
      },
    },
  });

  const childrenStats = allChildren.map((child) => {
    const weeks = Array(periodsCount).fill(0);
    let total = 0;

    const childActions = actions.filter((a) => a.childId === child.id);

    childActions.forEach((action) => {
      const weekIndex = periodIdToIndex.get(action.periodId);
      if (weekIndex !== undefined && weekIndex < periodsCount) {
        weeks[weekIndex]++;
        total++;
      }
    });

    return {
      id: child.id,
      pseudo: child.pseudo,
      teamId: child.group.team.id,
      teamName: child.group.team.name,
      groupId: child.group.id,
      groupName: child.group.name,
      avatar: child.avatar,
      weeks,
      total,
    };
  });

  const weeklyTotals = Array(periodsCount).fill(0);
  childrenStats.forEach((c) => {
    c.weeks.forEach((count, i) => {
      weeklyTotals[i] += count;
    });
  });

  return {
    config: {
      startDate: config?.gameStartDate?.toISOString() || new Date(new Date().getFullYear(), 0, 1).toISOString(),
      periodsCount,
    },
    periods: periodsHeader,
    children: childrenStats,
    weeklyTotals,
    grandTotal: weeklyTotals.reduce((a, b) => a + b, 0),
  };
}

async function main() {
  console.log("Fetching tracking stats for Neyron 2024-2025...");
  const data = await getTrackingStats(2, '2024-2025');
  console.log(`Grand Total:`, data.grandTotal);
  console.log(`Periods:`, data.periods.length);
  console.log(`Children:`, data.children.length);
  console.log(`Weekly totals:`, data.weeklyTotals);
}

main().catch(console.error).finally(() => prisma.$disconnect());

import { EasterEggService } from './easter-egg.service';

/**
 * Tests de caractérisation du moteur de cycles (Lot 0 de l'audit v2.3.0).
 * Ils figent le comportement de `resolveEggForInstance` avant tout découpage du service.
 */

interface FakeStore {
  pauseCycles: number[];
  teamRewards: Array<{ teamId: number; easterEggId: number }>;
  progresses: Array<{
    id: number;
    easterEggId: number;
    childId: number;
    periodId: number;
    discoveredAt: Date | null;
    firstInteractionAt: Date | null;
  }>;
  actions: any[];
}

const CHILD_ID = 10;
const TEAM_ID = 1;

const makeEgg = (id: number, overrides: Record<string, unknown> = {}) => ({
  id,
  code: `EE_${id}`,
  title: `Egg ${id}`,
  isActive: true,
  orderIndex: id,
  prerequisiteType: 'NONE',
  prerequisiteConfig: null,
  hintDelayMinutes: 120,
  ...overrides,
});

const makePeriods = (n: number) => Array.from({ length: n }, (_, i) => ({ id: i + 1 }));

function buildFakePrisma(store: FakeStore, eggs: any[]) {
  const matchProgress = (p: FakeStore['progresses'][number], where: any = {}) =>
    (where.easterEggId === undefined || p.easterEggId === where.easterEggId) &&
    (where.childId === undefined || p.childId === where.childId) &&
    (!where.discoveredAt || p.discoveredAt !== null) &&
    (!where.periodId?.in || where.periodId.in.includes(p.periodId));

  return {
    instanceYear: {
      findUnique: async () => ({ easterEggPauseCycles: store.pauseCycles }),
    },
    child: {
      findUnique: async () => ({ group: { teamId: TEAM_ID } }),
    },
    evoeEasterEggInstance: {
      findMany: async () => [],
      findFirst: async () => null,
    },
    evoeEasterEggTeamReward: {
      findFirst: async ({ where }: any) =>
        store.teamRewards.find(
          (r) => r.teamId === where.teamId && r.easterEggId === where.easterEggId,
        ) || null,
    },
    evoeEasterEggPlayerProgress: {
      findFirst: async ({ where }: any) =>
        [...store.progresses].sort((a, b) => b.id - a.id).find((p) => matchProgress(p, where)) ||
        null,
      findMany: async ({ where }: any) =>
        store.progresses
          .filter((p) => matchProgress(p, where))
          .map((p) => ({ ...p, easterEgg: eggs.find((e) => e.id === p.easterEggId) })),
    },
    actionDone: {
      findMany: async () => store.actions,
    },
  };
}

function setup(options: { periods?: number; eggs?: any[]; store?: Partial<FakeStore> } = {}) {
  const eggs = options.eggs ?? [makeEgg(1), makeEgg(2), makeEgg(3)];
  const store: FakeStore = {
    pauseCycles: [],
    teamRewards: [],
    progresses: [],
    actions: [],
    ...options.store,
  };
  const service = new EasterEggService(buildFakePrisma(store, eggs) as any, {} as any);
  const periods = makePeriods(options.periods ?? 6);
  const resolve = (currentPeriodIndex: number, frequency = 2) =>
    (service as any).resolveEggForInstance(
      1,
      periods,
      currentPeriodIndex,
      frequency,
      eggs,
      CHILD_ID,
    );
  return { service, store, resolve };
}

describe('EasterEggService.resolveEggForInstance - caractérisation', () => {
  it('cycle 1 : sélectionne l’œuf naturel du cycle sans report', async () => {
    const { resolve } = setup();
    const res = await resolve(1);

    expect(res.cycleIndex).toBe(0);
    expect(res.currentEgg?.id).toBe(1);
    expect(res.cycleEggs?.map((d: any) => d.egg.id)).toEqual([1]);
    expect(res.unsolvedRolloverCount).toBe(1);
    expect(res.showRolloverWarning).toBe(false);
  });

  it('les deux périodes d’un même cycle partagent le même œuf', async () => {
    const { resolve } = setup();
    const p1 = await resolve(1);
    const p2 = await resolve(2);

    expect(p1.cycleIndex).toBe(p2.cycleIndex);
    expect(p2.currentEgg?.id).toBe(1);
  });

  it('cycle 2 : reporte l’œuf non résolu du cycle 1, le plus ancien en premier', async () => {
    const { resolve } = setup();
    const res = await resolve(3);

    expect(res.cycleIndex).toBe(1);
    expect(res.cycleEggs?.map((d: any) => d.egg.id)).toEqual([1, 2]);
    expect(res.currentEgg?.id).toBe(1);
    expect(res.cycleEggs?.[0].isRollover).toBe(true);
    expect(res.cycleEggs?.[1].isRollover).toBe(false);
    expect(res.unsolvedRolloverCount).toBe(2);
  });

  it('un œuf déjà récompensé pour l’équipe n’est plus reporté', async () => {
    const { resolve } = setup({ store: { teamRewards: [{ teamId: TEAM_ID, easterEggId: 1 }] } });
    const res = await resolve(3);

    expect(res.cycleEggs?.map((d: any) => d.egg.id)).toEqual([2]);
    expect(res.currentEgg?.id).toBe(2);
  });

  it('un œuf résolu par le joueur n’est plus à résoudre', async () => {
    const { resolve } = setup({
      store: {
        progresses: [
          {
            id: 1,
            easterEggId: 1,
            childId: CHILD_ID,
            periodId: 1,
            discoveredAt: new Date(),
            firstInteractionAt: new Date(),
          },
        ],
      },
    });
    const res = await resolve(3);

    expect(res.cycleEggs?.map((d: any) => d.egg.id)).toEqual([2]);
  });

  it('cycle de pause : aucun œuf naturel, seuls les reports restent', async () => {
    const { resolve } = setup({ store: { pauseCycles: [2] } });
    const res = await resolve(3);

    expect(res.cycleIndex).toBe(1);
    expect(res.cycleEggs?.map((d: any) => d.egg.id)).toEqual([1]);
    expect(res.cycleEggs?.[0].isRollover).toBe(true);
  });

  it('accumulation : showRolloverWarning uniquement au-delà de 4 œufs en attente', async () => {
    const eggs = [1, 2, 3, 4, 5, 6, 7, 8].map((id) => makeEgg(id));
    // pauseCycles explicite hors saison : neutralise la proposition de pauses par défaut
    const { resolve } = setup({ eggs, periods: 12, store: { pauseCycles: [99] } });

    const cycle5 = await resolve(9); // cycle index 4 → 5 œufs non résolus
    expect(cycle5.unsolvedRolloverCount).toBe(5);
    expect(cycle5.showRolloverWarning).toBe(true);

    const cycle4 = await resolve(7); // cycle index 3 → 4 œufs non résolus
    expect(cycle4.unsolvedRolloverCount).toBe(4);
    expect(cycle4.showRolloverWarning).toBe(false);
  });

  describe('prérequis', () => {
    const lockedEgg = (id: number) =>
      makeEgg(id, {
        prerequisiteType: 'MISSIONS_COUNT',
        prerequisiteConfig: { count: 3, distinctSectors: 2 },
      });

    it('œuf verrouillé : non interactif, aucun œuf accessible', async () => {
      const { resolve } = setup({ eggs: [lockedEgg(1), lockedEgg(2), lockedEgg(3)] });
      const res = await resolve(1);

      expect(res.hasAnyInteractable).toBe(false);
      expect(res.currentEgg).toBeNull();
      expect(res.cycleEggs).toEqual([]);
    });

    it('œuf verrouillé : reste inaccessible tant que le prérequis n’est pas satisfait (même avec interaction passée)', async () => {
      const { resolve } = setup({
        eggs: [lockedEgg(1), lockedEgg(2), lockedEgg(3)],
        store: {
          progresses: [
            {
              id: 1,
              easterEggId: 1,
              childId: CHILD_ID,
              periodId: 1,
              discoveredAt: null,
              firstInteractionAt: new Date(),
            },
          ],
        },
      });
      const res = await resolve(3);

      expect(res.hasAnyInteractable).toBe(false);
      expect(res.currentEgg).toBeNull();
      expect(res.cycleEggs).toEqual([]);
    });
  });

  describe('indice explicite', () => {
    it('visible après le délai configuré depuis la première interaction', async () => {
      const longAgo = new Date(Date.now() - 3 * 60 * 60 * 1000);
      const { resolve } = setup({
        store: {
          progresses: [
            {
              id: 1,
              easterEggId: 1,
              childId: CHILD_ID,
              periodId: 1,
              discoveredAt: null,
              firstInteractionAt: longAgo,
            },
          ],
        },
      });
      const res = await resolve(1);

      expect(res.cycleEggs?.[0].isExplicitHintVisible).toBe(true);
    });

    it('masqué avant l’expiration du délai', async () => {
      const { resolve } = setup({
        store: {
          progresses: [
            {
              id: 1,
              easterEggId: 1,
              childId: CHILD_ID,
              periodId: 1,
              discoveredAt: null,
              firstInteractionAt: new Date(),
            },
          ],
        },
      });
      const res = await resolve(1);

      expect(res.cycleEggs?.[0].isExplicitHintVisible).toBe(false);
    });
  });
});

describe('EasterEggService.checkPrerequisites - caractérisation', () => {
  const run = (egg: any, actions: any[] = []) => {
    const { service } = setup({ store: { actions } });
    return (service as any).checkPrerequisites(egg, CHILD_ID, [1, 2]);
  };

  const action = (categoryId: number) => ({
    localAction: { categoryId, actionRef: null },
  });

  it('NONE : toujours satisfait', async () => {
    await expect(run({ prerequisiteType: 'NONE' })).resolves.toBe(true);
  });

  it('MISSIONS_COUNT : exige le nombre d’actions ET de secteurs distincts', async () => {
    const egg = {
      prerequisiteType: 'MISSIONS_COUNT',
      prerequisiteConfig: { count: 3, distinctSectors: 2 },
    };
    await expect(run(egg, [action(1), action(1), action(1)])).resolves.toBe(false);
    await expect(run(egg, [action(1), action(2)])).resolves.toBe(false);
    await expect(run(egg, [action(1), action(2), action(2)])).resolves.toBe(true);
  });

  it('MISSIONS_COUNT sans configuration : valeurs par défaut (3 actions, 2 secteurs)', async () => {
    const egg = { prerequisiteType: 'MISSIONS_COUNT', prerequisiteConfig: {} };
    await expect(run(egg, [action(1), action(2), action(3)])).resolves.toBe(true);
    await expect(run(egg, [action(1), action(2)])).resolves.toBe(false);
  });
});

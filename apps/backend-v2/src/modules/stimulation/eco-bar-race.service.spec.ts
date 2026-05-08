import { Test, TestingModule } from '@nestjs/testing';
import { EcoBarRaceService } from './eco-bar-race.service';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * Tests unitaires pour EcoBarRaceService
 *
 * Flux critiques couverts :
 *  1. calculateRankingsForPeriod : snapshotDate locale par instance (pas partagée)
 *  2. calculateRankingsForPeriod : classement par co2Total descendant
 *  3. recalculateAllHistory : utilise le nombre réel de périodes (pas 43 hardcodé)
 *  4. recalculateAllHistory : annule si aucune GameConfig trouvée
 *  5. recalculateAllHistory : supprime les snapshots orphelins au-delà du max réel
 */
describe('EcoBarRaceService', () => {
  let service: EcoBarRaceService;
  let prisma: jest.Mocked<PrismaService>;

  const SCHOOL_YEAR = '2024-2025';

  const makeDate = (offset: number) => {
    const d = new Date('2024-10-01');
    d.setDate(d.getDate() + offset);
    return d;
  };

  beforeEach(async () => {
    const prismaMock = {
      instance: {
        findMany: jest.fn().mockResolvedValue([
          { id: 1, schoolName: 'École A', icon: '🌿' },
          { id: 2, schoolName: 'École B', icon: '🌊' },
        ]),
      },
      period: {
        findMany: jest.fn().mockImplementation(({ where }) => {
          if (where.instanceId === 1) {
            return Promise.resolve([
              { id: 10, startDate: makeDate(0), endDate: makeDate(6) },
            ]);
          }
          if (where.instanceId === 2) {
            return Promise.resolve([
              { id: 20, startDate: makeDate(7), endDate: makeDate(13) },
            ]);
          }
          return Promise.resolve([]);
        }),
      },
      actionDone: {
        aggregate: jest.fn().mockImplementation(({ where }) => {
          if (where.child.group.team.instanceId === 1) {
            return Promise.resolve({ _sum: { savedCo2: 100, savedWater: 200, savedWaste: 50, savedEnergy: 30 } });
          }
          return Promise.resolve({ _sum: { savedCo2: 150, savedWater: 100, savedWaste: 80, savedEnergy: 20 } });
        }),
      },
      ecoBarRaceSnapshot: {
        findFirst: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockResolvedValue({ id: 99 }),
        update: jest.fn().mockResolvedValue({ id: 99 }),
        deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
      },
      gameConfig: {
        findMany: jest.fn().mockResolvedValue([
          { gamePeriodsCount: 24 },
          { gamePeriodsCount: 20 },
        ]),
      },
    } as unknown as jest.Mocked<PrismaService>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EcoBarRaceService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    service = module.get<EcoBarRaceService>(EcoBarRaceService);
    prisma = module.get(PrismaService);
  });

  // ─────────────────────────────────────────────
  // SCÉNARIO 1 : snapshotDate locale (pas partagée)
  // ─────────────────────────────────────────────
  it('1. calculateRankingsForPeriod : chaque instance a sa propre snapshotDate', async () => {
    await service.calculateRankingsForPeriod(1, SCHOOL_YEAR);

    // Le snapshot créé doit avoir une date (pas undefined/null)
    const createCall = (prisma.ecoBarRaceSnapshot.create as jest.Mock).mock.calls[0]?.[0];
    expect(createCall?.data?.periodDate).toBeDefined();
    expect(createCall?.data?.periodDate).toBeInstanceOf(Date);
  });

  // ─────────────────────────────────────────────
  // SCÉNARIO 2 : Classement par CO2 descendant
  // ─────────────────────────────────────────────
  it('2. calculateRankingsForPeriod : classe les écoles par co2Total décroissant', async () => {
    await service.calculateRankingsForPeriod(1, SCHOOL_YEAR);

    const createCall = (prisma.ecoBarRaceSnapshot.create as jest.Mock).mock.calls[0]?.[0];
    const rankings: any[] = createCall?.data?.rankings;

    expect(rankings).toBeDefined();
    expect(rankings.length).toBe(2);
    // École B (150 CO2) doit être devant École A (100 CO2)
    expect(rankings[0].instanceId).toBe(2);
    expect(rankings[0].rank).toBe(1);
    expect(rankings[1].instanceId).toBe(1);
    expect(rankings[1].rank).toBe(2);
  });

  // ─────────────────────────────────────────────
  // SCÉNARIO 3 : Nombre réel de périodes
  // ─────────────────────────────────────────────
  it('3. recalculateAllHistory : boucle sur le max réel (24), pas sur 43 hardcodé', async () => {
    await service.recalculateAllHistory(SCHOOL_YEAR);

    // calculateRankingsForPeriod doit avoir été appelé exactement 24 fois (max des configs)
    // Pour vérifier ça, on espie les appels à prisma.period.findMany
    const periodFindManyCalls = (prisma.period.findMany as jest.Mock).mock.calls;
    // 24 périodes × 2 instances = 48 appels à period.findMany
    expect(periodFindManyCalls.length).toBe(48);
  });

  // ─────────────────────────────────────────────
  // SCÉNARIO 4 : Annulation si aucune config
  // ─────────────────────────────────────────────
  it('4. recalculateAllHistory : retourne [] si aucune GameConfig', async () => {
    (prisma.gameConfig.findMany as jest.Mock).mockResolvedValue([]);

    const result = await service.recalculateAllHistory(SCHOOL_YEAR);

    expect(result).toEqual([]);
    // Aucune période ne doit être cherchée
    expect(prisma.period.findMany).not.toHaveBeenCalled();
  });

  // ─────────────────────────────────────────────
  // SCÉNARIO 5 : Nettoyage des snapshots orphelins
  // ─────────────────────────────────────────────
  it('5. recalculateAllHistory : supprime les snapshots au-delà du max réel', async () => {
    await service.recalculateAllHistory(SCHOOL_YEAR);

    expect(prisma.ecoBarRaceSnapshot.deleteMany).toHaveBeenCalledWith({
      where: { schoolYear: SCHOOL_YEAR, period: { gt: 24 } },
    });
  });
});

import { Test, TestingModule } from '@nestjs/testing';
import { EvoeService } from './evoe.service';
import { PrismaService } from '../../../prisma/prisma.service';
import { LegacyApiService } from '../../legacy-api/legacy-api.service';
import { ImpactService } from '../../impact/impact.service';
import { ChatGateway } from '../chat.gateway';

describe('EvoeService', () => {
  let service: EvoeService;
  let prisma: jest.Mocked<PrismaService>;
  let impactService: jest.Mocked<ImpactService>;
  let legacyApiService: jest.Mocked<LegacyApiService>;

  beforeEach(async () => {
    const prismaMock = {
      localAction: {
        findMany: jest.fn().mockResolvedValue([
          {
            id: 1,
            label: 'Baisser le chauffage',
            description: 'Description 1',
            categoryId: 10,
            category: { name: 'Energie' },
            actionRef: {
              co2Year: 12,
              defaultCo2: 0.23,
              defaultWater: 50,
              defaultWaste: 0.1,
              image: 'temp.png',
            },
            evoeMission: {
              titreSF: 'Mission : Bouclier',
              descriptionSF: 'Desc SF',
              pointsGagnes: 20,
              isHacked: false,
            },
          },
        ]),
      },
      instanceYear: {
        findUnique: jest.fn().mockResolvedValue({ gamePeriodsCount: 40 }),
      },
      gameConfig: {
        findFirst: jest
          .fn()
          .mockResolvedValue({ avgActionsPerChildPerPeriod: 8 }),
        findUnique: jest
          .fn()
          .mockResolvedValue({ avgActionsPerChildPerPeriod: 8, gamePeriodsCount: 40 }),
      },
      evoeChallenge: {
        findMany: jest.fn().mockResolvedValue([]),
      },
      team: {
        findMany: jest.fn().mockResolvedValue([
          {
            id: 100,
            name: 'Vaisseau Alpha',
            color: '#ff0000',
            groups: [
              {
                id: 200,
                children: [
                  { id: 300, pseudo: 'Guardian 1' },
                  { id: 301, pseudo: 'Guardian 2' },
                ],
              },
            ],
          },
        ]),
      },
      period: {
        findFirst: jest.fn().mockResolvedValue({ id: 50, isOpen: true }),
        findUnique: jest.fn().mockResolvedValue({
          id: 50,
          isOpen: true,
          startDate: new Date(Date.now() - 3 * 24 * 3600 * 1000),
          endDate: new Date(Date.now() + 4 * 24 * 3600 * 1000),
        }),
      },
      actionDone: {
        findMany: jest.fn().mockResolvedValue([
          {
            id: 10,
            childId: 300,
            localActionId: 1,
            savedCo2: 1,
            savedWater: 2,
            savedWaste: 0.5,
            localAction: {
              id: 1,
              actionRef: { co2Year: 12 },
            },
          },
        ]),
        aggregate: jest.fn().mockResolvedValue({
          // Low values so that calculatedLevel is 1, but it stays at mock level 2
          _sum: { savedCo2: 1.0, savedWater: 2.0, savedWaste: 0.5 },
        }),
        count: jest.fn().mockImplementation(({ where }) => {
          if (where.childId === 300) return Promise.resolve(3); // 100% health (3 actions)
          if (where.childId === 301) return Promise.resolve(0); // 0% health
          return Promise.resolve(2); // default
        }),
        groupBy: jest.fn().mockResolvedValue([
          {
            childId: 300,
            _sum: { savedCo2: 10, savedWater: 20, savedWaste: 5 },
          },
          { childId: 301, _sum: { savedCo2: 0, savedWater: 0, savedWaste: 0 } },
        ]),
      },
      evoeTeamTechnology: {
        findUnique: jest.fn().mockResolvedValue({ maxLevel: 2 }), // already at N2 solar sails
        upsert: jest.fn().mockResolvedValue({ maxLevel: 3 }),
      },
      annualImpactData: {
        findUnique: jest.fn().mockResolvedValue({
          moyCo2Monde: 4.7,
          moyEauMonde: 1385000,
          moyDechetsMonde: 270,
        }),
      },
    } as unknown as jest.Mocked<PrismaService>;

    const legacyApiMock = {
      getChildFromAuth: jest.fn().mockResolvedValue({
        id: 300,
        pseudo: 'Guardian 1',
        group: {
          team: {
            instanceYear: {
              instanceId: 1,
              id: 2,
              schoolYear: '2024-2025',
            },
          },
        },
      }),
    } as unknown as jest.Mocked<LegacyApiService>;

    const impactMock = {
      calculateImpact: jest.fn().mockResolvedValue({
        sums: { totalCo2: 5, totalWater: 1000000, totalWaste: 500 },
        realSums: { totalCo2: 5, totalWater: 1000000, totalWaste: 500 },
        results: {
          nbPlanetes: 1.5,
          dateDepassement: '15/09/2026',
          dateDepassementSans: '10/08/2026',
        },
      }),
    } as unknown as jest.Mocked<ImpactService>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EvoeService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: LegacyApiService, useValue: legacyApiMock },
        { provide: ImpactService, useValue: impactMock },
        { provide: ChatGateway, useValue: {} },
      ],
    }).compile();

    service = module.get<EvoeService>(EvoeService);
    prisma = module.get(PrismaService);
    impactService = module.get(ImpactService);
    legacyApiService = module.get(LegacyApiService);
  });

  it('should format missions with science fiction names and details', async () => {
    const result = await service.getMissions(1, '2024-2025');
    expect(result.length).toBe(1);
    expect(result[0].evoeMission).toBeDefined();
    expect(result[0].evoeMission!.titreSF).toBe('Mission : Bouclier');
    expect(result[0].categorySF).toBe('Secteur Énergétique & Plasma');
  });

  it('should fetch and calculate extrapolation metrics correctly', async () => {
    const result = await service.getExtrapolationMetrics('Basic test', '1');
    expect(impactService.calculateImpact).toHaveBeenCalledWith('2024-2025', 1);
    expect(result.nbPlanetes).toBe(1.5);
    expect(result.dateDepassement).toBe('15/09/2026');
    // CO2 = 5 tonnes. Ice = 5 * 3000 = 15000 kg. Forest = 5 / 3.5 = 1.428...
    expect(result.iceSavedKg).toBe(15000);
    expect(result.forestFootballFields).toBeCloseTo(1.428, 2);
    // Water = 1M Litres. Pools = 1M / 2.5M = 0.4 pools.
    expect(result.waterOlympicPools).toBe(0.4);
    // Waste = 500 kg. Trucks = 500 / 10000 = 0.05.
    expect(result.wasteGarbageTrucks).toBe(0.05);
  });

  it('should calculate vessel race status and maintain permanent propulsion level', async () => {
    const result = await service.getDashboardStatus(1, '2024-2025');
    expect(result.teams.length).toBe(1);
    expect(result.teams[0].level).toBe(2); // Stays at 2 (Mock value)
    expect(result.teams[0].propulsionType).toBe('Voiles Photovoltaïques');
  });

  it('should upgrade propulsion level irreversibly if calculated level is higher than max level', async () => {
    // Mock team to return very high savings to qualify for higher level (level 5)
    (prisma.actionDone.aggregate as jest.Mock).mockResolvedValue({
      _sum: { savedCo2: 10000, savedWater: 500000, savedWaste: 2000 },
    });
    // Existing tech maxLevel = 2
    (prisma.evoeTeamTechnology.findUnique as jest.Mock).mockResolvedValue({
      maxLevel: 2,
    });

    const result = await service.getDashboardStatus(1, '2024-2025');
    expect(result.teams[0].level).toBe(5); // Upgraded to 5 (from calculated level)
    expect(result.teams[0].propulsionType).toBe('Singularité Protonique'); // level 5 propulsion
    expect(prisma.evoeTeamTechnology.upsert).toHaveBeenCalledWith({
      where: { teamId: 100 },
      update: { maxLevel: 5 },
      create: { teamId: 100, maxLevel: 5 },
    });
  });

  it('should apply HP decay based on elapsed period time and regeneration from actions', async () => {
    // 1. Début de période (ratio = 0)
    (prisma.period.findUnique as jest.Mock).mockResolvedValue({
      id: 50,
      isOpen: true,
      startDate: new Date(Date.now()),
      endDate: new Date(Date.now() + 7 * 24 * 3600 * 1000),
    });
    const resultStart = await service.getDashboardStatus(1, '2024-2025');
    expect(resultStart.topPlayers.length).toBeGreaterThan(0);
    const guardianStartHealth = resultStart.playersHealth.find(p => p.childId === 300)?.health;
    expect(guardianStartHealth).toBe(100); // capped at 100

    // 2. Fin de période (ratio = 1.0)
    (prisma.period.findUnique as jest.Mock).mockResolvedValue({
      id: 50,
      isOpen: true,
      startDate: new Date(Date.now() - 7 * 24 * 3600 * 1000),
      endDate: new Date(Date.now()),
    });
    const resultEnd = await service.getDashboardStatus(1, '2024-2025');
    const guardianEndHealth = resultEnd.playersHealth.find(p => p.childId === 300)?.health;
    // With max decay (85) and some regen from actions, it should be lower than 100
    expect(guardianEndHealth).toBeLessThan(100);
  });
});

import { Test, TestingModule } from '@nestjs/testing';
import { EvoeService } from './evoe.service';
import { PrismaService } from '../../../prisma/prisma.service';
import { LegacyApiService } from '../../legacy-api/legacy-api.service';
import { ImpactService } from '../../impact/impact.service';

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
            actionRef: { co2Year: 12, image: 'temp.png' },
            evoeMission: { titreSF: 'Mission : Bouclier', descriptionSF: 'Desc SF', pointsGagnes: 20, isHacked: false }
          }
        ])
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
                  { id: 301, pseudo: 'Guardian 2' }
                ]
              }
            ]
          }
        ])
      },
      period: {
        findFirst: jest.fn().mockResolvedValue({ id: 50, isOpen: true })
      },
      actionDone: {
        aggregate: jest.fn().mockResolvedValue({
          _sum: { savedCo2: 1000, savedWater: 500, savedWaste: 200 }
        }),
        count: jest.fn().mockImplementation(({ where }) => {
          if (where.childId === 300) return Promise.resolve(3); // 100% health (3 actions)
          if (where.childId === 301) return Promise.resolve(0); // 0% health
          return Promise.resolve(2); // default
        })
      },
      evoeTeamTechnology: {
        findUnique: jest.fn().mockResolvedValue({ maxLevel: 2 }), // already at N2 solar sails
        upsert: jest.fn().mockResolvedValue({ maxLevel: 3 })
      }
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
              schoolYear: '2024-2025'
            }
          }
        }
      })
    } as unknown as jest.Mocked<LegacyApiService>;

    const impactMock = {
      calculateImpact: jest.fn().mockResolvedValue({
        sums: { totalCo2: 5, totalWater: 1000000, totalWaste: 500 },
        results: { nbPlanetes: 1.5, dateDepassement: '15/09/2026', dateDepassementSans: '10/08/2026' }
      })
    } as unknown as jest.Mocked<ImpactService>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EvoeService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: LegacyApiService, useValue: legacyApiMock },
        { provide: ImpactService, useValue: impactMock }
      ]
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
    // team totalScore = 1000 + 500 + 200 = 1700. Threshold N2 = 1000, N3 = 3000.
    // So calculatedLevel = 2. But existingTech.maxLevel = 2.
    // Max level does not increase or regress, stays at 2.
    const result = await service.getDashboardStatus(1, '2024-2025');
    expect(result.teams.length).toBe(1);
    expect(result.teams[0].level).toBe(2); // Stays at 2
    expect(result.teams[0].propulsionType).toBe('Voiles Photovoltaïques');
    expect(result.teams[0].crewBioStability).toBe(50); // average of child 300 (100) and child 301 (0)

    // Verify individual player healths
    expect(result.playersHealth.length).toBe(2);
    expect(result.playersHealth.find(p => p.childId === 300)!.health).toBe(100);
    expect(result.playersHealth.find(p => p.childId === 301)!.health).toBe(0);
  });

  it('should upgrade propulsion level irreversibly if calculated level is higher than max level', async () => {
    // Mock team totalScore to qualify for N3 (Fusion Magnétique) by returning higher action sums
    (prisma.actionDone.aggregate as jest.Mock).mockResolvedValue({
      _sum: { savedCo2: 2500, savedWater: 1000, savedWaste: 500 } // sum = 4000 (qualifies for N3)
    });
    // Existing tech maxLevel = 2
    (prisma.evoeTeamTechnology.findUnique as jest.Mock).mockResolvedValue({ maxLevel: 2 });

    const result = await service.getDashboardStatus(1, '2024-2025');
    expect(result.teams[0].level).toBe(3); // Upgraded to 3
    expect(result.teams[0].propulsionType).toBe('Fusion Magnétique');
    expect(prisma.evoeTeamTechnology.upsert).toHaveBeenCalledWith({
      where: { teamId: 100 },
      update: { maxLevel: 3 },
      create: { teamId: 100, maxLevel: 3 }
    });
  });
});

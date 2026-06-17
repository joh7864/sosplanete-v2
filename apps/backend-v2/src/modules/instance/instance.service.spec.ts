import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException } from '@nestjs/common';
import { InstanceService } from './instance.service';
import { PrismaService } from '../../prisma/prisma.service';
import { PeriodService } from '../period/period.service';
import { InstanceCleanupService } from './instance-cleanup.service';

/**
 * Tests unitaires pour InstanceService.syncPeriods (via update)
 *
 * Flux critiques couverts :
 *  1. save → OK (pas de conflit, périodes créées)
 *  2. save → 409 Conflict (réduction de dates avec actions existantes, sans force)
 *  3. save → force=true (réduction acceptée, actions supprimées)
 *  4. save → annuler (transaction rollback : aucune mutation persistée)
 */
describe('InstanceService — syncPeriods', () => {
  let service: InstanceService;
  let prisma: jest.Mocked<PrismaService>;

  // --- Mock helpers ---

  /** Fabrique un mock Prisma client de transaction. */
  const makeTxMock = (overrides: Partial<any> = {}) => ({
    instance: {
      update: jest.fn().mockResolvedValue({ id: 1, isOpen: true }),
      findUnique: jest
        .fn()
        .mockResolvedValue({ id: 1, currentSchoolYear: '2024-2025' }),
    },
    instanceYear: {
      findUnique: jest.fn().mockResolvedValue({
        id: 1,
        instanceId: 1,
        schoolYear: '2024-2025',
        isOpen: true,
      }),
      update: jest.fn().mockResolvedValue({
        id: 1,
        instanceId: 1,
        schoolYear: '2024-2025',
        isOpen: true,
      }),
    },
    gameConfig: {
      upsert: jest.fn().mockResolvedValue({}),
      findUnique: jest.fn().mockResolvedValue({
        gameStartDate: new Date('2024-09-04'),
        gameEndDate: new Date('2024-10-16'), // 6 semaines
        gamePeriodsCount: 6,
      }),
    },
    period: {
      findMany: jest.fn().mockResolvedValue([]),
      create: jest.fn().mockResolvedValue({}),
      update: jest.fn().mockResolvedValue({}),
      updateMany: jest.fn().mockResolvedValue({}),
      delete: jest.fn().mockResolvedValue({}),
      findFirst: jest.fn().mockResolvedValue(null),
    },
    actionDone: {
      count: jest.fn().mockResolvedValue(0),
      deleteMany: jest.fn().mockResolvedValue({}),
    },
    ...overrides,
  });

  beforeEach(async () => {
    const txMock = makeTxMock();

    const prismaMock = {
      instance: {
        findUnique: jest.fn().mockResolvedValue({
          id: 1,
          currentSchoolYear: '2024-2025',
          isOpen: true,
        }),
      },
      $transaction: jest.fn().mockImplementation(async (fn) => fn(txMock)),
    } as unknown as jest.Mocked<PrismaService>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InstanceService,
        PeriodService,
        InstanceCleanupService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    service = module.get<InstanceService>(InstanceService);
    prisma = module.get(PrismaService);
  });

  // ─────────────────────────────────────────────
  // SCÉNARIO 1 : Sauvegarde sans conflit
  // ─────────────────────────────────────────────
  it('1. save → OK : crée les périodes quand aucun conflit', async () => {
    // GIVEN : aucune période existante, config valide
    await service.update(1, {
      gameStartDate: new Date('2024-09-04') as any,
      gameEndDate: new Date('2024-10-16') as any,
      gamePeriodsCount: 6,
      schoolYear: '2024-2025',
    });

    // THEN : la transaction a été appelée
    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
  });

  // ─────────────────────────────────────────────
  // SCÉNARIO 2 : Conflit 409 (réduction de dates)
  // ─────────────────────────────────────────────
  it('2. save → 409 : lève ConflictException si actions affectées et force=false', async () => {
    // GIVEN : 8 périodes existantes → réduction à 6 → 2 périodes à supprimer
    //         avec 5 actions dans les périodes supprimées
    const currentPeriods = Array.from({ length: 8 }, (_, i) => ({ id: i + 1 }));

    const txMock = makeTxMock({
      period: {
        findMany: jest.fn().mockResolvedValue(currentPeriods),
        create: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
        delete: jest.fn(),
        findFirst: jest.fn().mockResolvedValue(null),
      },
      actionDone: {
        count: jest.fn().mockResolvedValue(5), // 5 actions dans les périodes supprimées
        deleteMany: jest.fn(),
      },
    });

    (prisma.$transaction as jest.Mock).mockImplementation(async (fn) =>
      fn(txMock),
    );

    // THEN : ConflictException levée AVANT toute suppression
    await expect(
      service.update(1, {
        gameStartDate: new Date('2024-09-04') as any,
        gameEndDate: new Date('2024-10-16') as any,
        gamePeriodsCount: 6,
        schoolYear: '2024-2025',
        force: false,
      }),
    ).rejects.toThrow(ConflictException);

    // ET : aucune période ou action supprimée
    expect(txMock.actionDone.deleteMany).not.toHaveBeenCalled();
    expect(txMock.period.delete).not.toHaveBeenCalled();
  });

  // ─────────────────────────────────────────────
  // SCÉNARIO 3 : Force=true (suppression acceptée)
  // ─────────────────────────────────────────────
  it('3. save force=true : supprime les actions et périodes orphelines', async () => {
    // GIVEN : 8 périodes existantes, config qui génère seulement 6 (gameEndDate plus courte)
    const currentPeriods = Array.from({ length: 8 }, (_, i) => ({ id: i + 1 }));

    const txMock = makeTxMock({
      gameConfig: {
        upsert: jest.fn().mockResolvedValue({}),
        findUnique: jest.fn().mockResolvedValue({
          // 6 semaines exactes du mercredi au mercredi : génère 6 périodes
          gameStartDate: new Date('2024-09-04'),
          gameEndDate: new Date('2024-10-15'), // inclus dans la 6e période
          gamePeriodsCount: 6,
        }),
      },
      period: {
        findMany: jest.fn().mockResolvedValue(currentPeriods),
        create: jest.fn().mockResolvedValue({}),
        update: jest.fn().mockResolvedValue({}),
        updateMany: jest.fn().mockResolvedValue({}),
        delete: jest.fn().mockResolvedValue({}),
        findFirst: jest.fn().mockResolvedValue(null),
      },
      actionDone: {
        count: jest.fn().mockResolvedValue(5),
        deleteMany: jest.fn().mockResolvedValue({}),
      },
    });

    (prisma.$transaction as jest.Mock).mockImplementation(async (fn) =>
      fn(txMock),
    );

    // WHEN : force=true
    await service.update(1, {
      gameStartDate: new Date('2024-09-04') as any,
      gameEndDate: new Date('2024-10-15') as any,
      gamePeriodsCount: 6,
      schoolYear: '2024-2025',
      force: true,
    });

    // THEN : delete est appelé pour les périodes en excès
    expect(txMock.period.delete).toHaveBeenCalled();
    expect(txMock.actionDone.deleteMany).toHaveBeenCalled();
  });

  // ─────────────────────────────────────────────
  // SCÉNARIO 4 : Rollback atomique
  // ─────────────────────────────────────────────
  it('4. atomicité : ConflictException déclenche un rollback (transaction mock)', async () => {
    let mutationCount = 0;

    // Ce txMock a une config qui mène à une réduction (4 périodes actuelles → 2 générées)
    const txMock = makeTxMock({
      gameConfig: {
        upsert: jest.fn().mockResolvedValue({}),
        findUnique: jest.fn().mockResolvedValue({
          gameStartDate: new Date('2024-09-04'),
          gameEndDate: new Date('2024-09-17'), // 2 semaines
          gamePeriodsCount: 2,
        }),
      },
      period: {
        findMany: jest
          .fn()
          .mockResolvedValue([{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }]),
        create: jest.fn().mockImplementation(() => {
          mutationCount++;
          return {};
        }),
        update: jest.fn().mockResolvedValue({}),
        updateMany: jest.fn().mockResolvedValue({}),
        delete: jest.fn().mockImplementation(() => {
          mutationCount++;
          return {};
        }),
        findFirst: jest.fn().mockResolvedValue(null),
      },
      actionDone: {
        count: jest.fn().mockResolvedValue(3), // 3 actions dans les périodes à supprimer
        deleteMany: jest.fn().mockImplementation(() => {
          mutationCount++;
          return {};
        }),
      },
    });

    (prisma.$transaction as jest.Mock).mockImplementation(async (fn) => {
      try {
        return await fn(txMock);
      } catch (e) {
        throw e; // Simule le rollback
      }
    });

    await expect(
      service.update(1, {
        gameStartDate: new Date('2024-09-04') as any,
        gameEndDate: new Date('2024-09-17') as any,
        schoolYear: '2024-2025',
        force: false,
      }),
    ).rejects.toThrow(ConflictException);

    // Aucune suppression effective avant la validation
    expect(mutationCount).toBe(0);
  });
});

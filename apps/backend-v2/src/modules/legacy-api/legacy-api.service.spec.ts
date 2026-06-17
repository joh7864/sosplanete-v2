import { Test, TestingModule } from '@nestjs/testing';
import { LegacyApiService } from './legacy-api.service';
import { PrismaService } from '../../prisma/prisma.service';
import { ImpactService } from '../impact/impact.service';
import { AnimalUnlockService } from '../stimulation/animal-unlock.service';

describe('LegacyApiService', () => {
  let service: LegacyApiService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LegacyApiService,
        { provide: PrismaService, useValue: {} },
        { provide: ImpactService, useValue: {} },
        {
          provide: AnimalUnlockService,
          useValue: {
            getCurrentUnlock: jest
              .fn()
              .mockResolvedValue({ animalsUnlocked: 0 }),
          },
        },
      ],
    }).compile();

    service = module.get<LegacyApiService>(LegacyApiService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

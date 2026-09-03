import { Test, TestingModule } from '@nestjs/testing';
import { LegacyApiService } from './legacy-api.service';
import { PrismaService } from '../../prisma/prisma.service';
import { ImpactService } from '../impact/impact.service';
import { AnimalUnlockService } from '../stimulation/animal-unlock.service';
import { TrackingService } from '../tracking/tracking.service';
import { EcoBarRaceService } from '../stimulation/eco-bar-race.service';
import { JwtService } from '@nestjs/jwt';
import { WhatsAppService } from '../stimulation/whatsapp.service';
import { ChatGateway } from '../stimulation/chat.gateway';

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
        { provide: TrackingService, useValue: {} },
        { provide: EcoBarRaceService, useValue: {} },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn().mockReturnValue('mock_token'),
            verify: jest.fn(),
          },
        },
        { provide: WhatsAppService, useValue: {} },
        { provide: ChatGateway, useValue: {} },
      ],
    }).compile();

    service = module.get<LegacyApiService>(LegacyApiService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

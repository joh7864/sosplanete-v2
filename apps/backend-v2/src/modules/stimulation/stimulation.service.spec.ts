import { Test, TestingModule } from '@nestjs/testing';
import { StimulationService } from './stimulation.service';
import { PrismaService } from '../../prisma/prisma.service';
import { CategoryRefService } from '../category-ref/category-ref.service';

describe('StimulationService', () => {
  let service: StimulationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StimulationService,
        { provide: PrismaService, useValue: {} },
        { provide: CategoryRefService, useValue: {} },
      ],
    }).compile();

    service = module.get<StimulationService>(StimulationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

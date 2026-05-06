import { Test, TestingModule } from '@nestjs/testing';
import { StimulationService } from './stimulation.service';

describe('StimulationService', () => {
  let service: StimulationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [StimulationService],
    }).compile();

    service = module.get<StimulationService>(StimulationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

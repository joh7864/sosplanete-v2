import { Test, TestingModule } from '@nestjs/testing';
import { StimulationController } from './stimulation.controller';
import { StimulationService } from './stimulation.service';
import { AnimalUnlockService } from './animal-unlock.service';
import { EcoBarRaceService } from './eco-bar-race.service';

describe('StimulationController', () => {
  let controller: StimulationController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [StimulationController],
      providers: [
        { provide: StimulationService, useValue: {} },
        { provide: AnimalUnlockService, useValue: {} },
        { provide: EcoBarRaceService, useValue: {} },
      ],
    }).compile();

    controller = module.get<StimulationController>(StimulationController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});

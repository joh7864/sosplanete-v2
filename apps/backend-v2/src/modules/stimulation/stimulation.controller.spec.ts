import { Test, TestingModule } from '@nestjs/testing';
import { StimulationController } from './stimulation.controller';

describe('StimulationController', () => {
  let controller: StimulationController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [StimulationController],
    }).compile();

    controller = module.get<StimulationController>(StimulationController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});

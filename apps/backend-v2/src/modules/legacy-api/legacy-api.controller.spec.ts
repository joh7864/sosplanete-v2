import { Test, TestingModule } from '@nestjs/testing';
import { LegacyApiController } from './legacy-api.controller';
import { LegacyApiService } from './legacy-api.service';

describe('LegacyApiController', () => {
  let controller: LegacyApiController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [LegacyApiController],
      providers: [
        { provide: LegacyApiService, useValue: {} },
      ],
    }).compile();

    controller = module.get<LegacyApiController>(LegacyApiController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});

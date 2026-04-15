import { Test, TestingModule } from '@nestjs/testing';
import { LegacyApiService } from './legacy-api.service';

describe('LegacyApiService', () => {
  let service: LegacyApiService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [LegacyApiService],
    }).compile();

    service = module.get<LegacyApiService>(LegacyApiService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

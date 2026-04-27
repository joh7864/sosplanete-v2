import { Module } from '@nestjs/common';
import { LegacyApiController } from './legacy-api.controller';
import { LegacyApiService } from './legacy-api.service';
import { PrismaModule } from '../../prisma/prisma.module';

import { ImpactModule } from '../impact/impact.module';

@Module({
  imports: [PrismaModule, ImpactModule],
  controllers: [LegacyApiController],
  providers: [LegacyApiService]
})
export class LegacyApiModule {}

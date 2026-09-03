import { Module } from '@nestjs/common';
import { LegacyApiService } from './legacy-api.service';
import { LegacyApiController } from './legacy-api.controller';
import { PrismaModule } from '../../prisma/prisma.module';
import { ImpactModule } from '../impact/impact.module';
import { StimulationModule } from '../stimulation/stimulation.module';
import { TrackingModule } from '../tracking/tracking.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    PrismaModule,
    ImpactModule,
    StimulationModule,
    TrackingModule,
    AuthModule,
  ],
  providers: [LegacyApiService],
  controllers: [LegacyApiController],
  exports: [LegacyApiService],
})
export class LegacyApiModule {}

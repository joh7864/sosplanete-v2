import { Module } from '@nestjs/common';
import { TrackingService } from './tracking.service';
import { TrackingController } from './tracking.controller';
import { TelemetryService } from './telemetry.service';
import { TelemetryController } from './telemetry.controller';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [TrackingController, TelemetryController],
  providers: [TrackingService, TelemetryService],
  exports: [TrackingService, TelemetryService],
})
export class TrackingModule {}

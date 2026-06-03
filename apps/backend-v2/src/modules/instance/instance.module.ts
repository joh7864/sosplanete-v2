import { Module } from '@nestjs/common';
import { InstanceService } from './instance.service';
import { YearService } from './year.service';
import { InstanceCleanupService } from './instance-cleanup.service';
import { InstanceController } from './instance.controller';
import { PeriodModule } from '../period/period.module';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [PeriodModule, NotificationModule],
  providers: [InstanceService, YearService, InstanceCleanupService],
  controllers: [InstanceController],
  exports: [InstanceService, YearService, InstanceCleanupService],
})
export class InstanceModule {}

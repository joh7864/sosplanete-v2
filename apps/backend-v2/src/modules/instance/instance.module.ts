import { Module } from '@nestjs/common';
import { InstanceService } from './instance.service';
import { YearService } from './year.service';
import { InstanceController } from './instance.controller';

@Module({
  providers: [InstanceService, YearService],
  controllers: [InstanceController],
  exports: [InstanceService, YearService],
})
export class InstanceModule {}

import { Module } from '@nestjs/common';
import { ActionRefService } from './action-ref.service';
import { ActionRefController } from './action-ref.controller';

@Module({
  providers: [ActionRefService],
  controllers: [ActionRefController],
  exports: [ActionRefService],
})
export class ActionRefModule {}

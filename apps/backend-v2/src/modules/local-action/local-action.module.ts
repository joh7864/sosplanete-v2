import { Module } from '@nestjs/common';
import { LocalActionService } from './local-action.service';
import { LocalActionController } from './local-action.controller';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [LocalActionService],
  controllers: [LocalActionController],
  exports: [LocalActionService],
})
export class LocalActionModule {}

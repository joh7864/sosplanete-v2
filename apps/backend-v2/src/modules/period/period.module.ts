import { Module } from '@nestjs/common';
import { PeriodService } from './period.service';
import { PeriodController } from './period.controller';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [PeriodService],
  controllers: [PeriodController],
  exports: [PeriodService],
})
export class PeriodModule {}

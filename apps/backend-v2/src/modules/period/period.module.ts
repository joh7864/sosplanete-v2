import { Module, forwardRef } from '@nestjs/common';
import { PeriodService } from './period.service';
import { PeriodController } from './period.controller';
import { PrismaModule } from '../../prisma/prisma.module';
import { StimulationModule } from '../stimulation/stimulation.module';

@Module({
  imports: [PrismaModule, forwardRef(() => StimulationModule)],
  providers: [PeriodService],
  controllers: [PeriodController],
  exports: [PeriodService],
})
export class PeriodModule {}

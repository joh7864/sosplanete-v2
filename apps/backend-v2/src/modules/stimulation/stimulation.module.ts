import { Module } from '@nestjs/common';
import { StimulationService } from './stimulation.service';
import { StimulationController } from './stimulation.controller';
import { PrismaModule } from '../../prisma/prisma.module';
import { AnimalUnlockService } from './animal-unlock.service';

@Module({
  imports: [PrismaModule],
  providers: [StimulationService, AnimalUnlockService],
  controllers: [StimulationController],
  exports: [StimulationService, AnimalUnlockService],
})
export class StimulationModule {}

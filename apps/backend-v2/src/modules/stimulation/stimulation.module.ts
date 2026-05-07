import { Module } from '@nestjs/common';
import { StimulationService } from './stimulation.service';
import { StimulationController } from './stimulation.controller';
import { PrismaModule } from '../../prisma/prisma.module';
import { AnimalUnlockService } from './animal-unlock.service';
import { EcoBarRaceService } from './eco-bar-race.service';

@Module({
  imports: [PrismaModule],
  providers: [StimulationService, AnimalUnlockService, EcoBarRaceService],
  controllers: [StimulationController],
  exports: [StimulationService, AnimalUnlockService, EcoBarRaceService],
})
export class StimulationModule {}

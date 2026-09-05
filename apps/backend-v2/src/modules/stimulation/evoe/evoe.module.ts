import { Module } from '@nestjs/common';
import { EvoeService } from './evoe.service';
import { EvoeController } from './evoe.controller';
import { EasterEggService } from './easter-egg.service';
import { EasterEggController } from './easter-egg.controller';
import { PrismaModule } from '../../../prisma/prisma.module';
import { LegacyApiModule } from '../../legacy-api/legacy-api.module';
import { ImpactModule } from '../../impact/impact.module';
import { StimulationModule } from '../stimulation.module';

@Module({
  imports: [PrismaModule, LegacyApiModule, ImpactModule, StimulationModule],
  controllers: [EvoeController, EasterEggController],
  providers: [EvoeService, EasterEggService],
  exports: [EvoeService, EasterEggService],
})
export class EvoeModule {}


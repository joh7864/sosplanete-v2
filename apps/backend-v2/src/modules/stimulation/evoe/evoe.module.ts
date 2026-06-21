import { Module } from '@nestjs/common';
import { EvoeService } from './evoe.service';
import { EvoeController } from './evoe.controller';
import { PrismaModule } from '../../../prisma/prisma.module';
import { LegacyApiModule } from '../../legacy-api/legacy-api.module';
import { ImpactModule } from '../../impact/impact.module';
import { StimulationModule } from '../stimulation.module';

@Module({
  imports: [PrismaModule, LegacyApiModule, ImpactModule, StimulationModule],
  controllers: [EvoeController],
  providers: [EvoeService],
  exports: [EvoeService],
})
export class EvoeModule {}

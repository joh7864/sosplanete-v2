import { Module } from '@nestjs/common';
import { EvoeService } from './evoe.service';
import { EvoeController } from './evoe.controller';
import { PrismaModule } from '../../../prisma/prisma.module';
import { LegacyApiModule } from '../../legacy-api/legacy-api.module';
import { ImpactModule } from '../../impact/impact.module';

@Module({
  imports: [PrismaModule, LegacyApiModule, ImpactModule],
  controllers: [EvoeController],
  providers: [EvoeService],
  exports: [EvoeService],
})
export class EvoeModule {}

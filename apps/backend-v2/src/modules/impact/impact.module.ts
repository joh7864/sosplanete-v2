import { Module } from '@nestjs/common';
import { ImpactService } from './impact.service';
import { ImpactController } from './impact.controller';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [ImpactService],
  controllers: [ImpactController],
  exports: [ImpactService],
})
export class ImpactModule {}

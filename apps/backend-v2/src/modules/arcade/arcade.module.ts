import { Module } from '@nestjs/common';
import { ArcadeController } from './arcade.controller';
import { ArcadeService } from './arcade.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { LegacyApiModule } from '../legacy-api/legacy-api.module';

@Module({
  imports: [PrismaModule, LegacyApiModule],
  controllers: [ArcadeController],
  providers: [ArcadeService],
  exports: [ArcadeService],
})
export class ArcadeModule {}

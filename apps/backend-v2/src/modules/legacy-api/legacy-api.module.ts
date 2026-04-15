import { Module } from '@nestjs/common';
import { LegacyApiController } from './legacy-api.controller';
import { LegacyApiService } from './legacy-api.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [LegacyApiController],
  providers: [LegacyApiService]
})
export class LegacyApiModule {}

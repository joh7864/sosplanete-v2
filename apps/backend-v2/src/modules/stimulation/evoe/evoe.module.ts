import { Module } from '@nestjs/common';
import { EvoeService } from './evoe.service';
import { EvoeController } from './evoe.controller';
import { PrismaModule } from '../../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [EvoeController],
  providers: [EvoeService],
  exports: [EvoeService]
})
export class EvoeModule {}

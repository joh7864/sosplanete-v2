import { Module } from '@nestjs/common';
import { ChildService } from './child.service';
import { ChildController } from './child.controller';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [ChildService],
  controllers: [ChildController],
  exports: [ChildService],
})
export class ChildModule {}

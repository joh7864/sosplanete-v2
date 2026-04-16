import { Module } from '@nestjs/common';
import { LocalActionService } from './local-action.service';
import { LocalActionController } from './local-action.controller';
import { PrismaModule } from '../../prisma/prisma.module';
import { CategoryModule } from '../category/category.module';

@Module({
  imports: [PrismaModule, CategoryModule],
  providers: [LocalActionService],
  controllers: [LocalActionController],
  exports: [LocalActionService],
})
export class LocalActionModule {}

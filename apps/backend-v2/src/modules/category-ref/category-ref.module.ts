import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { CategoryRefController } from './category-ref.controller';
import { CategoryRefService } from './category-ref.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [
    PrismaModule,
    MulterModule.register({ limits: { fileSize: 5 * 1024 * 1024 } }), // 5MB max
  ],
  controllers: [CategoryRefController],
  providers: [CategoryRefService],
  exports: [CategoryRefService],
})
export class CategoryRefModule {}

import { Module } from '@nestjs/common';
import { StimulationService } from './stimulation.service';
import { StimulationController } from './stimulation.controller';
import { PrismaModule } from '../../prisma/prisma.module';
import { AnimalUnlockService } from './animal-unlock.service';
import { EcoBarRaceService } from './eco-bar-race.service';
import { CategoryRefModule } from '../category-ref/category-ref.module';
import { WhatsAppService } from './whatsapp.service';
import { AuthModule } from '../auth/auth.module';
import { ChatGateway } from './chat.gateway';

@Module({
  imports: [PrismaModule, CategoryRefModule, AuthModule],
  providers: [
    StimulationService,
    AnimalUnlockService,
    EcoBarRaceService,
    WhatsAppService,
    ChatGateway,
  ],
  controllers: [StimulationController],
  exports: [
    StimulationService,
    AnimalUnlockService,
    EcoBarRaceService,
    WhatsAppService,
    ChatGateway,
  ],
})
export class StimulationModule {}

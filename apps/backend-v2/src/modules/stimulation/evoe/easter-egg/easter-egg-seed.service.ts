import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service';
import { EasterEggDifficulty } from '@prisma/client';
import { DEFAULT_EASTER_EGGS } from './default-easter-eggs.data';

@Injectable()
export class EasterEggSeedService {
  private readonly logger = new Logger(EasterEggSeedService.name);

  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    await this.seedDefaultEasterEggs();
    try {
      await this.prisma.evoeEasterEgg.updateMany({
        where: { imageUrl: { contains: 'cadenas_4ch.webp' } },
        data: { imageUrl: '/easter-eggs/cadenas_4ch.svg' },
      });
      await this.prisma.evoeEasterEgg.updateMany({
        where: { code: 'EE_KONAMI_80S' },
        data: {
          crypticMessage:
            "Depuis l'an 2070, nos archivistes ont exhumé un antique protocole de commande pré-spatial : une chorégraphie secrète jadis exécutée par les pionniers du jeu vidéo...",
        },
      });
    } catch {
      // ignore
    }
  }

  async seedDefaultEasterEggs() {
    try {
      const count = await this.prisma.evoeEasterEgg.count();
      if (count === 0) {
        this.logger.log('Initialisation du catalogue d’Easter Eggs par défaut (22 énigmes)...');
        for (const egg of DEFAULT_EASTER_EGGS) {
          await this.prisma.evoeEasterEgg.create({
            data: {
              code: egg.code,
              title: egg.title,
              crypticMessage: egg.crypticMessage || '',
              explicitHint: egg.explicitHint || null,
              imageUrl: egg.imageUrl || null,
              triggerType: egg.triggerType,
              expectedAnswer: egg.expectedAnswer || null,
              caseSensitive: egg.caseSensitive ?? false,
              triggerConfig: egg.triggerConfig || null,
              complexity: egg.complexity || EasterEggDifficulty.MEDIUM,
              rewardPointsIT: egg.rewardPointsIT || 50,
              specialReward: egg.specialReward || 'NONE',
              orderIndex: egg.orderIndex || 0,
              prerequisiteType: (egg.prerequisiteType as any) || 'NONE',
              isActive: egg.isActive ?? true,
            },
          });
        }
        this.logger.log('Catalogue d’Easter Eggs initialisé avec succès.');
      }
    } catch (e: any) {
      this.logger.warn(`Erreur lors du seeding des Easter Eggs: ${e.message}`);
    }
  }
}

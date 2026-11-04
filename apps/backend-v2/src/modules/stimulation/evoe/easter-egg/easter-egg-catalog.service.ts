import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service';
import {
  EasterEggTriggerType,
  EasterEggDifficulty,
} from '@prisma/client';
import {
  CreateEasterEggDto,
  UpdateEasterEggDto,
  ImportCatalogDto,
} from '../dto/easter-egg.dto';
import { assertValidSpecialReward } from './easter-egg.utils';
import { isValidSpecialReward } from '../../../arcade/arcade-games.catalog';

@Injectable()
export class EasterEggCatalogService {
  constructor(private readonly prisma: PrismaService) {}

  async getAdminCatalog() {
    return this.prisma.evoeEasterEgg.findMany({
      orderBy: { orderIndex: 'asc' },
    });
  }

  async createEasterEgg(dto: CreateEasterEggDto) {
    assertValidSpecialReward(dto.specialReward);
    return this.prisma.evoeEasterEgg.create({
      data: {
        code: dto.code,
        title: dto.title,
        crypticMessage: dto.crypticMessage || dto.senderLore || '',
        explicitHint: dto.explicitHint || null,
        mascotDurationSeconds: dto.mascotDurationSeconds,
        hintDelayMinutes: dto.hintDelayMinutes,
        triggerAction: dto.triggerAction,
        senderLore: dto.senderLore,
        imageUrl: dto.imageUrl || null,
        triggerType: dto.triggerType,
        expectedAnswer: dto.expectedAnswer || null,
        caseSensitive: dto.caseSensitive ?? false,
        triggerConfig: dto.triggerConfig || null,
        complexity: dto.complexity || EasterEggDifficulty.MEDIUM,
        rewardPointsIT: dto.rewardPointsIT || 50,
        specialReward: dto.specialReward || 'NONE',
        orderIndex: dto.orderIndex || 0,
        isActive: dto.isActive ?? true,
        prerequisiteType: dto.prerequisiteType || 'MISSIONS_COUNT',
        prerequisiteConfig: dto.prerequisiteConfig ?? { count: 3, distinctSectors: 2 },
      },
    });
  }

  async updateEasterEgg(id: number, dto: UpdateEasterEggDto) {
    assertValidSpecialReward(dto.specialReward);
    return this.prisma.evoeEasterEgg.update({
      where: { id },
      data: {
        ...(dto.title !== undefined && { title: dto.title }),
        ...((dto.crypticMessage != null) ? { crypticMessage: dto.crypticMessage } : (dto.senderLore != null) ? { crypticMessage: dto.senderLore } : {}),
        ...(dto.explicitHint !== undefined && { explicitHint: dto.explicitHint }),
        ...(dto.mascotDurationSeconds !== undefined && { mascotDurationSeconds: dto.mascotDurationSeconds }),
        ...(dto.hintDelayMinutes !== undefined && { hintDelayMinutes: dto.hintDelayMinutes }),
        ...(dto.triggerAction !== undefined && { triggerAction: dto.triggerAction }),
        ...(dto.clues !== undefined && { clues: dto.clues }),
        ...(dto.imageUrl !== undefined && { imageUrl: dto.imageUrl }),
        ...(dto.triggerType !== undefined && { triggerType: dto.triggerType }),
        ...(dto.expectedAnswer !== undefined && { expectedAnswer: dto.expectedAnswer }),
        ...(dto.caseSensitive !== undefined && { caseSensitive: dto.caseSensitive }),
        ...(dto.triggerConfig !== undefined && { triggerConfig: dto.triggerConfig }),
        ...(dto.complexity !== undefined && { complexity: dto.complexity }),
        ...(dto.rewardPointsIT !== undefined && { rewardPointsIT: dto.rewardPointsIT }),
        ...(dto.specialReward !== undefined && { specialReward: dto.specialReward }),
        ...(dto.orderIndex !== undefined && { orderIndex: dto.orderIndex }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
        ...(dto.prerequisiteType !== undefined && { prerequisiteType: dto.prerequisiteType }),
        ...(dto.prerequisiteConfig !== undefined && { prerequisiteConfig: dto.prerequisiteConfig }),
      },
    });
  }

  async deleteEasterEgg(id: number) {
    return this.prisma.evoeEasterEgg.delete({
      where: { id },
    });
  }

  async reorderCatalog(orderedIds: number[]) {
    const updates = orderedIds.map((id, index) =>
      this.prisma.evoeEasterEgg.update({
        where: { id },
        data: { orderIndex: index + 1 },
      }),
    );
    await this.prisma.$transaction(updates);
    return { success: true, count: orderedIds.length };
  }

  async exportCatalog() {
    const eggs = await this.prisma.evoeEasterEgg.findMany({
      orderBy: { orderIndex: 'asc' },
    });

    return eggs.map((e) => ({
      code: e.code,
      title: e.title,
      prerequisiteType: e.prerequisiteType,
      prerequisiteConfig: e.prerequisiteConfig,
      crypticMessage: e.crypticMessage,
      explicitHint: e.explicitHint,
      hintDelayMinutes: e.hintDelayMinutes,
      mascotDurationSeconds: e.mascotDurationSeconds,
      triggerAction: e.triggerAction,
      senderLore: e.senderLore,
      clues: e.clues,
      imageUrl: e.imageUrl,
      triggerType: e.triggerType,
      expectedAnswer: e.expectedAnswer,
      caseSensitive: e.caseSensitive,
      triggerConfig: e.triggerConfig,
      complexity: e.complexity,
      rewardPointsIT: e.rewardPointsIT,
      specialReward: e.specialReward,
      orderIndex: e.orderIndex,
      isActive: e.isActive,
    }));
  }

  async importCatalog(dto: ImportCatalogDto) {
    const items = dto.items;
    const mode = dto.mode || 'upsert';

    if (!Array.isArray(items) || items.length === 0) {
      throw new BadRequestException("Le fichier ou la liste d'Easter Eggs est vide ou invalide.");
    }

    let createdCount = 0;
    let updatedCount = 0;

    if (mode === 'replace') {
      await this.prisma.evoeEasterEgg.deleteMany({});
      for (let idx = 0; idx < items.length; idx++) {
        const item = items[idx];
        if (!item.code || !item.title) continue;
        await this.prisma.evoeEasterEgg.create({
          data: {
            code: String(item.code).trim(),
            title: String(item.title).trim(),
            prerequisiteType: item.prerequisiteType || 'MISSIONS_COUNT',
            prerequisiteConfig: item.prerequisiteConfig ?? { count: 3, distinctSectors: 2 },
            crypticMessage: item.crypticMessage || item.senderLore || '',
            explicitHint: item.explicitHint || null,
            hintDelayMinutes: item.hintDelayMinutes != null ? Number(item.hintDelayMinutes) : 120,
            mascotDurationSeconds: item.mascotDurationSeconds != null ? Number(item.mascotDurationSeconds) : 30,
            triggerAction: item.triggerAction || null,
            senderLore: item.senderLore || null,
            clues: item.clues || null,
            imageUrl: item.imageUrl || null,
            triggerType: item.triggerType || EasterEggTriggerType.RIDDLE_ANSWER_INPUT,
            expectedAnswer: item.expectedAnswer != null ? String(item.expectedAnswer) : null,
            caseSensitive: Boolean(item.caseSensitive),
            triggerConfig: item.triggerConfig || null,
            complexity: item.complexity || EasterEggDifficulty.MEDIUM,
            rewardPointsIT: item.rewardPointsIT != null ? Number(item.rewardPointsIT) : 50,
            specialReward: isValidSpecialReward(item.specialReward) ? item.specialReward || 'NONE' : 'NONE',
            orderIndex: item.orderIndex != null ? Number(item.orderIndex) : idx + 1,
            isActive: item.isActive !== undefined ? Boolean(item.isActive) : true,
          },
        });
        createdCount++;
      }
    } else {
      for (let idx = 0; idx < items.length; idx++) {
        const item = items[idx];
        if (!item.code || !item.title) continue;

        const code = String(item.code).trim();
        const existing = await this.prisma.evoeEasterEgg.findUnique({
          where: { code },
        });

        const data: any = {
          title: String(item.title).trim(),
          prerequisiteType: item.prerequisiteType || 'MISSIONS_COUNT',
          prerequisiteConfig: item.prerequisiteConfig ?? { count: 3, distinctSectors: 2 },
          crypticMessage: item.crypticMessage || item.senderLore || '',
          explicitHint: item.explicitHint || null,
          hintDelayMinutes: item.hintDelayMinutes != null ? Number(item.hintDelayMinutes) : 120,
          mascotDurationSeconds: item.mascotDurationSeconds != null ? Number(item.mascotDurationSeconds) : 30,
          triggerAction: item.triggerAction || null,
          senderLore: item.senderLore || null,
          clues: item.clues || null,
          imageUrl: item.imageUrl || null,
          triggerType: item.triggerType || EasterEggTriggerType.RIDDLE_ANSWER_INPUT,
          expectedAnswer: item.expectedAnswer != null ? String(item.expectedAnswer) : null,
          caseSensitive: Boolean(item.caseSensitive),
          triggerConfig: item.triggerConfig || null,
          complexity: item.complexity || EasterEggDifficulty.MEDIUM,
          rewardPointsIT: item.rewardPointsIT != null ? Number(item.rewardPointsIT) : 50,
          specialReward: isValidSpecialReward(item.specialReward) ? item.specialReward || 'NONE' : 'NONE',
          orderIndex: item.orderIndex != null ? Number(item.orderIndex) : idx + 1,
          isActive: item.isActive !== undefined ? Boolean(item.isActive) : true,
        };

        if (existing) {
          await this.prisma.evoeEasterEgg.update({
            where: { code },
            data,
          });
          updatedCount++;
        } else {
          await this.prisma.evoeEasterEgg.create({
            data: {
              code,
              ...data,
            },
          });
          createdCount++;
        }
      }
    }

    return {
      success: true,
      createdCount,
      updatedCount,
      totalProcessed: items.length,
      mode,
    };
  }
}

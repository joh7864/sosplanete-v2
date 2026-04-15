import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Role } from '@prisma/client';
import { Cron } from '@nestjs/schedule';

@Injectable()
export class PeriodService {
  constructor(private prisma: PrismaService) {}

  async create(data: { startDate: Date; endDate: Date; instanceId: number; isOpen?: boolean }, user: any) {
    const isAllowed = user.role === Role.AS || user.instanceIds?.includes(data.instanceId);
    if (!isAllowed) throw new ForbiddenException('Action non autorisée sur cet espace');

    if (data.isOpen) {
      // Ferme les autres si on ouvre celle-ci
      await this.prisma.period.updateMany({
        where: { instanceId: data.instanceId, isOpen: true },
        data: { isOpen: false },
      });
    }

    return this.prisma.period.create({
      data: {
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        isOpen: data.isOpen || false,
        instanceId: data.instanceId,
      },
    });
  }

  async findAll(instanceId: number, user: any) {
    const isAllowed = user.role === Role.AS || user.instanceIds?.includes(instanceId);
    if (!isAllowed) throw new ForbiddenException('Accès refusé à cet espace');

    return this.prisma.period.findMany({
      where: { instanceId },
      orderBy: { startDate: 'desc' },
      include: {
        _count: { select: { actionsDone: true } }
      }
    });
  }

  async update(id: number, data: { startDate?: Date; endDate?: Date; isOpen?: boolean }, user: any) {
    const period = await this.prisma.period.findUnique({ where: { id } });
    if (!period) throw new ForbiddenException('Période non trouvée');

    const isAllowed = user.role === Role.AS || user.instanceIds?.includes(period.instanceId);
    if (!isAllowed) throw new ForbiddenException('Action non autorisée');

    if (data.isOpen === true) {
      // Ferme toutes les autres périodes ouvertes
      await this.prisma.period.updateMany({
        where: { instanceId: period.instanceId, id: { not: id }, isOpen: true },
        data: { isOpen: false },
      });
    }

    return this.prisma.period.update({
      where: { id },
      data: {
        startDate: data.startDate ? new Date(data.startDate) : undefined,
        endDate: data.endDate ? new Date(data.endDate) : undefined,
        isOpen: data.isOpen,
      },
    });
  }

  async getImpact(id: number, user: any) {
    const period = await this.prisma.period.findUnique({ where: { id } });
    if (!period) throw new ForbiddenException('Période non trouvée');

    const isAllowed = user.role === Role.AS || user.instanceIds?.includes(period.instanceId);
    if (!isAllowed) throw new ForbiddenException('Action non autorisée');

    const actions = await this.prisma.actionDone.findMany({
      where: { periodId: id },
      include: {
        child: { include: { group: { include: { team: true } } } },
        localAction: true,
      }
    });

    return {
      count: actions.length,
      list: actions.map(a => ({
        id: a.id,
        actionName: a.localAction.label,
        childName: a.child.pseudo,
        teamName: a.child.group.team.name,
      }))
    };
  }

  async remove(id: number, user: any) {
    const period = await this.prisma.period.findUnique({ where: { id } });
    if (!period) return { success: false, message: 'Période non trouvée' };

    const isAllowed = user.role === Role.AS || user.instanceIds?.includes(period.instanceId);
    if (!isAllowed) throw new ForbiddenException('Action non autorisée sur cet espace');

    await this.prisma.period.delete({ where: { id } });
    return { success: true };
  }

  // CRON JOB: 23h59 tous les jours
  @Cron('59 23 * * *')
  async handlePeriodRotation() {
    console.log('[CRON] Début de la vérification des périodes (rotation)');
    const now = new Date();
    // Normalisation de la date d'aujourd'hui (juste la date, sans les heures pour comparer plus finement si besoin)
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // On cherche toutes les périodes actellement ouvertes
    const openPeriods = await this.prisma.period.findMany({
      where: { isOpen: true },
    });

    for (const period of openPeriods) {
      const pEndDate = new Date(period.endDate);
      const endDateOnly = new Date(pEndDate.getFullYear(), pEndDate.getMonth(), pEndDate.getDate());

      // Si la date de fin = aujourd'hui ou est passée
      if (endDateOnly <= today) {
        // Date de début nouvelle = date de fin précédente + 1 jour
        const nextStartDate = new Date(period.endDate);
        nextStartDate.setDate(nextStartDate.getDate() + 1);

        // Date de fin nouvelle = début + 6 jours
        const nextEndDate = new Date(nextStartDate);
        nextEndDate.setDate(nextEndDate.getDate() + 6);

        // Vérification sécurité: existe-t-il déjà une période sur cette date ?
        // On vérifie s'il existe une période qui commence sur cette date (approx) ou qui englobe la startDate
        const existingNext = await this.prisma.period.findFirst({
          where: {
            instanceId: period.instanceId,
            startDate: { lte: nextEndDate },
            endDate: { gte: nextStartDate },
          }
        });

        if (!existingNext) {
          // 1. Fermer l'actuelle
          await this.prisma.period.update({
            where: { id: period.id },
            data: { isOpen: false },
          });

          // 2. Créer et ouvrir la nouvelle
          await this.prisma.period.create({
            data: {
              startDate: nextStartDate,
              endDate: nextEndDate,
              isOpen: true,
              instanceId: period.instanceId,
            }
          });
          console.log(`[CRON] Instance ${period.instanceId} : Période ${period.id} fermée. Nouvelle période créée du ${nextStartDate.toISOString()} au ${nextEndDate.toISOString()}.`);
        }
      }
    }
    console.log('[CRON] Fin de la vérification.');
  }
}

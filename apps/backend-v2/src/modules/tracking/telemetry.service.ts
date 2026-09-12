import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  StartSessionDto,
  LogEventsBatchDto,
  PurgeSessionsDto,
} from './dto/telemetry.dto';
import { EventType, SessionStatus } from '@prisma/client';

@Injectable()
export class TelemetryService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Démarre une nouvelle session pour un joueur et consigne l'événement LOGIN.
   * Clôture les éventuelles anciennes sessions actives de cet élève.
   */
  async startSession(dto: StartSessionDto) {
    const now = new Date();

    // Clôturer toute session active précédente pour cet enfant
    const previousActiveSessions = await this.prisma.playerSession.findMany({
      where: {
        childId: dto.childId,
        status: SessionStatus.ACTIVE,
      },
    });

    for (const prev of previousActiveSessions) {
      const duration = Math.max(
        0,
        Math.floor((prev.lastActiveAt.getTime() - prev.startedAt.getTime()) / 1000),
      );
      await this.prisma.playerSession.update({
        where: { id: prev.id },
        data: {
          status: SessionStatus.CLOSED,
          endedAt: prev.lastActiveAt,
          durationSeconds: duration,
        },
      });
    }

    // Créer la nouvelle session
    const session = await this.prisma.playerSession.create({
      data: {
        childId: dto.childId,
        childPseudo: dto.childPseudo,
        instanceId: dto.instanceId,
        instanceYearId: dto.instanceYearId,
        schoolYear: dto.schoolYear,
        startedAt: now,
        lastActiveAt: now,
        deviceType: dto.deviceType,
        browser: dto.browser,
        os: dto.os,
        status: SessionStatus.ACTIVE,
      },
    });

    // Enregistrer le premier événement de connexion LOGIN
    await this.prisma.sessionEvent.create({
      data: {
        sessionId: session.id,
        childId: dto.childId,
        childPseudo: dto.childPseudo,
        timestamp: now,
        eventType: EventType.LOGIN,
        target: 'AUTHENTICATION',
        label: 'Connexion de l’explorateur',
        metadata: {
          deviceType: dto.deviceType,
          browser: dto.browser,
          os: dto.os,
        },
      },
    });

    return {
      sessionId: session.id,
      startedAt: session.startedAt,
    };
  }

  /**
   * Enregistre un lot d'événements de parcours (PAGE_VIEW, MISSION_DONE, etc.)
   * et met à jour la durée et le timestamp d'activité de la session.
   */
  async logEvents(dto: LogEventsBatchDto) {
    const session = await this.prisma.playerSession.findUnique({
      where: { id: dto.sessionId },
    });

    if (!session) {
      throw new NotFoundException(`Session introuvable (${dto.sessionId})`);
    }

    const now = new Date();

    if (dto.events && dto.events.length > 0) {
      const records = dto.events.map((ev) => ({
        sessionId: session.id,
        childId: session.childId,
        childPseudo: session.childPseudo,
        timestamp: ev.timestamp ? new Date(ev.timestamp) : now,
        eventType: ev.eventType,
        target: ev.target,
        label: ev.label || null,
        timeSpentSeconds: ev.timeSpentSeconds || 0,
        metadata: ev.metadata || undefined,
      }));

      await this.prisma.sessionEvent.createMany({
        data: records,
      });
    }

    // Mettre à jour la durée de la session
    const durationSeconds = Math.max(
      session.durationSeconds,
      Math.floor((now.getTime() - session.startedAt.getTime()) / 1000),
    );

    await this.prisma.playerSession.update({
      where: { id: session.id },
      data: {
        lastActiveAt: now,
        durationSeconds,
        ...(session.status !== SessionStatus.ACTIVE ? { status: SessionStatus.ACTIVE, endedAt: null } : {}),
      },
    });

    return { success: true, count: dto.events.length };
  }

  /**
   * Clôture propre d'une session (au clic Déconnexion ou via sendBeacon).
   */
  async closeSession(sessionId: string) {
    const session = await this.prisma.playerSession.findUnique({
      where: { id: sessionId },
    });

    if (!session || session.status !== SessionStatus.ACTIVE) {
      return { success: true, alreadyClosed: true };
    }

    const now = new Date();
    const durationSeconds = Math.max(
      0,
      Math.floor((now.getTime() - session.startedAt.getTime()) / 1000),
    );

    await this.prisma.playerSession.update({
      where: { id: session.id },
      data: {
        status: SessionStatus.CLOSED,
        endedAt: now,
        lastActiveAt: now,
        durationSeconds,
      },
    });

    await this.prisma.sessionEvent.create({
      data: {
        sessionId: session.id,
        childId: session.childId,
        childPseudo: session.childPseudo,
        timestamp: now,
        eventType: EventType.LOGOUT,
        target: 'DISCONNECT',
        label: 'Déconnexion',
        timeSpentSeconds: 0,
      },
    });

    return { success: true, durationSeconds };
  }

  /**
   * Marque comme EXPIRED les sessions inactives sans signal depuis plus de 15 minutes.
   */
  async expireInactiveSessions(instanceId?: number) {
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);

    const where: any = {
      status: SessionStatus.ACTIVE,
      lastActiveAt: { lt: fifteenMinutesAgo },
    };

    if (instanceId) {
      where.instanceId = instanceId;
    }

    const staleSessions = await this.prisma.playerSession.findMany({
      where,
      take: 200,
    });

    for (const session of staleSessions) {
      const durationSeconds = Math.max(
        0,
        Math.floor((session.lastActiveAt.getTime() - session.startedAt.getTime()) / 1000),
      );

      await this.prisma.playerSession.update({
        where: { id: session.id },
        data: {
          status: SessionStatus.EXPIRED,
          endedAt: session.lastActiveAt,
          durationSeconds,
        },
      });
    }
  }

  /**
   * Récupère la liste paginée des sessions avec filtres multiples pour l'administration.
   */
  async getSessions(filters: {
    instanceId: number;
    schoolYear?: string;
    teamId?: number;
    groupId?: number;
    childPseudo?: string;
    status?: SessionStatus;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }) {
    // Nettoyer d'abord les sessions inactives
    await this.expireInactiveSessions(filters.instanceId);

    const page = Math.max(1, filters.page || 1);
    const limit = Math.min(100, Math.max(1, filters.limit || 20));
    const skip = (page - 1) * limit;

    const where: any = {
      instanceId: filters.instanceId,
    };

    if (filters.schoolYear) {
      where.schoolYear = filters.schoolYear;
    }

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.childPseudo && filters.childPseudo.trim()) {
      where.childPseudo = {
        contains: filters.childPseudo.trim(),
        mode: 'insensitive',
      };
    }

    if (filters.teamId || filters.groupId) {
      where.child = {};
      if (filters.groupId) {
        where.child.groupId = filters.groupId;
      }
      if (filters.teamId) {
        where.child.group = {
          teamId: filters.teamId,
        };
      }
    }

    if (filters.startDate || filters.endDate) {
      where.startedAt = {};
      if (filters.startDate) {
        where.startedAt.gte = new Date(filters.startDate);
      }
      if (filters.endDate) {
        // Fin de journée pour endDate si chaîne sans heure
        const end = new Date(filters.endDate);
        end.setHours(23, 59, 59, 999);
        where.startedAt.lte = end;
      }
    }

    const [total, sessions] = await Promise.all([
      this.prisma.playerSession.count({ where }),
      this.prisma.playerSession.findMany({
        where,
        skip,
        take: limit,
        orderBy: { startedAt: 'desc' },
        include: {
          child: {
            select: {
              id: true,
              pseudo: true,
              avatar: true,
              group: {
                select: {
                  id: true,
                  name: true,
                  team: {
                    select: {
                      id: true,
                      name: true,
                      color: true,
                    },
                  },
                },
              },
            },
          },
          _count: {
            select: {
              events: true,
            },
          },
        },
      }),
    ]);

    // Calculer les métriques synthétiques par session
    const formattedSessions = await Promise.all(
      sessions.map(async (sess) => {
        const [missionsCount, pagesVisitedCount, missionEvents] = await Promise.all([
          this.prisma.sessionEvent.count({
            where: {
              sessionId: sess.id,
              eventType: EventType.MISSION_DONE,
            },
          }),
          this.prisma.sessionEvent.count({
            where: {
              sessionId: sess.id,
              eventType: EventType.PAGE_VIEW,
            },
          }),
          this.prisma.sessionEvent.findMany({
            where: {
              sessionId: sess.id,
              eventType: EventType.MISSION_DONE,
            },
            select: {
              label: true,
              target: true,
            },
            take: 5,
          }),
        ]);

        return {
          id: sess.id,
          childId: sess.childId,
          childPseudo: sess.childPseudo,
          avatar: sess.child?.avatar || null,
          teamName: sess.child?.group?.team?.name || null,
          teamColor: sess.child?.group?.team?.color || '#00ffcc',
          groupName: sess.child?.group?.name || null,
          startedAt: sess.startedAt,
          endedAt: sess.endedAt,
          lastActiveAt: sess.lastActiveAt,
          durationSeconds: sess.durationSeconds,
          deviceType: sess.deviceType || 'DESKTOP',
          browser: sess.browser,
          os: sess.os,
          status: sess.status,
          eventsCount: sess._count.events,
          missionsCount,
          missionsDone: missionEvents.map((m) => m.label || m.target),
          pagesVisitedCount,
          child: sess.child,
        };
      }),
    );

    return {
      sessions: formattedSessions,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Récupère le parcours complet (timeline minute par minute) d'une session.
   */
  async getSessionJourney(sessionId: string) {
    const session = await this.prisma.playerSession.findUnique({
      where: { id: sessionId },
      include: {
        child: {
          select: {
            id: true,
            pseudo: true,
            avatar: true,
            group: {
              select: {
                id: true,
                name: true,
                team: {
                  select: {
                    id: true,
                    name: true,
                    color: true,
                  },
                },
              },
            },
          },
        },
        events: {
          where: {
            eventType: { not: EventType.HEARTBEAT },
          },
          orderBy: { timestamp: 'asc' },
        },
      },
    });

    if (!session) {
      throw new NotFoundException(`Session introuvable (${sessionId})`);
    }

    return {
      session: {
        id: session.id,
        childId: session.childId,
        childPseudo: session.childPseudo,
        avatar: session.child?.avatar || null,
        teamName: session.child?.group?.team?.name || null,
        teamColor: session.child?.group?.team?.color || '#00ffcc',
        groupName: session.child?.group?.name || null,
        startedAt: session.startedAt,
        endedAt: session.endedAt,
        durationSeconds: session.durationSeconds,
        deviceType: session.deviceType,
        browser: session.browser,
        os: session.os,
        status: session.status,
      },
      events: session.events.map((e) => ({
        id: e.id,
        timestamp: e.timestamp,
        eventType: e.eventType,
        target: e.target,
        label: e.label,
        timeSpentSeconds: e.timeSpentSeconds,
        metadata: e.metadata,
      })),
    };
  }

  /**
   * Calcule les KPIs globaux de traçabilité pour l'établissement sélectionné.
   */
  async getKpis(instanceId: number, schoolYear?: string) {
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
    const whereBase: any = { instanceId };
    if (schoolYear) whereBase.schoolYear = schoolYear;

    // Sessions actives en direct (signal < 15 min et statut ACTIVE)
    const activeSessions = await this.prisma.playerSession.findMany({
      where: {
        ...whereBase,
        status: SessionStatus.ACTIVE,
        lastActiveAt: { gte: fifteenMinutesAgo },
      },
      include: {
        child: {
          select: {
            id: true,
            pseudo: true,
            avatar: true,
            group: {
              select: {
                id: true,
                name: true,
                team: {
                  select: {
                    id: true,
                    name: true,
                    color: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { lastActiveAt: 'desc' },
    });

    const seenChildren = new Set<number>();
    const activePlayers: any[] = [];
    for (const sess of activeSessions) {
      if (!seenChildren.has(sess.childId)) {
        seenChildren.add(sess.childId);
        activePlayers.push({
          sessionId: sess.id,
          childId: sess.childId,
          pseudo: sess.childPseudo || sess.child?.pseudo || 'Joueur inconnu',
          avatar: sess.child?.avatar || null,
          teamName: sess.child?.group?.team?.name || null,
          teamColor: sess.child?.group?.team?.color || '#00ffcc',
          groupName: sess.child?.group?.name || null,
          deviceType: sess.deviceType,
          lastActiveAt: sess.lastActiveAt,
        });
      }
    }

    const activeSessionsNow = activePlayers.length;

    // Total des sessions
    const totalSessions = await this.prisma.playerSession.count({
      where: whereBase,
    });

    // Durée moyenne des sessions
    const durationAggregate = await this.prisma.playerSession.aggregate({
      where: whereBase,
      _avg: { durationSeconds: true },
    });
    const avgDurationSeconds = Math.round(durationAggregate._avg.durationSeconds || 0);

    // Nombre d'élèves distincts ayant ouvert une session
    const uniquePlayers = await this.prisma.playerSession.groupBy({
      by: ['childId'],
      where: whereBase,
    });
    const uniquePlayersCount = uniquePlayers.length;

    // Nombre total d'élèves inscrits dans cet établissement pour cette année
    const totalChildrenCount = await this.prisma.child.count({
      where: {
        group: {
          team: {
            instanceYear: {
              instanceId,
              ...(schoolYear ? { schoolYear } : {}),
            },
          },
        },
      },
    });

    // Date de la plus ancienne session (pour le calcul du rappel 90 jours)
    const oldestSession = await this.prisma.playerSession.findFirst({
      where: whereBase,
      orderBy: { startedAt: 'asc' },
      select: { startedAt: true },
    });

    let daysSinceOldest = 0;
    if (oldestSession) {
      daysSinceOldest = Math.floor(
        (Date.now() - oldestSession.startedAt.getTime()) / (1000 * 60 * 60 * 24),
      );
    }

    return {
      activeSessions: activeSessionsNow,
      activeSessionsNow,
      activePlayers,
      totalSessions,
      avgDurationMinutes: Math.round(avgDurationSeconds / 60),
      avgDurationSeconds,
      totalActivePlayers: uniquePlayersCount,
      uniquePlayersCount,
      totalRegisteredPlayers: totalChildrenCount,
      totalChildrenCount,
      participationRate: totalChildrenCount > 0 ? Math.round((uniquePlayersCount / totalChildrenCount) * 100) : 0,
      hasOldSessions90Days: daysSinceOldest >= 90,
      oldestSessionDate: oldestSession?.startedAt || null,
      daysSinceOldest,
    };
  }

  /**
   * Purge manuelle explicite demandée par l'enseignant (AM) ou administrateur (AS).
   */
  async purgeSessions(dto: PurgeSessionsDto) {
    const where: any = {
      instanceId: dto.instanceId,
    };

    if (dto.schoolYear) {
      where.schoolYear = dto.schoolYear;
    }

    if (dto.olderThanDays && dto.olderThanDays > 0) {
      const thresholdDate = new Date(Date.now() - dto.olderThanDays * 24 * 60 * 60 * 1000);
      where.startedAt = { lt: thresholdDate };
    }

    // Suppression en cascade (SessionEvent lié à PlayerSession onDelete: Cascade)
    const result = await this.prisma.playerSession.deleteMany({
      where,
    });

    return {
      deletedCount: result.count,
      message: `${result.count} session(s) de traçabilité purgée(s) avec succès.`,
    };
  }
}

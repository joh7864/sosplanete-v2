import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface ArcadeScoreEntry {
  id: number;
  rank: number;
  childId: number;
  childPseudo: string;
  teamId: number;
  teamName: string;
  score: number;
  waveReached: number;
  createdAt: Date;
}

@Injectable()
export class ArcadeService {
  private readonly logger = new Logger(ArcadeService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Récupérer les jeux débloqués par l'équipe du joueur
   */
  async getUnlockedGames(teamId: number): Promise<string[]> {
    const unlocks = await this.prisma.teamUnlockedArcadeGame.findMany({
      where: { teamId },
      select: { gameKey: true },
    });
    return unlocks.map((u) => u.gameKey);
  }

  /**
   * Débloquer un jeu pour l'équipe suite à un Easter Egg / énigme
   */
  async unlockGameForTeam(
    teamId: number,
    gameKey: string,
    easterEggCode?: string,
    discoveredByChildId?: number,
  ) {
    this.logger.log(
      `Déblocage mini-jeu "${gameKey}" pour l'équipe ${teamId} (Easter Egg: ${easterEggCode})`,
    );
    return this.prisma.teamUnlockedArcadeGame.upsert({
      where: {
        teamId_gameKey: {
          teamId,
          gameKey,
        },
      },
      create: {
        teamId,
        gameKey,
        easterEggCode,
        discoveredByChildId,
      },
      update: {},
    });
  }

  /**
   * Récupérer le classement complet scrollable pour un jeu et une année d'instance
   */
  async getHighScores(
    instanceYearId: number,
    gameKey: string = 'space-invaders',
  ): Promise<{ scores: ArcadeScoreEntry[]; total: number }> {
    const rawScores = await this.prisma.arcadeScore.findMany({
      where: {
        instanceYearId,
        gameKey,
      },
      orderBy: [{ score: 'desc' }, { createdAt: 'asc' }],
    });

    const scores: ArcadeScoreEntry[] = rawScores.map((s, index) => ({
      id: s.id,
      rank: index + 1,
      childId: s.childId,
      childPseudo: s.childPseudo,
      teamId: s.teamId,
      teamName: s.teamName,
      score: s.score,
      waveReached: s.waveReached,
      createdAt: s.createdAt,
    }));

    return {
      scores,
      total: scores.length,
    };
  }

  /**
   * Enregistrer un score pour le joueur connecté et calculer son rang
   */
  async recordScore(
    child: any,
    gameKey: string,
    score: number,
    waveReached: number = 1,
  ): Promise<{ savedScore: any; rank: number; total: number }> {
    const team = child.group?.team;
    const instanceYearId = team?.instanceYear?.id || child.instanceYearId;

    if (!team || !instanceYearId) {
      throw new NotFoundException('Contexte équipe ou école introuvable');
    }

    const saved = await this.prisma.arcadeScore.create({
      data: {
        gameKey,
        childId: child.id,
        childPseudo: child.pseudo,
        teamId: team.id,
        teamName: team.name,
        instanceYearId,
        score,
        waveReached,
      },
    });

    // Calcul du rang exact (combien de scores sont strictement supérieurs)
    const higherCount = await this.prisma.arcadeScore.count({
      where: {
        instanceYearId,
        gameKey,
        score: { gt: score },
      },
    });

    const total = await this.prisma.arcadeScore.count({
      where: {
        instanceYearId,
        gameKey,
      },
    });

    const rank = higherCount + 1;

    return {
      savedScore: saved,
      rank,
      total,
    };
  }
}

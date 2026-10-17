import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Headers,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ArcadeService } from './arcade.service';
import { SubmitScoreDto } from './dto/submit-score.dto';
import { LegacyApiService } from '../legacy-api/legacy-api.service';

@ApiTags('Arcade & Mini-Jeux')
@Controller('arcade')
export class ArcadeController {
  constructor(
    private readonly arcadeService: ArcadeService,
    private readonly legacyApiService: LegacyApiService,
  ) {}

  @Get('unlocked')
  @ApiOperation({
    summary: "Récupérer la liste des mini-jeux débloqués par l'équipe du joueur connecté",
  })
  async getUnlockedGames(
    @Headers('authorization') auth: string,
    @Headers('x-instance-id') instanceIdStr?: string,
  ) {
    const child = await this.legacyApiService.getChildFromAuth(auth, instanceIdStr);
    const teamId = child.group?.teamId;
    if (!teamId) {
      return { unlockedGames: [] };
    }
    const unlockedGames = await this.arcadeService.getUnlockedGames(teamId);
    return { unlockedGames };
  }

  @Get('scores/:gameKey')
  @ApiOperation({
    summary: "Récupérer le classement global scrollable de l'instance pour un mini-jeu",
  })
  async getHighScores(
    @Param('gameKey') gameKey: string,
    @Headers('authorization') auth: string,
    @Headers('x-instance-id') instanceIdStr?: string,
  ) {
    const child = await this.legacyApiService.getChildFromAuth(auth, instanceIdStr);
    const instanceYearId = child.group?.team?.instanceYearId;
    if (!instanceYearId) {
      throw new BadRequestException("Année d'instance introuvable");
    }
    return this.arcadeService.getHighScores(instanceYearId, gameKey);
  }

  @Post('scores/:gameKey')
  @ApiOperation({
    summary: "Enregistrer un nouveau score de fin de partie pour le joueur connecté",
  })
  async recordScore(
    @Param('gameKey') gameKey: string,
    @Body() dto: SubmitScoreDto,
    @Headers('authorization') auth: string,
    @Headers('x-instance-id') instanceIdStr?: string,
  ) {
    const child = await this.legacyApiService.getChildFromAuth(auth, instanceIdStr);
    return this.arcadeService.recordScore(
      child,
      gameKey,
      dto.score,
      dto.waveReached,
    );
  }
}

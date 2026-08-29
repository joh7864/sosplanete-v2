import { Controller, Get, Post, Param, Query, Headers, Body, Patch, UploadedFile, UseInterceptors, BadRequestException } from '@nestjs/common';
import { EvoeService } from './evoe.service';
import { ApiOperation, ApiTags, ApiConsumes } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';

@ApiTags('Evoe')
@Controller('evoe')
export class EvoeController {
  constructor(private readonly evoeService: EvoeService) {}

  @Get('missions/:instanceId')
  @ApiOperation({
    summary: 'Liste les missions physiques mappées en mode SF (Codex)',
  })
  getMissions(
    @Param('instanceId') instanceId: string,
    @Query('schoolYear') schoolYear: string,
  ) {
    const sy = schoolYear || '2024-2025';
    return this.evoeService.getMissions(+instanceId, sy);
  }

  @Get('dashboard/status/:instanceId')
  @ApiOperation({
    summary: 'Statut du nexus temporel et des équipes (glitch, progression)',
  })
  getDashboardStatus(
    @Param('instanceId') instanceId: string,
    @Headers('authorization') auth: string,
    @Headers('x-instance-id') instanceIdStr?: string,
  ) {
    // Toujours résoudre le schoolYear depuis le token du joueur authentifié.
    // Le frontend envoie systématiquement le token — plus de fallback codé en dur.
    return this.evoeService.getDashboardStatusAuth(
      auth,
      instanceIdStr || instanceId,
    );
  }

  @Get('extrapolation/metrics')
  @ApiOperation({
    summary: "Récupère les métriques d'extrapolation mondiale d'Evoe",
  })
  getExtrapolationMetrics(
    @Headers('authorization') auth: string,
    @Headers('x-instance-id') instanceIdStr?: string,
  ) {
    return this.evoeService.getExtrapolationMetrics(auth, instanceIdStr);
  }

  @Get('context')
  @ApiOperation({
    summary:
      'Récupère le contexte complet pour le frontend Evoe (3D et missions)',
  })
  getContext(
    @Headers('authorization') auth: string,
    @Headers('x-instance-id') instanceIdStr?: string,
  ) {
    return this.evoeService.getContext(auth, instanceIdStr);
  }

  @Get('onboarding-steps')
  @ApiOperation({
    summary: "Récupère les étapes de l'On-Boarding sécurisées pour le joueur connecté",
  })
  getOnboardingSteps(
    @Headers('authorization') auth: string,
    @Headers('x-instance-id') instanceIdStr?: string,
  ) {
    return this.evoeService.getOnboardingSteps(auth, instanceIdStr);
  }

  @Post('propulsion/reset/:instanceId')
  @ApiOperation({
    summary:
      'Réinitialise de force les niveaux technologiques de propulsion pour recalcul',
  })
  resetPropulsionLevels(
    @Param('instanceId') instanceId: string,
    @Query('schoolYear') schoolYear: string,
    @Headers('authorization') auth?: string,
    @Headers('x-instance-id') instanceIdStr?: string,
  ) {
    if (!schoolYear && auth) {
      return this.evoeService.resetPropulsionLevelsAuth(
        auth,
        instanceIdStr || instanceId,
      );
    }
    const sy = schoolYear || '2024-2025';
    return this.evoeService.resetPropulsionLevels(+instanceId, sy);
  }

  @Get('challenges')
  @ApiOperation({
    summary: "Liste les défis PvP (reçus et envoyés) pour l'équipe active",
  })
  getChallenges(
    @Headers('authorization') auth: string,
    @Headers('x-instance-id') instanceIdStr?: string,
  ) {
    return this.evoeService.getChallenges(auth, instanceIdStr);
  }

  @Post('challenges')
  @ApiOperation({
    summary: 'Crée un nouveau défi PvP pour une équipe cible',
  })
  createChallenge(
    @Headers('authorization') auth: string,
    @Headers('x-instance-id') instanceIdStr: string,
    @Body() data: { targetTeamId: number; localActionId: number; pledge: string },
  ) {
    return this.evoeService.createChallenge(auth, instanceIdStr, data);
  }

  @Post('challenges/:id/respond')
  @ApiOperation({
    summary: 'Accepte ou refuse un défi PvP reçu',
  })
  respondChallenge(
    @Param('id') challengeId: string,
    @Headers('authorization') auth: string,
    @Headers('x-instance-id') instanceIdStr: string,
    @Body() body: { accept: boolean },
  ) {
    return this.evoeService.respondChallenge(auth, instanceIdStr, +challengeId, body.accept);
  }

  @Get('profile/:childId')
  @ApiOperation({
    summary: "Récupère le profil complet d'un agent temporel",
  })
  getPlayerProfile(@Param('childId') childId: string) {
    return this.evoeService.getPlayerProfile(+childId);
  }

  @Post('profile/upload-avatar')
  @ApiOperation({ summary: "Upload d'un avatar pour un agent temporel" })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (req, file, cb) => {
          const basePath =
            process.env.UPLOADS_DIR ||
            join(__dirname, '..', '..', '..', '..', '..', '..', 'uploads');
          const path = join(basePath, 'avatars');
          const fs = require('fs');
          if (!fs.existsSync(path)) {
            fs.mkdirSync(path, { recursive: true });
          }
          cb(null, path);
        },
        filename: (req, file, cb) => {
          const unique = Date.now() + '-' + Math.round(Math.random() * 1e6);
          cb(null, unique + extname(file.originalname));
        },
      }),
      fileFilter: (req, file, cb) => {
        const allowed = ['.png', '.jpg', '.jpeg', '.gif', '.webp'];
        if (allowed.includes(extname(file.originalname).toLowerCase())) {
          cb(null, true);
        } else {
          cb(new BadRequestException('Format de fichier non supporté'), false);
        }
      },
      limits: { fileSize: 2 * 1024 * 1024 }, // 2 Mo max
    }),
  )
  async uploadAvatar(
    @Headers('authorization') auth: string,
    @Headers('x-instance-id') instanceIdStr: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) throw new BadRequestException('Aucun fichier reçu');
    // Validation de l'authentification
    await this.evoeService.verifyAuth(auth, instanceIdStr);
    return { filename: `avatars/${file.filename}` };
  }

  @Patch('profile')
  @ApiOperation({ summary: "Mise à jour du profil d'un agent temporel" })
  async updateProfile(
    @Headers('authorization') auth: string,
    @Headers('x-instance-id') instanceIdStr: string,
    @Body() body: { pseudo?: string; password?: string; gender?: string | null; birthDate?: string | null; avatar?: string | null },
  ) {
    return this.evoeService.updateProfile(auth, instanceIdStr, body);
  }
}

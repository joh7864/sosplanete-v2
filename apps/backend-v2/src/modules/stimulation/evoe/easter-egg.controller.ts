import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Headers,
  Query,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiConsumes } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import * as fs from 'fs';
import {
  EasterEggService,
  SubmitAnswerDto,
  ValidateTriggerDto,
  ShareEasterEggDto,
  CreateEasterEggDto,
  UpdateEasterEggDto,
  UpdateEasterEggSettingsDto,
} from './easter-egg.service';
import { LegacyApiService } from '../../legacy-api/legacy-api.service';

function getUploadsDir(): string {
  if (process.env.UPLOADS_DIR && fs.existsSync(process.env.UPLOADS_DIR)) {
    return process.env.UPLOADS_DIR;
  }
  const candidates = [
    join(process.cwd(), 'uploads'),
    join(process.cwd(), '..', '..', 'uploads'),
    join(process.cwd(), '..', 'uploads'),
  ];
  for (const c of candidates) {
    if (fs.existsSync(c)) return c;
  }
  return join(process.cwd(), 'uploads');
}

@ApiTags('Easter Eggs')
@Controller('evoe/easter-eggs')
export class EasterEggController {
  constructor(
    private readonly easterEggService: EasterEggService,
    private readonly legacyApiService: LegacyApiService,
  ) {}

  @Get('active')
  @ApiOperation({
    summary: "Récupère l'Easter Egg actif pour la période du joueur connecté",
  })
  async getActiveEasterEgg(
    @Headers('authorization') auth: string,
    @Headers('x-instance-id') instanceIdStr?: string,
  ) {
    const child = await this.legacyApiService.getChildFromAuth(auth, instanceIdStr);
    return this.easterEggService.getActiveEasterEgg(child.id);
  }

  @Post('verify-answer')
  @ApiOperation({
    summary: 'Vérifie la réponse saisie par le joueur (ex: cadenas à 4 chiffres)',
  })
  async verifyAnswer(
    @Headers('authorization') auth: string,
    @Body() dto: SubmitAnswerDto,
    @Headers('x-instance-id') instanceIdStr?: string,
  ) {
    const child = await this.legacyApiService.getChildFromAuth(auth, instanceIdStr);
    return this.easterEggService.verifyAnswer(child.id, dto);
  }

  @Post('validate-trigger')
  @ApiOperation({
    summary: 'Valide un déclencheur d’exploration (Konami, clic globe 2026, Comm-Link...)',
  })
  async validateTrigger(
    @Headers('authorization') auth: string,
    @Body() dto: ValidateTriggerDto,
    @Headers('x-instance-id') instanceIdStr?: string,
  ) {
    const child = await this.legacyApiService.getChildFromAuth(auth, instanceIdStr);
    return this.easterEggService.validateTrigger(child.id, dto);
  }

  @Post('interact')
  @ApiOperation({
    summary: 'Enregistre la première interaction avec l’œuf (démarre le timer pour l’indice explicite)',
  })
  async recordInteraction(
    @Headers('authorization') auth: string,
    @Body('easterEggId') easterEggId: number,
    @Headers('x-instance-id') instanceIdStr?: string,
  ) {
    const child = await this.legacyApiService.getChildFromAuth(auth, instanceIdStr);
    return this.easterEggService.recordInteraction(child.id, easterEggId);
  }

  @Post('share')
  @ApiOperation({
    summary: 'Partage un indice ou la solution dans le Comm-Link',
  })
  async shareEasterEgg(
    @Headers('authorization') auth: string,
    @Body() dto: ShareEasterEggDto,
    @Headers('x-instance-id') instanceIdStr?: string,
  ) {
    const child = await this.legacyApiService.getChildFromAuth(auth, instanceIdStr);
    return this.easterEggService.shareEasterEgg(child.id, dto);
  }

  @Get('leaderboard')
  @ApiOperation({
    summary: 'Leaderboard des Détectives Temporels (individuel et équipes)',
  })
  async getLeaderboard(
    @Query('instanceYearId') instanceYearId?: string,
    @Headers('authorization') auth?: string,
    @Headers('x-instance-id') instanceIdStr?: string,
  ) {
    let resolvedInstanceYearId = instanceYearId ? +instanceYearId : undefined;
    if (!resolvedInstanceYearId && auth) {
      try {
        const child = await this.legacyApiService.getChildFromAuth(auth, instanceIdStr);
        if (child?.group?.team?.instanceYearId) {
          resolvedInstanceYearId = child.group.team.instanceYearId;
        }
      } catch {
        // Ignorer si token non valide ou admin
      }
    }
    return this.easterEggService.getDetectiveLeaderboard(resolvedInstanceYearId);
  }

  @Get('chrono-egg/archive')
  @ApiOperation({
    summary: 'Récupère la frise des périodes et glyphes pour le Chrono-Egg',
  })
  async getChronoEggArchive(
    @Headers('authorization') auth: string,
    @Headers('x-instance-id') instanceIdStr?: string,
  ) {
    const child = await this.legacyApiService.getChildFromAuth(auth, instanceIdStr);
    return this.easterEggService.getChronoEggArchive(child.id);
  }

  @Post('chrono-egg/reopen-period')
  @ApiOperation({
    summary: 'Relance une énigme d’une période passée pour rattrapage temporel',
  })
  async reopenPeriodEgg(
    @Headers('authorization') auth: string,
    @Body('periodId') periodId: number,
    @Headers('x-instance-id') instanceIdStr?: string,
  ) {
    const child = await this.legacyApiService.getChildFromAuth(auth, instanceIdStr);
    return this.easterEggService.reopenPeriodEgg(child.id, +periodId);
  }

  @Post('meta-enigma/submit-code')
  @ApiOperation({
    summary: 'Valide le mot de passe final dans le Terminal Temporel',
  })
  async submitMetaEnigmaCode(
    @Headers('authorization') auth: string,
    @Body('code') code: string,
    @Headers('x-instance-id') instanceIdStr?: string,
  ) {
    const child = await this.legacyApiService.getChildFromAuth(auth, instanceIdStr);
    return this.easterEggService.submitMetaEnigmaCode(child.id, code);
  }

  // --- Endpoints d'Administration ---

  @Get('admin/catalog')
  @ApiOperation({ summary: 'Liste toutes les énigmes du catalogue' })
  async getAdminCatalog() {
    return this.easterEggService.getAdminCatalog();
  }

  @Post('admin/catalog')
  @ApiOperation({ summary: 'Crée une nouvelle énigme dans le catalogue' })
  async createEasterEgg(@Body() dto: CreateEasterEggDto) {
    return this.easterEggService.createEasterEgg(dto);
  }

  @Put('admin/catalog/:id')
  @ApiOperation({ summary: 'Modifie une énigme existante' })
  async updateEasterEgg(
    @Param('id') id: string,
    @Body() dto: UpdateEasterEggDto,
  ) {
    return this.easterEggService.updateEasterEgg(+id, dto);
  }

  @Delete('admin/catalog/:id')
  @ApiOperation({ summary: 'Supprime une énigme du catalogue' })
  async deleteEasterEgg(@Param('id') id: string) {
    return this.easterEggService.deleteEasterEgg(+id);
  }

  @Post('admin/catalog/reorder')
  @ApiOperation({ summary: 'Réordonne les énigmes du catalogue (Drag & Drop)' })
  async reorderCatalog(@Body('orderedIds') orderedIds: number[]) {
    if (!Array.isArray(orderedIds)) {
      throw new BadRequestException('orderedIds doit être un tableau d’identifiants');
    }
    return this.easterEggService.reorderCatalog(orderedIds);
  }

  @Post('admin/upload-image')
  @ApiOperation({ summary: 'Upload une image d’énigme/schéma visuel' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (req, file, cb) => {
          const baseUploads = getUploadsDir();
          const targetDir = join(baseUploads, 'easter-eggs');
          if (!fs.existsSync(targetDir)) {
            fs.mkdirSync(targetDir, { recursive: true });
          }
          cb(null, targetDir);
        },
        filename: (req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname).toLowerCase();
          cb(null, `enigma-${uniqueSuffix}${ext}`);
        },
      }),
      limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
    }),
  )
  uploadEnigmaImage(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('Aucun fichier fourni');
    const relativeUrl = `/uploads/easter-eggs/${file.filename}`;
    return { imageUrl: relativeUrl, filename: file.filename };
  }

  @Get('admin/tracking/:instanceYearId')
  @ApiOperation({
    summary: 'Suivi AM en direct de l’énigme active (avancement par équipe et journal)',
  })
  async getAdminTracking(
    @Param('instanceYearId') instanceYearId: string,
    @Query('eggId') eggId?: string,
  ) {
    return this.easterEggService.getAdminTracking(
      +instanceYearId,
      eggId ? +eggId : undefined,
    );
  }

  @Put('admin/settings/:instanceYearId')
  @ApiOperation({ summary: 'Met à jour les paramètres Easter Eggs d’une instance' })
  async updateSettings(
    @Param('instanceYearId') instanceYearId: string,
    @Body() dto: UpdateEasterEggSettingsDto,
  ) {
    return this.easterEggService.updateSettings(+instanceYearId, dto);
  }

  @Post('admin/open-instance')
  @ApiOperation({ summary: 'Déclenche/Ouvre manuellement un Easter Egg pour l’instance sur la période active' })
  async openInstanceEgg(
    @Body('instanceYearId') instanceYearId: number,
    @Body('easterEggId') easterEggId: number,
    @Body('closePrevious') closePrevious?: boolean,
  ) {
    if (!instanceYearId || !easterEggId) {
      throw new BadRequestException('instanceYearId et easterEggId sont requis');
    }
    return this.easterEggService.openInstanceEgg(
      +instanceYearId,
      +easterEggId,
      closePrevious !== false,
    );
  }

  @Post('admin/close-instance')
  @ApiOperation({ summary: 'Clôture manuellement l’Easter Egg actif pour l’instance' })
  async closeInstanceEgg(
    @Body('instanceYearId') instanceYearId: number,
    @Body('easterEggId') easterEggId?: number,
  ) {
    if (!instanceYearId) {
      throw new BadRequestException('instanceYearId est requis');
    }
    return this.easterEggService.closeInstanceEgg(+instanceYearId, easterEggId ? +easterEggId : undefined);
  }

  @Post('admin/force-hint')
  @ApiOperation({ summary: 'Force l’affichage immédiat du 2ème indice pour tous les joueurs' })
  async forceInstanceHint(
    @Body('instanceYearId') instanceYearId: number,
    @Body('easterEggId') easterEggId?: number,
  ) {
    if (!instanceYearId) {
      throw new BadRequestException('instanceYearId est requis');
    }
    return this.easterEggService.forceInstanceHint(+instanceYearId, easterEggId ? +easterEggId : undefined);
  }
}

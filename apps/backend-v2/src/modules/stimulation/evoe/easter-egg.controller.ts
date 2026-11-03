import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  ParseIntPipe,
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
import { EasterEggService } from './easter-egg.service';
import {
  SubmitAnswerDto,
  ValidateTriggerDto,
  ShareEasterEggDto,
  CreateEasterEggDto,
  UpdateEasterEggDto,
  UpdateEasterEggSettingsDto,
  ResetEggProgressDto,
  ImportCatalogDto,
  InteractEggDto,
  ReopenPeriodDto,
  MetaEnigmaCodeDto,
  ReorderCatalogDto,
  OpenInstanceEggDto,
  CloseInstanceEggDto,
  ForceHintDto,
} from './dto/easter-egg.dto';
import { LegacyApiService } from '../../legacy-api/legacy-api.service';
import { AdminOnly } from '../../auth/admin-only.decorator';

/** Extensions d'images acceptées pour les visuels d'énigmes (SVG exclu : vecteur XSS). */
const ALLOWED_IMAGE_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.gif', '.webp'];

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

  // --- Endpoints Joueur (authentification via Authorization : Bearer/Basic) ---

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
    @Body() dto: InteractEggDto,
    @Headers('x-instance-id') instanceIdStr?: string,
  ) {
    const child = await this.legacyApiService.getChildFromAuth(auth, instanceIdStr);
    return this.easterEggService.recordInteraction(child.id, dto.easterEggId);
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
    @Body() dto: ReopenPeriodDto,
    @Headers('x-instance-id') instanceIdStr?: string,
  ) {
    const child = await this.legacyApiService.getChildFromAuth(auth, instanceIdStr);
    return this.easterEggService.reopenPeriodEgg(child.id, dto.periodId);
  }

  @Post('meta-enigma/submit-code')
  @ApiOperation({
    summary: 'Valide le mot de passe final dans le Terminal Temporel',
  })
  async submitMetaEnigmaCode(
    @Headers('authorization') auth: string,
    @Body() dto: MetaEnigmaCodeDto,
    @Headers('x-instance-id') instanceIdStr?: string,
  ) {
    const child = await this.legacyApiService.getChildFromAuth(auth, instanceIdStr);
    return this.easterEggService.submitMetaEnigmaCode(child.id, dto.code);
  }

  @Get('my-discoveries')
  @ApiOperation({
    summary: 'Récupère la liste des Easter Eggs résolus par le joueur connecté',
  })
  async getMyDiscoveries(
    @Headers('authorization') auth: string,
    @Headers('x-instance-id') instanceIdStr?: string,
  ) {
    const child = await this.legacyApiService.getChildFromAuth(auth, instanceIdStr);
    return this.easterEggService.getMyDiscoveredEasterEggs(child.id);
  }

  // --- Endpoints d'Administration (JWT back-office + rôle AS/AM obligatoires) ---

  @Get('admin/catalog')
  @AdminOnly()
  @ApiOperation({ summary: 'Liste toutes les énigmes du catalogue' })
  async getAdminCatalog() {
    return this.easterEggService.getAdminCatalog();
  }

  @Get('admin/catalog/export')
  @AdminOnly()
  @ApiOperation({ summary: 'Exporte le catalogue complet des Easter Eggs avec toutes leurs caractéristiques' })
  async exportCatalog() {
    return this.easterEggService.exportCatalog();
  }

  @Post('admin/catalog/import')
  @AdminOnly()
  @ApiOperation({ summary: 'Importe un catalogue d’Easter Eggs (mode upsert ou replace)' })
  async importCatalog(@Body() dto: ImportCatalogDto) {
    return this.easterEggService.importCatalog(dto);
  }

  @Post('admin/catalog')
  @AdminOnly()
  @ApiOperation({ summary: 'Crée une nouvelle énigme dans le catalogue' })
  async createEasterEgg(@Body() dto: CreateEasterEggDto) {
    return this.easterEggService.createEasterEgg(dto);
  }

  @Put('admin/catalog/:id')
  @AdminOnly()
  @ApiOperation({ summary: 'Modifie une énigme existante' })
  async updateEasterEgg(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateEasterEggDto,
  ) {
    return this.easterEggService.updateEasterEgg(id, dto);
  }

  @Delete('admin/catalog/:id')
  @AdminOnly()
  @ApiOperation({ summary: 'Supprime une énigme du catalogue' })
  async deleteEasterEgg(@Param('id', ParseIntPipe) id: number) {
    return this.easterEggService.deleteEasterEgg(id);
  }

  @Post('admin/catalog/reorder')
  @AdminOnly()
  @ApiOperation({ summary: 'Réordonne les énigmes du catalogue (Drag & Drop)' })
  async reorderCatalog(@Body() dto: ReorderCatalogDto) {
    return this.easterEggService.reorderCatalog(dto.orderedIds);
  }

  @Post('admin/upload-image')
  @AdminOnly()
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
      fileFilter: (req, file, cb) => {
        const ext = extname(file.originalname).toLowerCase();
        if (ALLOWED_IMAGE_EXTENSIONS.includes(ext) && file.mimetype.startsWith('image/')) {
          cb(null, true);
        } else {
          cb(new BadRequestException('Format d’image non supporté (png, jpg, gif, webp)'), false);
        }
      },
      limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
    }),
  )
  uploadEnigmaImage(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('Aucun fichier fourni');
    const relativeUrl = `/uploads/easter-eggs/${file.filename}`;
    return { imageUrl: relativeUrl, filename: file.filename };
  }

  @Get('admin/tracking/:instanceYearId')
  @AdminOnly()
  @ApiOperation({
    summary: 'Suivi AM en direct de l’énigme active (avancement par équipe et journal)',
  })
  async getAdminTracking(
    @Param('instanceYearId', ParseIntPipe) instanceYearId: number,
    @Query('eggId') eggId?: string,
  ) {
    return this.easterEggService.getAdminTracking(
      instanceYearId,
      eggId ? +eggId : undefined,
    );
  }

  @Get('admin/chrono-frise/:instanceYearId')
  @AdminOnly()
  @ApiOperation({
    summary: 'Chrono-Frise de la saison pour le cockpit administrateur (suivi des énigmes par cycle et équipe)',
  })
  async getAdminChronoFrise(@Param('instanceYearId', ParseIntPipe) instanceYearId: number) {
    return this.easterEggService.getAdminChronoFrise(instanceYearId);
  }

  @Put('admin/settings/:instanceYearId')
  @AdminOnly()
  @ApiOperation({ summary: 'Met à jour les paramètres Easter Eggs d’une instance' })
  async updateSettings(
    @Param('instanceYearId', ParseIntPipe) instanceYearId: number,
    @Body() dto: UpdateEasterEggSettingsDto,
  ) {
    return this.easterEggService.updateSettings(instanceYearId, dto);
  }

  @Post('admin/open-instance')
  @AdminOnly()
  @ApiOperation({ summary: 'Déclenche/Ouvre manuellement un Easter Egg pour l’instance sur la période active' })
  async openInstanceEgg(@Body() dto: OpenInstanceEggDto) {
    return this.easterEggService.openInstanceEgg(
      dto.instanceYearId,
      dto.easterEggId,
      dto.closePrevious !== false,
    );
  }

  @Post('admin/close-instance')
  @AdminOnly()
  @ApiOperation({ summary: 'Clôture manuellement l’Easter Egg actif pour l’instance' })
  async closeInstanceEgg(@Body() dto: CloseInstanceEggDto) {
    return this.easterEggService.closeInstanceEgg(dto.instanceYearId, dto.easterEggId);
  }

  @Post('admin/force-hint')
  @AdminOnly()
  @ApiOperation({
    summary:
      'Force l’affichage immédiat du 2ème indice (pour tous ou par équipe ciblée, avec possibilité de révocation)',
  })
  async forceInstanceHint(@Body() dto: ForceHintDto) {
    return this.easterEggService.forceInstanceHint(
      dto.instanceYearId,
      dto.easterEggId,
      dto.teamId,
      !!dto.revoke,
    );
  }

  @Post('admin/reset-progress')
  @AdminOnly()
  @ApiOperation({ summary: 'Réinitialise la progression et les récompenses des Easter Eggs (unitaire, sélection ou tous)' })
  async resetEggProgress(@Body() dto: ResetEggProgressDto) {
    return this.easterEggService.resetEggProgress(dto);
  }
}

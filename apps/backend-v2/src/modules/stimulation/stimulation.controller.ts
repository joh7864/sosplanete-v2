import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Put,
  Request,
  Query,
  HttpCode,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import * as fs from 'fs';
import { randomUUID } from 'crypto';
import { StimulationService } from './stimulation.service';
import { AnimalUnlockService } from './animal-unlock.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { EcoBarRaceService } from './eco-bar-race.service';
import { ApiOperation } from '@nestjs/swagger';
import { WhatsAppService } from './whatsapp.service';

@Controller('stimulation')
@UseGuards(JwtAuthGuard)
export class StimulationController {
  @Get('years')
  @ApiOperation({ summary: 'Liste des années scolaires disponibles' })
  getAvailableYears() {
    return this.stimulationService.getAvailableYears();
  }

  @Post('initialize-year')
  @ApiOperation({ summary: 'Initialiser une nouvelle année scolaire (global)' })
  initializeYear(@Body() data: { schoolYear: string }, @Request() req: any) {
    return this.stimulationService.initializeYear(data.schoolYear, req.user);
  }

  constructor(
    private readonly stimulationService: StimulationService,
    private readonly animalUnlockService: AnimalUnlockService,
    private readonly ecoBarRaceService: EcoBarRaceService,
    private readonly whatsAppService: WhatsAppService,
  ) {}

  @Post('whatsapp/send-report')
  @ApiOperation({
    summary: "Déclencher manuellement l'envoi du rapport WhatsApp",
  })
  sendWhatsAppReport(@Query('schoolYear') schoolYear: string) {
    return this.whatsAppService.sendReport(schoolYear);
  }

  @Post('whatsapp/send-test')
  @ApiOperation({ summary: 'Envoyer ou simuler un message de test WhatsApp' })
  sendWhatsAppTest(
    @Query('schoolYear') schoolYear: string,
    @Body() body: { gatewayUrl?: string; chatId?: string; message?: string },
  ) {
    return this.whatsAppService.sendTestMessage(
      schoolYear,
      body.gatewayUrl,
      body.chatId,
      body.message,
    );
  }

  @Get('system-config')
  getSystemConfig(@Query('schoolYear') schoolYear: string) {
    return this.stimulationService.getSystemConfig(schoolYear);
  }

  @Put('system-config')
  updateSystemConfig(
    @Body() data: any,
    @Query('schoolYear') schoolYear: string,
    @Request() req: any,
  ) {
    return this.stimulationService.updateSystemConfig(
      data,
      schoolYear,
      req.user,
    );
  }

  @Post('system-config/upload-image')
  @ApiOperation({ summary: 'Uploader une image pour le FTUX' })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (_req, _file, cb) => {
          const basePath =
            process.env.UPLOADS_DIR ||
            join(__dirname, '..', '..', '..', '..', '..', 'uploads');
          const path = join(basePath, 'ftux');
          if (!fs.existsSync(path)) {
            fs.mkdirSync(path, { recursive: true });
          }
          cb(null, path);
        },
        filename: (_req, file, cb) => {
          const uniqueSuffix = randomUUID();
          cb(null, `${uniqueSuffix}${extname(file.originalname)}`);
        },
      }),
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
      },
      fileFilter: (_req, file, cb) => {
        if (!file.mimetype.match(/^image\/(jpg|jpeg|png|gif|webp)$/)) {
          return cb(new Error('Only image files are allowed!'), false);
        }
        cb(null, true);
      },
    }),
  )
  uploadFtuxImage(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new Error('No file uploaded');
    }
    const publicUrl = `/uploads/ftux/${file.filename}`;
    return { url: publicUrl };
  }

  @Get('game-config/:instanceId')
  getGameConfig(
    @Param('instanceId') instanceId: string,
    @Query('schoolYear') schoolYear: string,
    @Request() req: any,
  ) {
    return this.stimulationService.getGameConfig(
      +instanceId,
      schoolYear,
      req.user,
    );
  }

  @Put('game-config/:instanceId')
  @HttpCode(410)
  updateGameConfig() {
    // DÉPRÉCIÉE — La config du jeu est désormais gérée exclusivement via PATCH /instances/:id
    // qui garantit l'atomicité via une transaction Prisma unique.
    // Cette route ne sera plus utilisée et sera supprimée dans une prochaine version.
    throw new Error(
      'Cette route est dépréciée. Utilisez PATCH /instances/:id pour modifier la configuration du jeu.',
    );
  }

  @Get('animals/:instanceId/history')
  getAnimalUnlockHistory(
    @Param('instanceId') instanceId: string,
    @Query('schoolYear') schoolYear: string,
  ) {
    const sy = schoolYear || '2024-2025';
    return this.animalUnlockService.getUnlockHistory(+instanceId, sy);
  }

  @Get('animals/:instanceId/current')
  getCurrentAnimalUnlock(
    @Param('instanceId') instanceId: string,
    @Query('schoolYear') schoolYear: string,
  ) {
    const sy = schoolYear || '2024-2025';
    return this.animalUnlockService.getCurrentUnlock(+instanceId, sy);
  }

  @Post('animals/:instanceId/recalculate')
  recalculateAnimals(
    @Param('instanceId') instanceId: string,
    @Query('schoolYear') schoolYear: string,
  ) {
    const sy = schoolYear || '2024-2025';
    return this.animalUnlockService.recalculateAllPeriods(+instanceId, sy);
  }

  // --- ECO-BAR-RACE ---

  @Get('eco-bar-race/history')
  getEcoBarRaceHistory(@Query('schoolYear') schoolYear: string) {
    const sy = schoolYear || '2024-2025';
    return this.ecoBarRaceService.getHistory(sy);
  }

  @Post('eco-bar-race/recalculate')
  recalculateEcoBarRace(@Query('schoolYear') schoolYear: string) {
    const sy = schoolYear || '2024-2025';
    return this.ecoBarRaceService.recalculateAllHistory(sy);
  }
}

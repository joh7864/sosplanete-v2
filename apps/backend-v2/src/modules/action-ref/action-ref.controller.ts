import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  ParseIntPipe,
  BadRequestException,
} from '@nestjs/common';
import { ActionRefService } from './action-ref.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@prisma/client';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import * as fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

@ApiTags('Référentiel Actions (Global)')
@Controller('action-ref')
export class ActionRefController {
  constructor(private readonly actionRefService: ActionRefService) {}

  @Post('import')
  @Roles(Role.AS)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiOperation({
    summary:
      "Importation du référentiel d'actions depuis un fichier CSV uploadé",
  })
  async import(@UploadedFile() file: Express.Multer.File) {
    return this.actionRefService.importFromCSV(file.buffer);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Récupérer tout le référentiel des actions' })
  async findAll() {
    return this.actionRefService.findAll();
  }

  @Post('sync-images')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Scanner et synchroniser automatiquement les images depuis uploads' })
  async syncImages() {
    return this.actionRefService.syncImagesFromDisk();
  }

  @Get('search')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Rechercher des actions dans le référentiel (par code ou nom)',
  })
  async search(@Query('q') query: string) {
    return this.actionRefService.search(query || '');
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Récupérer une action du référentiel par son ID" })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.actionRefService.findOne(id);
  }

  @Patch(':id')
  @Roles(Role.AS)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Modifier une action du référentiel global (AS)" })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body()
    body: {
      referenceName?: string;
      description?: string;
      category?: string;
      defaultCo2?: number;
      defaultWater?: number;
      defaultWaste?: number;
      defaultEnergy?: number;
      weightedStars?: number;
      image?: string;
      imageEvoe?: string;
    },
  ) {
    return this.actionRefService.update(id, body);
  }

  @Delete(':id')
  @Roles(Role.AS)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Supprimer une action du référentiel global (AS)" })
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.actionRefService.remove(id);
  }

  @Post('upload-image')
  @Roles(Role.AS)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (req, _file, cb) => {
          const folder = req.query.folder === 'missions' ? 'missions' : 'actions';
          const basePath =
            process.env.UPLOADS_DIR ||
            join(__dirname, '..', '..', '..', '..', '..', 'uploads');
          const destPath = join(basePath, folder);
          if (!fs.existsSync(destPath)) {
            fs.mkdirSync(destPath, { recursive: true });
          }
          cb(null, destPath);
        },
        filename: (_req, file, cb) => {
          const uniqueName = `action-${uuidv4()}${extname(file.originalname)}`;
          cb(null, uniqueName);
        },
      }),
      limits: { fileSize: 25 * 1024 * 1024 }, // 25MB
      fileFilter: (_req, file, cb) => {
        if (!file.mimetype.match(/^image\/(jpeg|png|webp|svg\+xml)$/)) {
          cb(
            new BadRequestException('Format invalide (JPEG, PNG, WebP, SVG).'),
            false,
          );
        }
        cb(null, true);
      },
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: { file: { type: 'string', format: 'binary' } },
    },
  })
  @ApiOperation({ summary: "Uploader une image pour SOS Planète ou Évoé" })
  async uploadImage(
    @UploadedFile() file: Express.Multer.File,
    @Query('folder') folder?: string,
  ) {
    if (!file) throw new BadRequestException('Aucun fichier envoyé.');
    const targetFolder = folder === 'missions' ? 'missions' : 'actions';
    const imageUrl = file.filename;
    return { 
      filename: imageUrl, 
      url: `/uploads/${targetFolder}/${imageUrl}`,
      folder: targetFolder 
    };
  }
}

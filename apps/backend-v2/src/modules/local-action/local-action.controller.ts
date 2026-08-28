import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Req,
  Query,
  ParseIntPipe,
  Patch,
  Delete,
  Param,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { LocalActionService } from './local-action.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import * as fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

@ApiTags('Actions Locales (Espace AM)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('local-actions')
export class LocalActionController {
  constructor(private readonly localActionService: LocalActionService) {}

  @Post()
  @ApiOperation({ summary: "Créer une action personnalisée pour l'instance" })
  async create(
    @Body()
    body: {
      instanceId: number;
      actionRefId: number;
      customLabel?: string;
      categoryId?: number;
      schoolYear?: string;
    },
    @Req() req: any,
  ) {
    return this.localActionService.create(body, req.user);
  }

  @Post('bulk-import')
  @ApiOperation({ summary: "Importation en masse d'actions du référentiel" })
  async bulkImport(
    @Body()
    body: {
      instanceId: number;
      actionRefIds: number[];
      schoolYear?: string;
    },
    @Req() req: any,
  ) {
    return this.localActionService.importFromRef(
      body.instanceId,
      body.actionRefIds,
      body.schoolYear || '2024-2025',
      req.user,
    );
  }

  @Get()
  @ApiOperation({ summary: "Lister le catalogue d'actions de l'instance" })
  @ApiQuery({ name: 'instanceId', required: true, type: Number })
  @ApiQuery({ name: 'schoolYear', required: false, type: String })
  async findAll(
    @Query('instanceId', ParseIntPipe) instanceId: number,
    @Query('schoolYear') schoolYear: string,
    @Req() req: any,
  ) {
    return this.localActionService.findAll(instanceId, schoolYear, req.user);
  }

  @Post('import-csv')
  @ApiOperation({ summary: "Importation personnalisée d'actions via un tableau JSON" })
  async importCsv(
    @Body()
    body: {
      instanceId: number;
      actions: any[];
      schoolYear: string;
    },
    @Req() req: any,
  ) {
    return this.localActionService.importByCodes(
      body.instanceId,
      body.actions,
      body.schoolYear,
      req.user,
    );
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Modifier une action locale' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body()
    body: {
      label?: string;
      description?: string;
      image?: string;
      imageEvoe?: string;
      categoryId?: number | null;
      specificCo2?: number | null;
      specificWater?: number | null;
      specificWaste?: number | null;
      specificEnergy?: number | null;
      titreSF?: string;
      descriptionSF?: string;
      pointsIT?: number;
      pointsGagnes?: number;
    },
    @Req() req: any,
  ) {
    return this.localActionService.update(id, body, req.user);
  }

  @Patch('bulk-assign-category')
  @ApiOperation({
    summary: 'Affecter en masse des actions locales à une catégorie',
  })
  async bulkAssignCategory(
    @Body() body: { actionIds: number[]; categoryId: number | null },
    @Req() req: any,
  ) {
    return this.localActionService.bulkAssignCategory(
      body.actionIds,
      body.categoryId,
      req.user,
    );
  }

  @Post(':id/image')
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
          const uniqueName = `custom-${uuidv4()}${extname(file.originalname)}`;
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
  async uploadImage(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFile() file: Express.Multer.File,
    @Query('folder') folder: string,
    @Req() req: any,
  ) {
    if (!file) throw new BadRequestException('Aucun fichier envoyé.');
    const targetFolder = folder === 'missions' ? 'missions' : 'actions';
    const imageUrl = file.filename;
    
    if (targetFolder === 'missions') {
      await this.localActionService.update(id, { imageEvoe: imageUrl }, req.user);
    } else {
      await this.localActionService.update(id, { image: imageUrl }, req.user);
    }

    return { 
      filename: imageUrl, 
      url: `/uploads/${targetFolder}/${imageUrl}`,
      folder: targetFolder 
    };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Supprimer (dé-mapper) une action locale' })
  async remove(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    return this.localActionService.remove(id, req.user);
  }
}

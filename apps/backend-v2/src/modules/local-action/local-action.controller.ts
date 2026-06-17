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
    body: { instanceId: number; actionRefIds: number[]; schoolYear: string },
    @Req() req: any,
  ) {
    return this.localActionService.importFromRef(
      body.instanceId,
      body.actionRefIds,
      body.schoolYear,
      req.user,
    );
  }

  @Get()
  @ApiOperation({ summary: "Lister le catalogue d'actions de l'instance" })
  @ApiQuery({ name: 'instanceId', type: Number })
  @ApiQuery({ name: 'schoolYear', type: String, required: false })
  async findAll(
    @Query('instanceId', ParseIntPipe) instanceId: number,
    @Query('schoolYear') schoolYear: string,
    @Req() req: any,
  ) {
    return this.localActionService.findAll(instanceId, schoolYear, req.user);
  }

  @Post('import-codes')
  @ApiOperation({ summary: 'Importation en masse par codes' })
  async importCodes(
    @Body() body: { instanceId: number; actions: any[]; schoolYear: string },
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
      categoryId?: number;
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
        destination: (_req, _file, cb) => {
          const basePath =
            process.env.UPLOADS_DIR ||
            join(__dirname, '..', '..', '..', '..', '..', 'uploads');
          const path = join(basePath, 'actions');
          if (!fs.existsSync(path)) {
            fs.mkdirSync(path, { recursive: true });
          }
          cb(null, path);
        },
        filename: (_req, file, cb) => {
          const uniqueName = `custom-${uuidv4()}${extname(file.originalname)}`;
          cb(null, uniqueName);
        },
      }),
      limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
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
    @Req() req: any,
  ) {
    if (!file) throw new BadRequestException('Aucun fichier envoyé.');
    const imageUrl = `/uploads/actions/${file.filename}`;
    await this.localActionService.update(id, { image: imageUrl }, req.user);
    return { url: imageUrl };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Supprimer (dé-mapper) une action locale' })
  async remove(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    return this.localActionService.remove(id, req.user);
  }
}

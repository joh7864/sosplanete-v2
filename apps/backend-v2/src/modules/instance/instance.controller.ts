import { Controller, Get, Post, Body, Param, Patch, Delete, ParseIntPipe, UseGuards, Request, Query } from '@nestjs/common';
import { InstanceService } from './instance.service';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CreateInstanceDto } from './dto/create-instance.dto';
import { UpdateInstanceDto } from './dto/update-instance.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@prisma/client';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import * as fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { BadRequestException, UseInterceptors, UploadedFile } from '@nestjs/common';

import { YearService } from './year.service';

@ApiTags('Instances (Écoles)')
@Controller('instances')
export class InstanceController {
  constructor(
    private readonly instanceService: InstanceService,
    private readonly yearService: YearService
  ) {}

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.AS)
  @ApiOperation({ summary: "Création d'une nouvelle école (instance)" })
  async create(@Body() createInstanceDto: CreateInstanceDto) {
    return this.instanceService.create(createInstanceDto);
  }

  @Get()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: "Liste des écoles (filtrée par rôle)" })
  async findAll(@Request() req: any, @Query('schoolYear') schoolYear: string) {
    return this.instanceService.findAll(req.user.userId, req.user.role, schoolYear);
  }

  @Get(':id')
  @ApiOperation({ summary: "Détails d'une école" })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.instanceService.findOne(id);
  }

  @Patch(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.AS)
  @ApiOperation({ summary: "Mettre à jour une école" })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateInstanceDto: UpdateInstanceDto & { force?: boolean; schoolYear?: string },
  ) {
    return this.instanceService.update(id, updateInstanceDto);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.AS)
  @ApiOperation({ summary: "Supprimer une école (cascade)" })
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.instanceService.remove(id);
  }

  @Post(':id/icon')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: "Uploader une icône/logo pour l'école" })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (_req, _file, cb) => {
          const basePath = process.env.UPLOADS_DIR || join(__dirname, '..', '..', '..', '..', '..', 'uploads');
          const path = join(basePath, 'icons');
          if (!fs.existsSync(path)) {
            fs.mkdirSync(path, { recursive: true });
          }
          cb(null, path);
        },
        filename: (_req, file, cb) => {
          const uniqueName = `${uuidv4()}${extname(file.originalname)}`;
          cb(null, uniqueName);
        },
      }),
      limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
      fileFilter: (_req, file, cb) => {
        if (!file.mimetype.match(/^image\/(jpeg|png|webp)$/)) {
          cb(new BadRequestException('Seuls les formats JPEG, PNG et WebP sont acceptés.'), false);
        }
        cb(null, true);
      },
    }),
  )
  async uploadIcon(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) throw new BadRequestException('Aucun fichier envoyé.');
    const iconUrl = `/uploads/icons/${file.filename}`;
    await this.instanceService.update(id, { icon: iconUrl });
    return { url: iconUrl };
  }

  @Post(':id/initialize-year')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: "Initialiser une nouvelle année scolaire (clonage configuration)" })
  async initializeYear(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { targetYear: string },
  ) {
    return this.yearService.initializeYear(id, body.targetYear);
  }
}

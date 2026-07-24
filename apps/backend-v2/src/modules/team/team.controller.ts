import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
  ParseIntPipe,
  UseGuards,
  Request,
  Query,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { TeamService } from './team.service';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
  ApiConsumes,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateTeamDto } from './dto/create-team.dto';
import { UpdateTeamDto } from './dto/update-team.dto';
import { ImportCsvDto } from './dto/import-csv.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { readdirSync } from 'fs';

@ApiTags('Équipes (Teams)')
@Controller('teams')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class TeamController {
  constructor(private readonly teamService: TeamService) {}

  @Post()
  @ApiOperation({ summary: "Création d'une nouvelle équipe" })
  async create(@Body() createTeamDto: CreateTeamDto, @Request() req: any) {
    return this.teamService.create(createTeamDto, req.user);
  }

  @Get()
  @ApiOperation({ summary: "Liste des équipes d'une instance" })
  @ApiQuery({ name: 'instanceId', type: Number })
  @ApiQuery({ name: 'schoolYear', type: String, required: false })
  @ApiQuery({ name: 'instanceYearId', type: Number, required: false })
  async findAll(
    @Query('instanceId', ParseIntPipe) instanceId: number,
    @Query('schoolYear') schoolYear: string,
    @Query('instanceYearId') instanceYearIdStr: string | undefined,
    @Request() req: any,
  ) {
    const instanceYearId = instanceYearIdStr
      ? parseInt(instanceYearIdStr)
      : undefined;
    return this.teamService.findAll(
      instanceId,
      req.user,
      schoolYear,
      instanceYearId,
    );
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Mettre à jour une équipe' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateTeamDto: UpdateTeamDto,
    @Request() req: any,
  ) {
    return this.teamService.update(id, updateTeamDto, req.user);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Supprimer une équipe (cascade)' })
  async remove(@Param('id', ParseIntPipe) id: number, @Request() req: any) {
    return this.teamService.remove(id, req.user);
  }

  @Post('import-csv')
  @ApiOperation({
    summary: "Import massif d'équipes, groupes et joueurs via CSV",
  })
  @ApiQuery({ name: 'instanceId', type: Number })
  @ApiQuery({ name: 'schoolYear', type: String })
  @ApiQuery({ name: 'instanceYearId', type: Number, required: false })
  async importCsv(
    @Query('instanceId', ParseIntPipe) instanceId: number,
    @Query('schoolYear') schoolYear: string,
    @Query('instanceYearId') instanceYearIdStr: string | undefined,
    @Body() body: ImportCsvDto,
    @Request() req: any,
  ) {
    const instanceYearId = instanceYearIdStr
      ? parseInt(instanceYearIdStr)
      : undefined;
    return this.teamService.importCsv(
      instanceId,
      body.csvContent,
      schoolYear,
      req.user,
      instanceYearId,
    );
  }

  // --- UPLOAD ICONE ---
  @Get('icons')
  @ApiOperation({ summary: 'Liste des icônes disponibles pour les équipes' })
  listIcons() {
    const uploadsDir = process.env.UPLOADS_DIR
      ? join(process.env.UPLOADS_DIR, 'teams')
      : join(__dirname, '..', '..', '..', '..', '..', 'uploads', 'teams');
    try {
      const files = readdirSync(uploadsDir).filter((f) =>
        ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg'].includes(
          extname(f).toLowerCase(),
        ),
      );
      return files;
    } catch {
      return [];
    }
  }

  @Post('upload-icon')
  @ApiOperation({ summary: "Upload d'une icône d'équipe" })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (req, file, cb) => {
          const dest = process.env.UPLOADS_DIR
            ? join(process.env.UPLOADS_DIR, 'teams')
            : join(__dirname, '..', '..', '..', '..', '..', 'uploads', 'teams');
          cb(null, dest);
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
  uploadIcon(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('Aucun fichier reçu');
    return { filename: file.filename };
  }

  @Post('children/upload-avatar')
  @ApiOperation({ summary: "Upload d'un avatar pour un enfant/joueur" })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (req, file, cb) => {
          const basePath =
            process.env.UPLOADS_DIR ||
            join(__dirname, '..', '..', '..', '..', '..', 'uploads');
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
  uploadChildAvatar(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('Aucun fichier reçu');
    return { filename: `avatars/${file.filename}` };
  }

  // --- BULK DELETE ---
  @Post('bulk-delete')
  @ApiOperation({ summary: "Suppression massive d'équipes" })
  async bulkDeleteTeams(@Body() body: { ids: number[] }) {
    return this.teamService.removeTeams(body.ids);
  }

  @Post('groups/bulk-delete')
  @ApiOperation({ summary: 'Suppression massive de groupes' })
  async bulkDeleteGroups(@Body() body: { ids: number[] }) {
    return this.teamService.removeGroups(body.ids);
  }

  @Post('children/bulk-delete')
  @ApiOperation({ summary: 'Suppression massive de joueurs' })
  async bulkDeleteChildren(@Body() body: { ids: number[] }) {
    return this.teamService.removeChildren(body.ids);
  }

  // --- GROUPS CRUD ---
  @Post('groups')
  async createGroup(
    @Body() body: { teamId: number; name: string; color?: string },
  ) {
    return this.teamService.createGroup(body.teamId, body.name, body.color);
  }

  @Patch('groups/:id')
  async updateGroup(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { name?: string; color?: string },
  ) {
    return this.teamService.updateGroup(id, body);
  }

  // --- CHILDREN CRUD ---
  @Post('children')
  async createChild(
    @Body()
    body: {
      groupId: number;
      pseudo: string;
      password?: string;
      isDelegate?: boolean;
      gender?: string;
      birthDate?: string;
      avatar?: string;
    },
  ) {
    return this.teamService.createChild(
      body.groupId,
      body.pseudo,
      body.password,
      body.isDelegate,
      body.gender,
      body.birthDate,
      body.avatar,
    );
  }

  @Patch('children/:id')
  async updateChild(
    @Param('id', ParseIntPipe) id: number,
    @Body()
    body: {
      groupId?: number;
      pseudo?: string;
      password?: string;
      isDelegate?: boolean;
      gender?: string;
      birthDate?: string | null;
      avatar?: string | null;
    },
  ) {
    return this.teamService.updateChild(id, body);
  }
}

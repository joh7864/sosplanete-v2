import { Controller, Get, Post, Query, UseGuards, UseInterceptors, UploadedFile } from '@nestjs/common';
import { ActionRefService } from './action-ref.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@prisma/client';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';

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
  @ApiOperation({ summary: "Importation du référentiel d'actions depuis un fichier CSV uploadé" })
  async import(@UploadedFile() file: Express.Multer.File) {
    return this.actionRefService.importFromCSV(file.buffer);
  }

  @Get('search')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Rechercher des actions dans le référentiel (par code ou nom)" })
  async search(@Query('q') query: string) {
    return this.actionRefService.search(query || '');
  }

  @Get()
  async findAll() {
    return this.actionRefService.findAll();
  }
}

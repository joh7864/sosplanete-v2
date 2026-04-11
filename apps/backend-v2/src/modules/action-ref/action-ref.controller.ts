import { Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { ActionRefService } from './action-ref.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@prisma/client';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Référentiel Actions (Global)')
@Controller('action-ref')
export class ActionRefController {
  constructor(private readonly actionRefService: ActionRefService) {}

  @Post('import')
  @Roles(Role.AS)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: "Importation du référentiel d'actions depuis le fichier CSV" })
  async import() {
    return this.actionRefService.importFromCSV();
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

import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { TelemetryService } from './telemetry.service';
import {
  StartSessionDto,
  LogEventsBatchDto,
  CloseSessionDto,
  PurgeSessionsDto,
} from './dto/telemetry.dto';
import { SessionStatus } from '@prisma/client';

@ApiTags('tracking-telemetry')
@Controller('tracking')
export class TelemetryController {
  constructor(private readonly telemetryService: TelemetryService) {}

  // ==========================================
  // 1. ENDPOINTS D'INGESTION TÉLÉMÉTRIQUE (FRONTEND)
  // ==========================================

  @Post('telemetry/session/start')
  @ApiOperation({ summary: 'Démarrer une nouvelle session joueur et logger l’événement LOGIN' })
  async startSession(@Body() body: StartSessionDto) {
    return this.telemetryService.startSession(body);
  }

  @Post('telemetry/events')
  @ApiOperation({ summary: 'Ingérer un lot d’événements de parcours joueur (batch)' })
  async logEvents(@Body() body: LogEventsBatchDto) {
    return this.telemetryService.logEvents(body);
  }

  @Post('telemetry/close')
  @ApiOperation({ summary: 'Clôturer une session joueur (sendBeacon / logout)' })
  async closeSession(@Body() body: CloseSessionDto) {
    return this.telemetryService.closeSession(body.sessionId);
  }

  // ==========================================
  // 2. ENDPOINTS DE CONSULTATION & COCKPIT ADMIN (PROTÉGÉS JWT)
  // ==========================================

  @Get('sessions')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Récupérer la liste paginée des sessions avec filtres' })
  @ApiQuery({ name: 'instanceId', type: Number })
  @ApiQuery({ name: 'schoolYear', type: String, required: false })
  @ApiQuery({ name: 'teamId', type: Number, required: false })
  @ApiQuery({ name: 'groupId', type: Number, required: false })
  @ApiQuery({ name: 'childPseudo', type: String, required: false })
  @ApiQuery({ name: 'status', enum: SessionStatus, required: false })
  @ApiQuery({ name: 'startDate', type: String, required: false })
  @ApiQuery({ name: 'endDate', type: String, required: false })
  @ApiQuery({ name: 'page', type: Number, required: false })
  @ApiQuery({ name: 'limit', type: Number, required: false })
  async getSessions(
    @Query('instanceId') instanceId: string,
    @Query('schoolYear') schoolYear?: string,
    @Query('teamId') teamId?: string,
    @Query('groupId') groupId?: string,
    @Query('childPseudo') childPseudo?: string,
    @Query('pseudo') pseudo?: string,
    @Query('status') status?: SessionStatus,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.telemetryService.getSessions({
      instanceId: parseInt(instanceId),
      schoolYear,
      teamId: teamId ? parseInt(teamId) : undefined,
      groupId: groupId ? parseInt(groupId) : undefined,
      childPseudo: childPseudo || pseudo,
      status,
      startDate,
      endDate,
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 25,
    });
  }

  @Get('sessions/:id/journey')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Obtenir la timeline complète du parcours d’une session' })
  async getSessionJourney(@Param('id') sessionId: string) {
    return this.telemetryService.getSessionJourney(sessionId);
  }

  @Get('sessions-kpis')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Obtenir les KPIs de connexion et de traçabilité de l’établissement' })
  @ApiQuery({ name: 'instanceId', type: Number })
  @ApiQuery({ name: 'schoolYear', type: String, required: false })
  async getKpis(
    @Query('instanceId') instanceId: string,
    @Query('schoolYear') schoolYear?: string,
  ) {
    return this.telemetryService.getKpis(parseInt(instanceId), schoolYear);
  }

  @Post('sessions/purge')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Purger manuellement les données de traçabilité (action explicite AM/AS)' })
  async purgeSessions(@Body() body: PurgeSessionsDto) {
    return this.telemetryService.purgeSessions(body);
  }
}

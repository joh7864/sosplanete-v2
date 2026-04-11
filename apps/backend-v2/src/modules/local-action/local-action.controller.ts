import { Controller, Get, Post, Body, UseGuards, Req, Query, ParseIntPipe, Patch, Delete, Param } from '@nestjs/common';
import { LocalActionService } from './local-action.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';

@ApiTags('Actions Locales (Espace AM)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('local-actions')
export class LocalActionController {
  constructor(private readonly localActionService: LocalActionService) {}

  @Post()
  @ApiOperation({ summary: 'Mapper une action du référentiel vers l\'espace local' })
  async create(@Body() body: { instanceId: number; actionRefId: number; customLabel?: string; customCategory?: string }, @Req() req: any) {
    return this.localActionService.create(body, req.user);
  }

  @Post('bulk-import')
  @ApiOperation({ summary: 'Importation en masse d\'actions du référentiel' })
  async bulkImport(@Body() body: { instanceId: number; actionRefIds: number[] }, @Req() req: any) {
    return this.localActionService.importFromRef(body.instanceId, body.actionRefIds, req.user);
  }

  @Get()
  @ApiOperation({ summary: 'Lister le catalogue d\'actions de l\'instance' })
  @ApiQuery({ name: 'instanceId', type: Number })
  async findAll(@Query('instanceId', ParseIntPipe) instanceId: number, @Req() req: any) {
    return this.localActionService.findAll(instanceId, req.user);
  }

  @Post('import-codes')
  @ApiOperation({ summary: 'Importation en masse par codes' })
  async importCodes(@Body() body: { instanceId: number; actions: any[] }, @Req() req: any) {
    return this.localActionService.importByCodes(body.instanceId, body.actions, req.user);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Mettre à jour une action locale' })
  async update(@Param('id', ParseIntPipe) id: number, @Body() body: { label?: string, description?: string, image?: string }, @Req() req: any) {
    return this.localActionService.update(id, body, req.user);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Supprimer (dé-mapper) une action locale' })
  async remove(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    return this.localActionService.remove(id, req.user);
  }
}

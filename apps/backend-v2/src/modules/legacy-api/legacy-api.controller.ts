import { Controller, Get, Param, Post, Delete, Body, Query, Headers, UnauthorizedException } from '@nestjs/common';
import { LegacyApiService } from './legacy-api.service';

@Controller('legacy')
export class LegacyApiController {
  constructor(private readonly legacyApiService: LegacyApiService) {}

  @Get('check_auth')
  async checkAuth(@Headers('authorization') auth: string) {
    if (!auth || !auth.startsWith('Basic ')) {
      throw new UnauthorizedException('Basic auth required');
    }
    const decoded = Buffer.from(auth.replace('Basic ', ''), 'base64').toString('utf8');
    const [pseudo, password] = decoded.split(':');
    
    return this.legacyApiService.checkAuthChild(pseudo, password);
  }

  @Get('categories')
  getCategories(@Headers('origin') origin: string, @Headers('x-instance-id') instanceIdStr?: string) {
    return this.legacyApiService.getCategories(origin, instanceIdStr);
  }

  @Get('categories/:id/actions')
  getActionsByCategory(@Param('id') id: string, @Headers('origin') origin: string, @Headers('x-instance-id') instanceIdStr?: string) {
    return this.legacyApiService.getActionsByCategory(id, origin, instanceIdStr);
  }

  @Post('actiondone/:childId')
  postActionDone(@Param('childId') childId: string, @Body() payload: any, @Headers('origin') origin: string, @Headers('x-instance-id') instanceIdStr?: string) {
    return this.legacyApiService.postActionDone(childId, payload, origin, instanceIdStr);
  }

  @Delete('actiondone/:actionId')
  deleteActionDone(@Param('actionId') actionId: string) {
    return this.legacyApiService.deleteActionDone(actionId);
  }

  @Get('children/:childId/actionsdone')
  getActionsDone(@Param('childId') childId: string, @Query('week_id') weekId: string) {
    return this.legacyApiService.getActionsDone(childId, weekId);
  }

  @Get('children/:childId/actionsdone2')
  getActionsDoneComplete(@Param('childId') childId: string) {
    return this.legacyApiService.getActionsDoneComplete(childId);
  }

  @Get('impact')
  getImpact(@Query('week_id') weekId: string, @Headers('origin') origin: string, @Headers('x-instance-id') instanceIdStr?: string) {
    return this.legacyApiService.getImpact(weekId, origin, instanceIdStr);
  }

  @Get('teams')
  getTeams(@Headers('origin') origin: string, @Headers('x-instance-id') instanceIdStr?: string) {
    return this.legacyApiService.getTeams(origin, instanceIdStr);
  }

  @Get('teams/total')
  getTeamsTotal(@Query('week_id') weekId: string, @Headers('origin') origin: string, @Headers('x-instance-id') instanceIdStr?: string) {
    return this.legacyApiService.getTeamsTotal(weekId, origin, instanceIdStr);
  }

  @Get('school')
  getSchool(@Headers('origin') origin: string, @Headers('x-instance-id') instanceIdStr?: string) {
    return this.legacyApiService.getSchool(origin, instanceIdStr);
  }

  @Get('week')
  getWeek(@Headers('origin') origin: string, @Headers('x-instance-id') instanceIdStr?: string) {
    return this.legacyApiService.getWeek(origin, instanceIdStr);
  }

  @Get('children')
  getChildren(@Headers('origin') origin: string, @Headers('x-instance-id') instanceIdStr?: string) {
    return this.legacyApiService.getChildren(origin, instanceIdStr);
  }

  @Get('children/:pseudo/pseudo')
  getChildByPseudo(@Param('pseudo') pseudo: string) {
    return this.legacyApiService.getChildByPseudo(pseudo);
  }

  @Get('child/:id')
  getChildById(@Param('id') id: string) {
    return this.legacyApiService.getChildById(parseInt(id, 10));
  }

  @Get('actions')
  getActions(@Headers('origin') origin: string, @Headers('x-instance-id') instanceIdStr?: string) {
    return this.legacyApiService.getActions(origin, instanceIdStr);
  }
}

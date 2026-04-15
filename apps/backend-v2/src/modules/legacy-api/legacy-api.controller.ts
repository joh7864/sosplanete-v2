import { Controller, Get, Param, Post, Delete, Body, Query, Headers } from '@nestjs/common';
import { LegacyApiService } from './legacy-api.service';

@Controller('legacy')
export class LegacyApiController {
  constructor(private readonly legacyApiService: LegacyApiService) {}

  @Get('categories')
  getCategories(@Headers('origin') origin: string) {
    return this.legacyApiService.getCategories(origin);
  }

  @Get('categories/:id/actions')
  getActionsByCategory(@Param('id') id: string, @Headers('origin') origin: string) {
    return this.legacyApiService.getActionsByCategory(id, origin);
  }

  @Post('actiondone/:childId')
  postActionDone(@Param('childId') childId: string, @Body() payload: any, @Headers('origin') origin: string) {
    return this.legacyApiService.postActionDone(childId, payload, origin);
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
  getImpact(@Query('week_id') weekId: string, @Headers('origin') origin: string) {
    return this.legacyApiService.getImpact(weekId, origin);
  }

  @Get('teams')
  getTeams(@Headers('origin') origin: string) {
    return this.legacyApiService.getTeams(origin);
  }

  @Get('teams/total')
  getTeamsTotal(@Query('week_id') weekId: string, @Headers('origin') origin: string) {
    return this.legacyApiService.getTeamsTotal(weekId, origin);
  }

  @Get('school')
  getSchool(@Headers('origin') origin: string) {
    return this.legacyApiService.getSchool(origin);
  }
}

import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
  UploadedFile,
  UseInterceptors,
  ForbiddenException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CategoryRefService } from './category-ref.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Role } from '@prisma/client';

@Controller('category-ref')
@UseGuards(JwtAuthGuard)
export class CategoryRefController {
  constructor(private readonly categoryRefService: CategoryRefService) {}

  private ensureAS(user: any) {
    if (user?.role !== Role.AS)
      throw new ForbiddenException("Accès réservé à l'administrateur système");
  }

  @Get()
  findAll() {
    return this.categoryRefService.findAll();
  }

  @Post()
  create(
    @Body() body: { name: string; icon?: string; order?: number },
    @Request() req: any,
  ) {
    this.ensureAS(req.user);
    return this.categoryRefService.create(body);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: any, @Request() req: any) {
    this.ensureAS(req.user);
    return this.categoryRefService.update(+id, body);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Request() req: any) {
    this.ensureAS(req.user);
    return this.categoryRefService.remove(+id);
  }

  @Post('reorder')
  reorder(@Body() body: { orderedIds: number[] }, @Request() req: any) {
    this.ensureAS(req.user);
    return this.categoryRefService.reorder(body.orderedIds);
  }

  /** Import CSV des catégories globales (AS only) */
  @Post('import')
  @UseInterceptors(FileInterceptor('file'))
  async importCsv(
    @UploadedFile() file: Express.Multer.File,
    @Request() req: any,
  ) {
    this.ensureAS(req.user);
    const content = file.buffer.toString('utf-8');
    const stats = await this.categoryRefService.importCsv(content);
    // Synchronise automatiquement les liens ActionRef → CategoryRef après import
    const syncStats = await this.categoryRefService.syncActionRefLinks();
    return { ...stats, ...syncStats };
  }

  /** Re-synchronise manuellement les liens ActionRef → CategoryRef (AS only) */
  @Post('sync-links')
  syncLinks(@Request() req: any) {
    this.ensureAS(req.user);
    return this.categoryRefService.syncActionRefLinks();
  }

  /** Hérite les CategoryRef vers une InstanceYear (AS only) */
  @Post('inherit/:instanceYearId')
  inherit(
    @Param('instanceYearId') instanceYearId: string,
    @Request() req: any,
  ) {
    this.ensureAS(req.user);
    return this.categoryRefService.inheritToInstance(+instanceYearId);
  }
}

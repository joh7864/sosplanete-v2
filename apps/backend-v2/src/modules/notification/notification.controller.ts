import {
  Controller,
  Get,
  Param,
  Patch,
  Delete,
  UseGuards,
  Request,
  Body,
  ParseIntPipe,
} from '@nestjs/common';
import { NotificationService } from './notification.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Notifications')
@Controller('notifications')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get()
  @ApiOperation({ summary: "Liste des notifications reçues par l'utilisateur" })
  async getNotifications(@Request() req: any) {
    return this.notificationService.findAllForUser(req.user.userId);
  }

  @Get('sent')
  @ApiOperation({
    summary: "Liste des notifications envoyées par l'utilisateur",
  })
  async getSentNotifications(@Request() req: any) {
    return this.notificationService.findSentByUser(req.user.userId);
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Marquer une notification comme lue' })
  async markAsRead(@Param('id', ParseIntPipe) id: number) {
    return this.notificationService.markAsRead(id);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: "Mettre à jour le statut d'une notification" })
  async updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { status: string },
  ) {
    return this.notificationService.updateStatus(id, body.status);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Supprimer une notification' })
  async deleteNotification(@Param('id', ParseIntPipe) id: number) {
    return this.notificationService.delete(id);
  }
}

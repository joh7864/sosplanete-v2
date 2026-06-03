import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class NotificationService {
  constructor(private readonly prisma: PrismaService) {}

  async create(senderId: number, recipientId: number, title: string, content: string, status = 'PENDING') {
    return this.prisma.notification.create({
      data: {
        senderId,
        recipientId,
        title,
        content,
        status,
        isRead: false,
      },
    });
  }

  async findAllForUser(userId: number) {
    return this.prisma.notification.findMany({
      where: { recipientId: userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findSentByUser(userId: number) {
    return this.prisma.notification.findMany({
      where: { senderId: userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async markAsRead(id: number) {
    return this.prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });
  }

  async updateStatus(id: number, status: string) {
    return this.prisma.notification.update({
      where: { id },
      data: { status },
    });
  }

  async delete(id: number) {
    return this.prisma.notification.delete({
      where: { id },
    });
  }
}

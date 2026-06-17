import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class NotificationService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    senderId: number,
    recipientId: number,
    title: string,
    content: string,
    status = 'PENDING',
  ) {
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
    const notif = await this.prisma.notification.findUnique({
      where: { id },
    });
    if (!notif) return;

    if (notif.status === 'PENDING') {
      const yearMatch =
        notif.title.match(/\d{4}-\d{4}/) || notif.content.match(/\d{4}-\d{4}/);
      if (yearMatch) {
        const schoolYear = yearMatch[0];

        await this.prisma.notification.updateMany({
          where: {
            status: 'PENDING',
            OR: [
              {
                title: { contains: schoolYear },
                OR: [
                  { senderId: notif.senderId },
                  { recipientId: notif.recipientId },
                  { senderId: notif.recipientId },
                  { recipientId: notif.senderId },
                ],
              },
            ],
          },
          data: { status: 'DELETED' },
        });

        return this.prisma.notification.update({
          where: { id },
          data: { status: 'DELETED' },
        });
      }
    }

    return this.prisma.notification.delete({
      where: { id },
    });
  }
}

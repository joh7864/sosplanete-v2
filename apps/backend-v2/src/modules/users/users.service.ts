import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import * as bcrypt from 'bcrypt';
import { User } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        avatar: true,
        lastSeenAt: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: number) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: { managedInstances: true }
    });
    if (!user) throw new NotFoundException(`Utilisateur avec l'ID ${id} non trouvé`);
    return user;
  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async createUser(dto: CreateUserDto) {
    const existing = await this.findByEmail(dto.email);
    if (existing) throw new ConflictException('Cet email est déjà utilisé');

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    return this.prisma.user.create({
      data: {
        ...dto,
        password: hashedPassword,
      },
    });
  }

  async updateUser(id: number, dto: UpdateUserDto) {
    const user = await this.findOne(id);

    const data: any = { ...dto };
    if (dto.password) {
      data.password = await bcrypt.hash(dto.password, 10);
    }

    return this.prisma.user.update({
      where: { id },
      data,
    });
  }

  async deleteUser(id: number) {
    await this.findOne(id);
    return this.prisma.user.delete({ where: { id } });
  }

  async updateLastSeen(id: number) {
    return this.prisma.user.update({
      where: { id },
      data: { lastSeenAt: new Date() },
    });
  }
}

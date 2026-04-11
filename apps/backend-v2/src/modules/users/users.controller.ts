import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
  BadRequestException,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import * as fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@prisma/client';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @Roles(Role.AS)
  async getAllUsers() {
    return this.usersService.findAll();
  }

  @Get('me')
  async getProfile(@Request() req: any) {
    const { password, ...user } = await this.usersService.findOne(req.user.userId);
    return user;
  }

  @Post('heartbeat')
  async heartbeat(@Request() req: any) {
    await this.usersService.updateLastSeen(req.user.userId);
    return { success: true };
  }

  @Post('avatar')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (_req, _file, cb) => {
          const path = join(process.cwd(), 'uploads/avatars');
          if (!fs.existsSync(path)) {
            fs.mkdirSync(path, { recursive: true });
          }
          cb(null, path);
        },
        filename: (_req, file, cb) => {
          const uniqueName = `${uuidv4()}${extname(file.originalname)}`;
          cb(null, uniqueName);
        },
      }),
      limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
      fileFilter: (_req, file, cb) => {
        if (!file.mimetype.match(/^image\/(jpeg|png|webp)$/)) {
          cb(
            new BadRequestException(
              'Seuls les formats JPEG, PNG et WebP sont acceptés.',
            ),
            false,
          );
        }
        cb(null, true);
      },
    }),
  )
  async uploadMyAvatar(@UploadedFile() file: Express.Multer.File, @Request() req: any) {
    if (!file) throw new BadRequestException('Aucun fichier envoyé.');
    const avatarUrl = `/uploads/avatars/${file.filename}`;
    await this.usersService.updateUser(req.user.userId, { avatar: avatarUrl });
    return { url: avatarUrl };
  }

  @Post(':id/avatar')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (_req, _file, cb) => {
          const path = join(process.cwd(), 'uploads/avatars');
          if (!fs.existsSync(path)) {
            fs.mkdirSync(path, { recursive: true });
          }
          cb(null, path);
        },
        filename: (_req, file, cb) => {
          const uniqueName = `${uuidv4()}${extname(file.originalname)}`;
          cb(null, uniqueName);
        },
      }),
      limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
      fileFilter: (_req, file, cb) => {
        if (!file.mimetype.match(/^image\/(jpeg|png|webp)$/)) {
          cb(
            new BadRequestException(
              'Seuls les formats JPEG, PNG et WebP sont acceptés.',
            ),
            false,
          );
        }
        cb(null, true);
      },
    }),
  )
  async uploadUserAvatar(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
    @Request() req: any,
  ) {
    const targetId = parseInt(id, 10);
    // Un AM ne peut modifier que lui-même. Un AS peut tout modifier.
    if (req.user.role !== Role.AS && req.user.userId !== targetId) {
      throw new BadRequestException("Vous n'avez pas la permission de modifier cet utilisateur");
    }

    if (!file) throw new BadRequestException('Aucun fichier envoyé.');
    const avatarUrl = `/uploads/avatars/${file.filename}`;
    await this.usersService.updateUser(targetId, { avatar: avatarUrl });
    return { url: avatarUrl };
  }

  @Post()
  @Roles(Role.AS)
  async createUser(@Body() dto: CreateUserDto) {
    const { password, ...user } = await this.usersService.createUser(dto);
    return user;
  }

  @Put(':id')
  async updateUser(
    @Request() req: any,
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
  ) {
    const targetId = parseInt(id, 10);
    // Un AM ne peut modifier que lui-même. Un AS peut tout modifier.
    if (req.user.role !== Role.AS && req.user.userId !== targetId) {
      throw new BadRequestException("Vous n'avez pas la permission de modifier cet utilisateur");
    }

    const { password, ...user } = await this.usersService.updateUser(targetId, dto);
    return user;
  }

  @Delete(':id')
  @Roles(Role.AS)
  async deleteUser(@Param('id') id: string) {
    const targetId = parseInt(id, 10);
    return this.usersService.deleteUser(targetId);
  }
}

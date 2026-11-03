import { applyDecorators, UseGuards } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from './jwt-auth.guard';
import { RolesGuard } from './roles.guard';
import { Roles } from './roles.decorator';

/**
 * Réserve une route (ou un contrôleur) aux utilisateurs back-office authentifiés
 * (JWT valide + rôle AS ou AM).
 */
export const AdminOnly = () =>
  applyDecorators(
    UseGuards(JwtAuthGuard, RolesGuard),
    Roles(Role.AS, Role.AM),
    ApiBearerAuth(),
  );

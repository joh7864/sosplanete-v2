import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async validateUser(email: string, pass: string): Promise<any> {
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: { managedInstances: true },
    });

    if (!user) return null;

    // 1. Essai bcrypt
    const isBcryptValid = await bcrypt.compare(pass, user.password);

    if (isBcryptValid) {
      const { password, ...result } = user;
      return result;
    }

    // 2. Fallback : est-ce un mot de passe en clair (legacy) ?
    const isLikelyBcrypt =
      user.password.startsWith('$2b$') || user.password.startsWith('$2a$');
    if (!isLikelyBcrypt && pass === user.password) {
      // SEC-02 — Migration automatique : rehash à la volée
      const upgraded = await bcrypt.hash(pass, 10);
      await this.prisma.user.update({
        where: { id: user.id },
        data: { password: upgraded },
      });
      const { password, ...result } = user;
      return result;
    }

    return null;
  }

  async login(user: any) {
    const managedIds = user.managedInstances?.map((i: any) => i.id) || [];
    const payload = {
      email: user.email,
      sub: user.id,
      role: user.role,
      instanceIds: managedIds, // Liste de tous les espaces autorisés
      instanceId: managedIds[0] || null, // Espace actif par défaut
    };
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        managedInstances: user.managedInstances, // Retourner les instances pour sélection au frontend
      },
    };
  }

  async validateChild(pseudo: string, pass: string, instanceId?: number): Promise<any> {
    const child = await this.prisma.child.findFirst({
      where: { 
        pseudo,
        ...(instanceId ? { group: { team: { instanceYear: { instanceId } } } } : {})
      },
      include: {
        group: {
          include: {
            team: {
              include: {
                instanceYear: { include: { instance: true } },
              },
            },
          },
        },
      },
    });

    if (!child) return null;

    if (child.password) {
      // 1. Essai bcrypt (v2 ou mots de passe déjà migrés)
      const isBcryptValid = await bcrypt.compare(pass, child.password);
      if (isBcryptValid) return child;

      // 2. Fallback : le hash ressemble-t-il à du bcrypt ? Si non, c'est du plaintext legacy
      const isLikelyBcrypt =
        child.password.startsWith('$2b$') || child.password.startsWith('$2a$');
      if (!isLikelyBcrypt && pass === child.password) {
        // SEC-02 — Migration automatique : on rehash à la volée avant de valider
        const upgraded = await bcrypt.hash(pass, 10);
        await this.prisma.child.update({
          where: { id: child.id },
          data: { password: upgraded },
        });
        return child;
      }

      return null;
    } else {
      // Enfant sans mot de passe (créé sans MDP dans l'admin)
      return pass === '' || pass === child.pseudo ? child : null;
    }
  }

  async loginChild(child: any) {
    const instanceId = child.group.team.instanceYear?.instanceId ?? null;
    const payload = {
      pseudo: child.pseudo,
      sub: child.id,
      groupId: child.groupId,
      teamId: child.group.teamId,
      instanceId,
    };
    return {
      access_token: this.jwtService.sign(payload),
      child: {
        id: child.id,
        pseudo: child.pseudo,
        groupId: child.groupId,
        teamId: child.group.teamId,
        instanceId,
        schoolName: child.group.team.instanceYear?.instance?.schoolName ?? '',
      },
    };
  }
}

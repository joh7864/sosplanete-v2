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
      include: { managedInstances: true }
    });
    if (user && (await bcrypt.compare(pass, user.password))) {
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
      instanceId: managedIds[0] || null // Espace actif par défaut
    };
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        managedInstances: user.managedInstances // Retourner les instances pour sélection au frontend
      }
    };
  }

  async validateChild(pseudo: string, pass: string): Promise<any> {
    const child = await this.prisma.child.findFirst({
      where: { pseudo },
      include: { 
        group: {
          include: {
            team: {
              include: {
                instance: true
              }
            }
          }
        }
      }
    });

    if (!child) return null;

    if (child.password) {
      // Mot de passe bcrypté (v2)
      const isValid = await bcrypt.compare(pass, child.password);
      return isValid ? child : null;
    } else {
      // SEC-02 — Enfant sans mot de passe (migration v1 non encore bcryptée)
      // On accepte uniquement la chaîne vide ou le pseudo comme mot de passe vide
      // Note : les passwords en clair stockés tels quels ne sont PLUS acceptés
      return (pass === '' || pass === child.pseudo) ? child : null;
    }
  }

  async loginChild(child: any) {
    const payload = { 
      pseudo: child.pseudo, 
      sub: child.id,
      groupId: child.groupId,
      teamId: child.group.teamId,
      instanceId: child.group.team.instanceId 
    };
    return {
      access_token: this.jwtService.sign(payload),
      child: {
        id: child.id,
        pseudo: child.pseudo,
        groupId: child.groupId,
        teamId: child.group.teamId,
        instanceId: child.group.team.instanceId,
        schoolName: child.group.team.instance.schoolName
      }
    };
  }
}

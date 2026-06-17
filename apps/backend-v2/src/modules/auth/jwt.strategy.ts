import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        // 1. Cookie HTTP-Only (production)
        (request: Request) => {
          return request?.cookies?.access_token;
        },
        // 2. Header Authorization: Bearer xxx (frontend dev)
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
      ignoreExpiration: false,
      // SEC-01 — Secret lu depuis env uniquement. Le démarrage est bloqué en production si absent (voir main.ts)
      secretOrKey:
        process.env.JWT_SECRET || 'dev_fallback_secret_not_for_production',
    });
  }

  async validate(payload: any) {
    let instanceIds = payload.instanceIds || [];

    // Dynamic fallback to load managed instances in real-time for AM users
    // We load from BOTH Instance.adminId and InstanceYear.adminId to cover all cases
    if (payload.role === 'AM') {
      try {
        const [userWithInstances, instanceYears] = await Promise.all([
          this.prisma.user.findUnique({
            where: { id: payload.sub },
            select: { managedInstances: { select: { id: true } } },
          }),
          this.prisma.instanceYear.findMany({
            where: { adminId: payload.sub },
            select: { instanceId: true },
          }),
        ]);

        const fromInstances =
          userWithInstances?.managedInstances.map((i) => i.id) || [];
        const fromInstanceYears = instanceYears.map((iy) => iy.instanceId);

        // Deduplicate
        instanceIds = [...new Set([...fromInstances, ...fromInstanceYears])];
      } catch (err) {
        console.error('JwtStrategy error fetching managed instances:', err);
      }
    }

    return {
      userId: payload.sub,
      email: payload.email,
      role: payload.role,
      instanceId: payload.instanceId,
      instanceIds,
    };
  }
}

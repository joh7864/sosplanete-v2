import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
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
      secretOrKey: process.env.JWT_SECRET || 'dev_fallback_secret_not_for_production',
    });
  }

  async validate(payload: any) {
    return { 
      userId: payload.sub, 
      email: payload.email, 
      role: payload.role, 
      instanceId: payload.instanceId,
      instanceIds: payload.instanceIds || [] // Nouvelle liste des instances autorisées
    };
  }
}

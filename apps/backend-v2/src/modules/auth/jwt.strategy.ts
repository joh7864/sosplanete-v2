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
      secretOrKey: process.env.JWT_SECRET || 'sosplanete_secret_key_2026',
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

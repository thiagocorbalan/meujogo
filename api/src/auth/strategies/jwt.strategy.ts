import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import type { Request } from 'express';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req: Request) => req?.cookies?.accessToken || null,
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET!,
    });
  }

  validate(payload: {
    sub: number;
    role: string;
    isSuperAdmin: boolean;
    impersonatedBy?: number;
  }) {
    return {
      id: payload.sub,
      role: payload.role,
      isSuperAdmin: payload.isSuperAdmin,
      impersonatedBy: payload.impersonatedBy,
    };
  }
}

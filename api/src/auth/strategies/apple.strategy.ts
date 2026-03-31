import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import AppleStrategy from 'passport-apple';
import { AuthService } from '../auth.service.js';
import * as jwt from 'jsonwebtoken';
import jwksClient from 'jwks-rsa';

interface AppleIdToken {
  sub: string;
  email?: string;
}

const appleJwksClient = jwksClient({
  jwksUri: 'https://appleid.apple.com/auth/keys',
  cache: true,
  cacheMaxAge: 86400000, // 24h
});

function getAppleSigningKey(header: jwt.JwtHeader): Promise<string> {
  return new Promise((resolve, reject) => {
    appleJwksClient.getSigningKey(header.kid, (err, key) => {
      if (err) return reject(err);
      resolve(key!.getPublicKey());
    });
  });
}

@Injectable()
export class AppleOAuthStrategy extends PassportStrategy(AppleStrategy, 'apple') {
  private readonly clientID: string;

  constructor(private readonly authService: AuthService) {
    const clientID = process.env.APPLE_CLIENT_ID!;
    super({
      clientID,
      teamID: process.env.APPLE_TEAM_ID!,
      keyID: process.env.APPLE_KEY_ID!,
      callbackURL: process.env.APPLE_CALLBACK_URL!,
      privateKeyString: process.env.APPLE_PRIVATE_KEY!,
      passReqToCallback: true,
    });
    this.clientID = clientID;
  }

  async validate(
    req: any,
    accessToken: string,
    refreshToken: string,
    idToken: string,
    profile: any,
    done: (err: any, user?: any) => void,
  ) {
    // Decode header to get kid for key lookup
    const decodedHeader = jwt.decode(idToken, { complete: true });
    if (!decodedHeader) {
      return done(
        new UnauthorizedException('Invalid Apple ID token'),
        undefined,
      );
    }

    // Verify signature using Apple's JWKS public keys
    let decoded: AppleIdToken;
    try {
      const signingKey = await getAppleSigningKey(decodedHeader.header);
      decoded = jwt.verify(idToken, signingKey, {
        algorithms: ['RS256'],
        issuer: 'https://appleid.apple.com',
        audience: this.clientID,
      }) as AppleIdToken;
    } catch {
      return done(
        new UnauthorizedException('Apple ID token verification failed'),
        undefined,
      );
    }

    if (!decoded || !decoded.sub) {
      return done(
        new UnauthorizedException('Invalid Apple ID token'),
        undefined,
      );
    }

    const appleProfile = req.appleProfile as
      | { name?: { firstName?: string; lastName?: string }; email?: string }
      | undefined;

    const email = decoded.email || appleProfile?.email;
    const name = appleProfile?.name
      ? [appleProfile.name.firstName, appleProfile.name.lastName]
          .filter(Boolean)
          .join(' ')
      : undefined;

    if (!email) {
      const user = await this.authService.validateOAuthUser(
        {
          email: '',
          name: name || 'Apple User',
          providerId: decoded.sub,
        },
        'apple',
      );
      return done(null, user);
    }

    const user = await this.authService.validateOAuthUser(
      {
        email,
        name: name || 'Apple User',
        providerId: decoded.sub,
      },
      'apple',
    );
    done(null, user);
  }
}

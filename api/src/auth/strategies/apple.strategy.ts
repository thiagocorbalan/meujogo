import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import AppleStrategy from 'passport-apple';
import { AuthService } from '../auth.service.js';
import * as jwt from 'jsonwebtoken';

interface AppleIdToken {
  sub: string;
  email?: string;
}

@Injectable()
export class AppleOAuthStrategy extends PassportStrategy(AppleStrategy, 'apple') {
  constructor(private readonly authService: AuthService) {
    super({
      clientID: process.env.APPLE_CLIENT_ID!,
      teamID: process.env.APPLE_TEAM_ID!,
      keyID: process.env.APPLE_KEY_ID!,
      callbackURL: process.env.APPLE_CALLBACK_URL!,
      privateKeyString: process.env.APPLE_PRIVATE_KEY!,
      passReqToCallback: true,
    });
  }

  async validate(
    req: any,
    accessToken: string,
    refreshToken: string,
    idToken: string,
    profile: any,
    done: (err: any, user?: any) => void,
  ) {
    const decoded = jwt.decode(idToken) as AppleIdToken | null;

    if (!decoded || !decoded.sub) {
      return done(new Error('Invalid Apple ID token'), undefined);
    }

    // Apple only sends name/email on the first login.
    // On subsequent logins, we rely on the provider ID (sub) to find the user.
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
      // If no email is available (subsequent login), look up by provider ID only.
      // validateOAuthUser requires an email, so we attempt a direct lookup first.
      const user = await this.authService.validateOAuthUser(
        {
          email: '', // Will match by providerId in validateOAuthUser
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

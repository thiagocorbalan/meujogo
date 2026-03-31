declare module 'passport-apple' {
  import { Strategy as OAuth2Strategy } from 'passport-oauth2';

  export interface AppleStrategyOptions {
    clientID: string;
    teamID: string;
    keyID: string;
    callbackURL: string;
    privateKeyLocation?: string;
    privateKeyString?: string;
    passReqToCallback?: boolean;
    scope?: string[];
    authorizationURL?: string;
    tokenURL?: string;
  }

  class Strategy extends OAuth2Strategy {
    constructor(options: AppleStrategyOptions, verify: (...args: any[]) => void);
    name: string;
  }

  export default Strategy;
}

import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { createHmac, timingSafeEqual } from 'crypto';
import type { Request } from 'express';

export const SKIP_CSRF_KEY = 'skipCsrf';

@Injectable()
export class CsrfGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();

    const method = request.method.toUpperCase();
    if (['GET', 'HEAD', 'OPTIONS'].includes(method)) {
      return true;
    }

    const skipCsrf = this.reflector.getAllAndOverride<boolean>(SKIP_CSRF_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (skipCsrf) {
      return true;
    }

    const secret = process.env.JWT_SECRET || '';
    const headerToken = request.headers['x-csrf-token'] as string;
    const cookieToken = request.cookies?.['XSRF-TOKEN'] as string;

    if (!headerToken || !cookieToken) {
      throw new ForbiddenException('CSRF token missing');
    }

    // Verify the header token is a valid HMAC of the cookie token
    const expectedSignature = createHmac('sha256', secret)
      .update(cookieToken)
      .digest('hex');
    const headerBuffer = Buffer.from(headerToken);
    const expectedBuffer = Buffer.from(expectedSignature);

    if (
      headerBuffer.length !== expectedBuffer.length ||
      !timingSafeEqual(headerBuffer, expectedBuffer)
    ) {
      throw new ForbiddenException('CSRF token mismatch');
    }

    return true;
  }
}

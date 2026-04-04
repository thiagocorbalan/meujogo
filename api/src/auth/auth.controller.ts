import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Throttle, SkipThrottle } from '@nestjs/throttler';
import * as express from 'express';
import * as crypto from 'crypto';
import { AuthService } from './auth.service.js';
import { JwtAuthGuard } from './guards/jwt-auth.guard.js';
import { SkipCsrf } from '../common/decorators/skip-csrf.decorator.js';
import { LoginDto } from './dto/login.dto.js';
import { RefreshTokenDto } from './dto/refresh-token.dto.js';
import { ForgotPasswordDto } from './dto/forgot-password.dto.js';
import { ResetPasswordDto } from './dto/reset-password.dto.js';

function isProduction() {
  return process.env.NODE_ENV === 'production';
}

function setTokenCookies(
  res: express.Response,
  accessToken: string,
  refreshToken: string,
  rememberMe = false,
) {
  res.cookie('accessToken', accessToken, {
    httpOnly: true,
    sameSite: 'lax',
    secure: isProduction(),
    path: '/',
    maxAge: 15 * 60 * 1000,
  });

  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    sameSite: 'lax',
    secure: isProduction(),
    path: '/auth/refresh',
    maxAge: rememberMe ? 30 * 24 * 60 * 60 * 1000 : 7 * 24 * 60 * 60 * 1000,
  });
}

function clearTokenCookies(res: express.Response) {
  res.clearCookie('accessToken', { path: '/' });
  res.clearCookie('refreshToken', { path: '/auth/refresh' });
}

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @SkipCsrf()
  @Throttle({ default: { ttl: 900000, limit: 5 } })
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: express.Response,
  ) {
    const user = await this.authService.validateUser(dto.email, dto.password);
    if (!user) {
      throw new UnauthorizedException('Email ou senha incorretos');
    }
    const result = await this.authService.login(user, dto.rememberMe ?? false);

    setTokenCookies(res, result.accessToken, result.refreshToken, dto.rememberMe);

    return { user: result.user };
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Body() dto: RefreshTokenDto,
    @Req() req: express.Request,
    @Res({ passthrough: true }) res: express.Response,
  ) {
    const token = dto.refreshToken || (req.cookies?.refreshToken as string);
    if (!token) {
      throw new UnauthorizedException('Token de atualização não fornecido');
    }
    const result = await this.authService.refreshToken(token);

    res.cookie('accessToken', result.accessToken, {
      httpOnly: true,
      sameSite: 'lax',
      secure: isProduction(),
      path: '/',
      maxAge: 15 * 60 * 1000,
    });

    // Set rotated refresh token cookie
    if (result.refreshToken) {
      res.cookie('refreshToken', result.refreshToken, {
        httpOnly: true,
        sameSite: 'lax',
        secure: isProduction(),
        path: '/auth/refresh',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });
    }

    return { message: 'Token atualizado com sucesso' };
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(
    @Req() req: any,
    @Res({ passthrough: true }) res: express.Response,
  ) {
    await this.authService.logout(req.user.id);

    clearTokenCookies(res);

    return { message: 'Logout realizado com sucesso' };
  }

  @SkipCsrf()
  @Throttle({ default: { ttl: 3600000, limit: 3 } })
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    await this.authService.forgotPassword(dto.email);
    return { message: 'Se o email existir, enviaremos um link de recuperação' };
  }

  @SkipCsrf()
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  async resetPassword(@Body() dto: ResetPasswordDto) {
    await this.authService.resetPassword(dto.token, dto.password);
    return { message: 'Senha redefinida com sucesso' };
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  getMe(@Req() req: any) {
    return req.user;
  }

  @SkipThrottle()
  @Get('csrf-token')
  getCsrfToken(
    @Req() req: express.Request,
    @Res({ passthrough: true }) res: express.Response,
  ) {
    const token = crypto.randomBytes(32).toString('hex');
    const secret = process.env.JWT_SECRET || '';
    const signature = crypto
      .createHmac('sha256', secret)
      .update(token)
      .digest('hex');

    res.cookie('XSRF-TOKEN', token, {
      httpOnly: false,
      sameSite: 'lax',
      secure: isProduction(),
      path: '/',
      maxAge: 24 * 60 * 60 * 1000,
    });

    return { csrfToken: signature };
  }

  @Get('google')
  @UseGuards(AuthGuard('google'))
  googleLogin() {
  }

  @SkipCsrf()
  @SkipThrottle()
  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleCallback(@Req() req: any, @Res() res: express.Response) {
    const result = await this.authService.login(req.user, false);
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:4000';

    setTokenCookies(res, result.accessToken, result.refreshToken);
    res.redirect(`${frontendUrl}/auth/callback`);
  }

  @Get('apple')
  @UseGuards(AuthGuard('apple'))
  appleLogin() {
  }

  @SkipCsrf()
  @SkipThrottle()
  @Post('apple/callback')
  @UseGuards(AuthGuard('apple'))
  async appleCallback(@Req() req: any, @Res() res: express.Response) {
    const result = await this.authService.login(req.user, false);
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:4000';

    setTokenCookies(res, result.accessToken, result.refreshToken);
    res.redirect(`${frontendUrl}/auth/callback`);
  }
}

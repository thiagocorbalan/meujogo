import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { UsersService } from '../users/users.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { RegisterDto } from './dto/register.dto.js';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  async validateUser(email: string, password: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user || !user.password) {
      return null;
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return null;
    }

    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async login(user: any, rememberMe: boolean) {
    const payload = { sub: user.id, role: user.role };

    const accessToken = this.jwtService.sign(payload, {
      secret: process.env.JWT_SECRET,
      expiresIn: '15m',
    });

    const refreshTokenExpiry = rememberMe ? '30d' : '7d';
    const refreshToken = this.jwtService.sign(payload, {
      secret: process.env.JWT_REFRESH_SECRET,
      expiresIn: refreshTokenExpiry,
    });

    const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);
    await this.usersService.updateRefreshToken(user.id, hashedRefreshToken);

    return {
      accessToken,
      refreshToken,
      user,
    };
  }

  async refreshToken(token: string) {
    let payload: any;
    try {
      payload = this.jwtService.verify(token, {
        secret: process.env.JWT_REFRESH_SECRET,
      });
    } catch {
      throw new UnauthorizedException('Token de atualização inválido');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });
    if (!user) {
      throw new UnauthorizedException('Usuário não encontrado');
    }

    if (!user.refreshToken) {
      throw new UnauthorizedException('Token de atualização revogado');
    }

    const isTokenValid = await bcrypt.compare(token, user.refreshToken);
    if (!isTokenValid) {
      throw new UnauthorizedException('Token de atualização inválido');
    }

    const newAccessToken = this.jwtService.sign(
      { sub: user.id, role: user.role },
      { secret: process.env.JWT_SECRET, expiresIn: '15m' },
    );

    // Rotate refresh token
    const newRefreshToken = this.jwtService.sign(
      { sub: user.id, role: user.role },
      { secret: process.env.JWT_REFRESH_SECRET, expiresIn: '7d' },
    );

    const hashedRefreshToken = await bcrypt.hash(newRefreshToken, 10);
    await this.usersService.updateRefreshToken(user.id, hashedRefreshToken);

    return { accessToken: newAccessToken, refreshToken: newRefreshToken };
  }

  async logout(userId: number) {
    await this.usersService.updateRefreshToken(userId, null);
  }

  async forgotPassword(email: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      return;
    }

    const resetToken = crypto.randomUUID();
    const hashedToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');
    const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000);

    await this.prisma.user.update({
      where: { id: user.id },
      data: { resetToken: hashedToken, resetTokenExpiry },
    });

    // The unhashed resetToken would be sent to the user via email
    // Return it here so the caller (controller) can include it in the email
    return resetToken;
  }

  async resetPassword(token: string, newPassword: string) {
    const hashedToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    const user = await this.prisma.user.findFirst({
      where: { resetToken: hashedToken },
    });

    if (!user) {
      throw new BadRequestException('Token de redefinição inválido');
    }

    if (!user.resetTokenExpiry || user.resetTokenExpiry < new Date()) {
      throw new BadRequestException('Token de redefinição expirado');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetToken: null,
        resetTokenExpiry: null,
      },
    });
  }

  async register(dto: RegisterDto) {
    const existing = await this.usersService.findByEmail(dto.email);
    if (existing) {
      throw new ConflictException('Email ja cadastrado');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        name: dto.name,
        email: dto.email,
        password: hashedPassword,
        role: 'USUARIO',
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        googleId: true,
        appleId: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return this.login(user, false);
  }

  async validateOAuthUser(
    profile: { email: string; name: string; providerId: string },
    provider: 'google' | 'apple',
  ) {
    const providerIdField = provider === 'google' ? 'googleId' : 'appleId';

    let user = await this.prisma.user.findFirst({
      where: { [providerIdField]: profile.providerId },
    });

    if (user) {
      const { password: _, ...userWithoutPassword } = user;
      return userWithoutPassword;
    }

    user = await this.usersService.findByEmail(profile.email);

    if (user) {
      // If user has a password (local account), don't auto-link — require login first
      if (user.password) {
        throw new UnauthorizedException(
          'Uma conta com este email já existe. Faça login com sua senha para vincular sua conta.',
        );
      }
      // If user has no password (OAuth-only), safe to link
      user = await this.prisma.user.update({
        where: { id: user.id },
        data: { [providerIdField]: profile.providerId },
      });
      const { password: _, ...userWithoutPassword } = user;
      return userWithoutPassword;
    }

    user = await this.prisma.user.create({
      data: {
        name: profile.name,
        email: profile.email,
        [providerIdField]: profile.providerId,
      },
    });

    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }
}

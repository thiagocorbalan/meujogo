import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CryptoService } from '../common/services/crypto.service.js';
import { testStripe } from './connectors/stripe.connector.js';
import { testEmail } from './connectors/email.connector.js';
import { testSentry } from './connectors/sentry.connector.js';

@Injectable()
export class IntegrationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cryptoService: CryptoService,
  ) {}

  async getDecryptedKey(service: string): Promise<string | null> {
    try {
      const config = await this.prisma.integrationConfig.findUnique({
        where: { service },
      });

      if (
        !config ||
        !config.isConfigured ||
        !config.encryptedKey ||
        !config.keyIv ||
        !config.keyTag
      ) {
        return null;
      }

      return this.cryptoService.decrypt(
        config.encryptedKey,
        config.keyIv,
        config.keyTag,
      );
    } catch {
      return null;
    }
  }

  async listAll() {
    const configs = await this.prisma.integrationConfig.findMany({
      orderBy: { service: 'asc' },
    });

    return configs.map((config) => {
      let maskedKey: string | null = null;

      if (
        config.isConfigured &&
        config.encryptedKey &&
        config.keyIv &&
        config.keyTag
      ) {
        try {
          const plain = this.cryptoService.decrypt(
            config.encryptedKey,
            config.keyIv,
            config.keyTag,
          );
          maskedKey = this.cryptoService.mask(plain);
        } catch {
          maskedKey = '***';
        }
      }

      return {
        id: config.id,
        service: config.service,
        isConfigured: config.isConfigured,
        maskedKey,
        updatedAt: config.updatedAt,
      };
    });
  }

  async upsert(
    service: string,
    plainKey: string,
    adminId: number,
    ip: string | undefined,
  ) {
    if (!process.env.INTEGRATION_ENCRYPTION_KEY) {
      throw new BadRequestException(
        'INTEGRATION_ENCRYPTION_KEY is not configured on the server',
      );
    }

    const { iv, tag, encrypted } = this.cryptoService.encrypt(plainKey);

    await this.prisma.integrationConfig.upsert({
      where: { service },
      create: {
        service,
        encryptedKey: encrypted,
        keyIv: iv,
        keyTag: tag,
        isConfigured: true,
      },
      update: {
        encryptedKey: encrypted,
        keyIv: iv,
        keyTag: tag,
        isConfigured: true,
      },
    });

    this.prisma.adminAuditLog
      .create({
        data: {
          adminId,
          action: 'INTEGRATION_UPDATED',
          targetType: 'IntegrationConfig',
          metadata: { service },
          ipAddress: ip ?? null,
        },
      })
      .catch((err) => console.error('Audit log write failed:', err));

    return { success: true, message: `Integration ${service} updated` };
  }

  async testConnection(
    service: string,
  ): Promise<{ success: boolean; message: string }> {
    const key = await this.getDecryptedKey(service);

    if (key === null) {
      throw new NotFoundException(`Integration ${service} is not configured`);
    }

    const upperService = service.toUpperCase();

    if (upperService === 'STRIPE') {
      return testStripe(key);
    }

    if (upperService === 'SENDGRID' || upperService === 'RESEND') {
      return testEmail(key, upperService);
    }

    if (upperService === 'SENTRY') {
      return testSentry(key);
    }

    return {
      success: true,
      message: `No test available for service ${service}`,
    };
  }
}

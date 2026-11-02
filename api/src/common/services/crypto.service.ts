import { BadRequestException, Injectable } from '@nestjs/common';
import * as crypto from 'crypto';

@Injectable()
export class CryptoService {
  private cachedKey: Buffer | null = null;

  private getKey(): Buffer {
    if (this.cachedKey) return this.cachedKey;

    const envKey = process.env.INTEGRATION_ENCRYPTION_KEY;

    if (!envKey || envKey.length < 32) {
      throw new BadRequestException(
        'INTEGRATION_ENCRYPTION_KEY nao configurada ou menor que 32 caracteres.',
      );
    }

    this.cachedKey = crypto.scryptSync(
      envKey,
      'meujogo-integration-salt',
      32,
    ) as Buffer;
    return this.cachedKey;
  }

  encrypt(plaintext: string): { iv: string; tag: string; encrypted: string } {
    const key = this.getKey();
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

    const encryptedBuffer = Buffer.concat([
      cipher.update(plaintext, 'utf8'),
      cipher.final(),
    ]);

    const tag = cipher.getAuthTag();

    return {
      iv: iv.toString('hex'),
      tag: tag.toString('hex'),
      encrypted: encryptedBuffer.toString('hex'),
    };
  }

  decrypt(encrypted: string, iv: string, tag: string): string {
    const key = this.getKey();
    const decipher = crypto.createDecipheriv(
      'aes-256-gcm',
      key,
      Buffer.from(iv, 'hex'),
    );

    decipher.setAuthTag(Buffer.from(tag, 'hex'));

    const decrypted = Buffer.concat([
      decipher.update(Buffer.from(encrypted, 'hex')),
      decipher.final(),
    ]);

    return decrypted.toString('utf8');
  }

  mask(plaintext: string): string {
    if (plaintext.length < 8) {
      return '***';
    }
    return plaintext.slice(0, 8) + '...***';
  }
}

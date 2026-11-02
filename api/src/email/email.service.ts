import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CryptoService } from '../common/services/crypto.service.js';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly cryptoService: CryptoService,
  ) {}

  async getEmailConfig(): Promise<{ provider: string; apiKey: string } | null> {
    for (const provider of ['SENDGRID', 'RESEND']) {
      try {
        const config = await this.prisma.integrationConfig.findUnique({
          where: { service: provider },
        });

        if (
          !config ||
          !config.isConfigured ||
          !config.encryptedKey ||
          !config.keyIv ||
          !config.keyTag
        ) {
          continue;
        }

        const apiKey = this.cryptoService.decrypt(
          config.encryptedKey,
          config.keyIv,
          config.keyTag,
        );

        return { provider, apiKey };
      } catch {
        continue;
      }
    }

    return null;
  }

  async sendEmail(to: string, subject: string, html: string): Promise<void> {
    const config = await this.getEmailConfig();

    if (!config) {
      this.logger.warn(
        'No email provider configured (SENDGRID or RESEND). Skipping email send.',
      );
      return;
    }

    const senderEmail =
      process.env.SENDER_EMAIL ||
      `noreply@${process.env.FRONTEND_URL?.replace(/https?:\/\//, '') || 'meujogo.app'}`;

    try {
      if (config.provider === 'SENDGRID') {
        const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${config.apiKey}`,
          },
          body: JSON.stringify({
            personalizations: [{ to: [{ email: to }] }],
            from: { email: senderEmail },
            subject,
            content: [{ type: 'text/html', value: html }],
          }),
        });

        if (!response.ok) {
          const body = await response.text();
          this.logger.error(`SendGrid error ${response.status}: ${body}`);
        }
      } else if (config.provider === 'RESEND') {
        const response = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${config.apiKey}`,
          },
          body: JSON.stringify({
            from: senderEmail,
            to: [to],
            subject,
            html,
          }),
        });

        if (!response.ok) {
          const body = await response.text();
          this.logger.error(`Resend error ${response.status}: ${body}`);
        }
      }
    } catch (err) {
      this.logger.error(`Failed to send email to ${to}: ${String(err)}`);
    }
  }

  async sendPasswordReset(email: string, resetToken: string): Promise<void> {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:4000';
    const resetUrl = `${frontendUrl}/redefinir-senha?token=${resetToken}`;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #38003c;">Redefinição de senha — Meu Jogo</h2>
        <p>Recebemos uma solicitação para redefinir a senha da sua conta.</p>
        <p>Clique no botão abaixo para criar uma nova senha. O link expira em <strong>1 hora</strong>.</p>
        <div style="text-align: center; margin: 32px 0;">
          <a href="${resetUrl}"
             style="background-color: #38003c; color: #ffffff; padding: 14px 28px;
                    text-decoration: none; border-radius: 6px; font-size: 16px; display: inline-block;">
            Redefinir senha
          </a>
        </div>
        <p style="color: #666; font-size: 13px;">
          Se você não solicitou a redefinição, ignore este email. Sua senha permanece a mesma.
        </p>
        <p style="color: #666; font-size: 13px;">
          Ou copie e cole o link abaixo no navegador:<br/>
          <a href="${resetUrl}" style="color: #38003c;">${resetUrl}</a>
        </p>
      </div>
    `;

    await this.sendEmail(email, 'Redefinição de senha — Meu Jogo', html);
  }

  async sendWelcome(email: string, name: string): Promise<void> {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:4000';

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #38003c;">Bem-vindo ao Meu Jogo, ${name}!</h2>
        <p>Sua conta foi criada com sucesso. Agora você pode gerenciar seus jogos semanais de futebol com facilidade.</p>
        <div style="text-align: center; margin: 32px 0;">
          <a href="${frontendUrl}"
             style="background-color: #38003c; color: #ffffff; padding: 14px 28px;
                    text-decoration: none; border-radius: 6px; font-size: 16px; display: inline-block;">
            Acessar Meu Jogo
          </a>
        </div>
        <p style="color: #666; font-size: 13px;">
          Se você não criou esta conta, entre em contato conosco.
        </p>
      </div>
    `;

    await this.sendEmail(email, 'Bem-vindo ao Meu Jogo!', html);
  }
}

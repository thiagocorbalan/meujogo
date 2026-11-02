import {
  BadRequestException,
  Controller,
  Headers,
  HttpCode,
  Post,
  Req,
  ServiceUnavailableException,
} from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { SkipCsrf } from '../common/decorators/skip-csrf.decorator.js';
import { BillingService } from './billing.service.js';

// NOTE: Raw body access requires NestJS to be configured with rawBody: true in main.ts.
// Example: const app = await NestFactory.create(AppModule, { rawBody: true });
// The raw buffer is then available via req.rawBody.

@Controller('billing')
export class StripeWebhookController {
  constructor(private readonly billingService: BillingService) {}

  @Post('webhook')
  @HttpCode(200)
  @SkipThrottle()
  @SkipCsrf()
  async handleWebhook(
    @Req() req: any,
    @Headers('stripe-signature') signature: string,
  ) {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!webhookSecret) {
      throw new ServiceUnavailableException('Stripe webhook nao configurado');
    }

    const rawBody = req.rawBody;

    if (!rawBody) {
      throw new BadRequestException('Raw body nao disponivel');
    }

    let stripe: Awaited<ReturnType<typeof this.billingService.getStripeClient>>;
    try {
      stripe = await this.billingService.getStripeClient();
    } catch {
      throw new ServiceUnavailableException('Stripe nao configurado');
    }

    let event: any;
    try {
      event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
    } catch {
      throw new BadRequestException('Assinatura do webhook invalida');
    }

    await this.billingService.handleWebhookEvent(event);

    return { received: true };
  }
}

import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module.js';
import { BillingController } from './billing.controller.js';
import { BillingService } from './billing.service.js';
import { StripeWebhookController } from './stripe-webhook.controller.js';

@Module({
  imports: [PrismaModule],
  controllers: [BillingController, StripeWebhookController],
  providers: [BillingService],
  exports: [BillingService],
})
export class BillingModule {}

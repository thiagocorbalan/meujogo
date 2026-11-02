import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { BillingService } from './billing.service.js';
import { CreateCheckoutDto } from './dto/create-checkout.dto.js';

@Controller('billing')
@UseGuards(JwtAuthGuard)
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  @Post('checkout')
  createCheckout(@Req() req: any, @Body() dto: CreateCheckoutDto) {
    return this.billingService.createCheckout(
      dto.priceId,
      dto.groupId,
      req.user.id,
    );
  }

  @Post('portal')
  createPortal(@Body() body: { groupId: number }) {
    // customerId would come from the group's Stripe customer record.
    // For now we pass groupId and let the service resolve the customer.
    // TODO: store stripeCustomerId on Group model and look it up here.
    return this.billingService.createPortal(String(body.groupId));
  }
}

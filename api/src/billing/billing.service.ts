import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CryptoService } from '../common/services/crypto.service.js';

@Injectable()
export class BillingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly crypto: CryptoService,
  ) {}

  // Lazy init: Stripe client is created on first use, not at module init.
  // This ensures the integration config is read at runtime.
  async getStripeClient() {
    const config = await this.prisma.integrationConfig.findUnique({
      where: { service: 'STRIPE' },
    });

    if (
      !config ||
      !config.isConfigured ||
      !config.encryptedKey ||
      !config.keyIv ||
      !config.keyTag
    ) {
      throw new ServiceUnavailableException('Stripe nao configurado');
    }

    const apiKey = this.crypto.decrypt(
      config.encryptedKey,
      config.keyIv,
      config.keyTag,
    );

    // @ts-ignore — stripe v22 exports are resolved at runtime by Node
    const { default: Stripe } = await import('stripe');
    return new Stripe(apiKey) as any;
  }

  async createCheckout(priceId: string, groupId: number, userId: number) {
    const stripe = await this.getStripeClient();

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { email: true },
    });

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      metadata: {
        groupId: String(groupId),
        userId: String(userId),
      },
      customer_email: user?.email ?? undefined,
      subscription_data: {
        metadata: {
          groupId: String(groupId),
          userId: String(userId),
        },
      },
      success_url: `${process.env.APP_URL ?? 'http://localhost:4000'}/configuracoes?checkout=success`,
      cancel_url: `${process.env.APP_URL ?? 'http://localhost:4000'}/configuracoes?checkout=cancel`,
    });

    return { url: session.url };
  }

  async createPortal(customerId: string) {
    const stripe = await this.getStripeClient();

    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${process.env.APP_URL ?? 'http://localhost:4000'}/configuracoes`,
    });

    return { url: session.url };
  }

  async handleWebhookEvent(event: any) {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const groupId = session.metadata?.groupId
          ? parseInt(session.metadata.groupId as string, 10)
          : null;

        if (groupId && session.subscription) {
          // Group will be updated via customer.subscription.updated event
        }
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object;
        const groupId = subscription.metadata?.groupId
          ? parseInt(subscription.metadata.groupId as string, 10)
          : null;

        if (groupId) {
          const priceId = subscription.items?.data?.[0]?.price?.id as
            | string
            | undefined;

          if (priceId) {
            const plan = await this.prisma.plan.findFirst({
              where: {
                OR: [
                  { stripePriceIdMonthly: priceId },
                  { stripePriceIdAnnual: priceId },
                ],
              },
            });

            if (plan) {
              await this.prisma.group.update({
                where: { id: groupId },
                data: { planId: plan.id },
              });
            }
          }
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        const groupId = subscription.metadata?.groupId
          ? parseInt(subscription.metadata.groupId as string, 10)
          : null;

        if (groupId) {
          // Downgrade to free plan (planId: null) when subscription is cancelled
          await this.prisma.group.update({
            where: { id: groupId },
            data: { planId: null },
          });
        }
        break;
      }

      case 'invoice.payment_failed': {
        // Payment failure logged; notify group owner can be added here
        break;
      }

      default:
        // Unhandled event type — no action needed
        break;
    }
  }

  async getBillingOverview() {
    const [planDistributionRaw, activeTrials] = await Promise.all([
      // Group count per plan
      this.prisma.group.groupBy({
        by: ['planId'],
        _count: { id: true },
        where: { isActive: true },
      }),
      // Active trials: groups with a plan that has trialDays > 0
      this.prisma.group.count({
        where: {
          isActive: true,
          plan: {
            trialDays: { gt: 0 },
          },
        },
      }),
    ]);

    // Resolve plan names
    const planIds = planDistributionRaw
      .map((r) => r.planId)
      .filter((id): id is number => id !== null);

    const plans =
      planIds.length > 0
        ? await this.prisma.plan.findMany({
            where: { id: { in: planIds } },
            select: { id: true, name: true },
          })
        : [];

    const planNameMap = new Map(plans.map((p) => [p.id, p.name]));

    const planDistribution = planDistributionRaw.map((r) => ({
      planId: r.planId,
      planName: r.planId ? (planNameMap.get(r.planId) ?? 'Unknown') : 'Free',
      groupCount: r._count.id,
    }));

    // recentPayments and failedPayments come from Stripe events in future integration
    return {
      planDistribution,
      activeTrials,
      recentPayments: [] as unknown[],
      failedPayments: [] as unknown[],
    };
  }
}

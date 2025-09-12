// lib/stripe/subscription-check.ts

import { PrismaClient ,SubscriptionStatus} from "../../../../packages/database/generated/client";

const prisma = new PrismaClient();

export interface SubscriptionCheckResult {
  hasActiveSubscription: boolean;
  subscriptionStatus: SubscriptionStatus;
  trialExpired: boolean;
  daysLeftInTrial?: number;
  cancelAtPeriodEnd?: boolean; // NEW FIELD
  subscriptionEndsAt?: Date;   // NEW FIELD - when subscription will actually end
}

export async function checkSubscriptionStatus(
  organizationId: string
): Promise<SubscriptionCheckResult> {
  try {
    const organization = await prisma.organization.findUnique({
      where: { id: organizationId },
      select: {
        subscriptionStatus: true,
        isSubscriptionActive: true,
        trialEndsAt: true,
        subscriptionPeriodEnd: true,
        cancelAtPeriodEnd: true // NEW FIELD
      }
    });

    if (!organization) {
      return {
        hasActiveSubscription: false,
        subscriptionStatus: 'EXPIRED',
        trialExpired: true
      };
    }

    const now = new Date();
    const {
      subscriptionStatus,
      isSubscriptionActive,
      trialEndsAt,
      subscriptionPeriodEnd,
      cancelAtPeriodEnd
    } = organization;

    // Check if subscription is active and paid
    if (subscriptionStatus === 'ACTIVE' && isSubscriptionActive) {
      return {
        hasActiveSubscription: true,
        subscriptionStatus: 'ACTIVE',
        trialExpired: false,
        cancelAtPeriodEnd: cancelAtPeriodEnd || false,
        subscriptionEndsAt: cancelAtPeriodEnd && subscriptionPeriodEnd ? subscriptionPeriodEnd : undefined
      };
    }

    // Check trial status
    if (subscriptionStatus === 'TRIAL' && trialEndsAt) {
      const trialExpired = now > trialEndsAt;
      const daysLeft = trialExpired 
        ? 0 
        : Math.ceil((trialEndsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      return {
        hasActiveSubscription: !trialExpired,
        subscriptionStatus: trialExpired ? 'EXPIRED' : 'TRIAL',
        trialExpired,
        daysLeftInTrial: daysLeft,
        cancelAtPeriodEnd: false // Trials don't have period-end cancellation
      };
    }

    // Check if subscription is past due but still in grace period
    if (subscriptionStatus === 'PAST_DUE' && subscriptionPeriodEnd) {
      const gracePeriodEnd = new Date(subscriptionPeriodEnd.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days grace
      const inGracePeriod = now < gracePeriodEnd;

      return {
        hasActiveSubscription: inGracePeriod,
        subscriptionStatus: 'PAST_DUE',
        trialExpired: false,
        cancelAtPeriodEnd: cancelAtPeriodEnd || false,
        subscriptionEndsAt: subscriptionPeriodEnd
      };
    }

    // Default: no active subscription
    return {
      hasActiveSubscription: false,
      subscriptionStatus: subscriptionStatus || 'EXPIRED',
      trialExpired: true,
      cancelAtPeriodEnd: false
    };
  } catch (error) {
    console.error('Error checking subscription status:', error);
    return {
      hasActiveSubscription: false,
      subscriptionStatus: 'EXPIRED',
      trialExpired: true,
      cancelAtPeriodEnd: false
    };
  }
}
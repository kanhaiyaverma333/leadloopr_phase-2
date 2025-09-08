// lib/stripe/subscription.ts
import { stripe } from './stripe';
import Stripe from 'stripe';

export async function cancelSubscriptionImmediately(subscriptionId: string): Promise<Stripe.Subscription> {
  return stripe.subscriptions.cancel(subscriptionId, {
    prorate: true,
  });
}

export async function cancelSubscriptionAtPeriodEnd(
  subscriptionId: string,
  metadata: { cancellation_reason?: string; cancelled_by?: string }
): Promise<Stripe.Subscription> {
  return stripe.subscriptions.update(subscriptionId, {
    cancel_at_period_end: true,
    metadata: {
      cancellation_reason: metadata.cancellation_reason || 'User requested cancellation',
      cancelled_by: metadata.cancelled_by || 'unknown',
      cancelled_at: new Date().toISOString()
    }
  });
}

// app/api/webhooks/stripe/route.ts - Updated for Stripe 2025 changes
import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '../../../../lib/stripe/stripe';
import { PrismaClient } from '../../../../../../packages/database/generated/client';
import Stripe from 'stripe';

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  const startTime = Date.now();

  try {
    const body = await req.text();
    const signature = req.headers.get('stripe-signature');

    if (!signature) {
      console.error('❌ Missing Stripe signature header');
      return new Response('Missing signature', { status: 400 });
    }

    if (!process.env.STRIPE_WEBHOOK_SECRET) {
      console.error('❌ STRIPE_WEBHOOK_SECRET not configured');
      return new Response('Webhook secret not configured', { status: 500 });
    }

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET
      );
      console.log('✅ Stripe webhook signature verified successfully');
    } catch (err) {
      console.error('❌ Stripe webhook signature verification failed:', err);
      return new Response('Invalid signature', { status: 400 });
    }

    console.log(`📋 Processing Stripe webhook: ${event.type}`, {
      id: event.id,
      created: new Date(event.created * 1000).toISOString(),
    });

    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;
      case 'checkout.session.expired':
        await handleCheckoutExpired(event.data.object as Stripe.Checkout.Session);
        break;
      case 'customer.subscription.created':
        await handleSubscriptionCreated(event.data.object as Stripe.Subscription);
        break;
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;
      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice);
        break;
      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
        break;
      default:
        console.log(`ℹ️ Unhandled Stripe webhook event: ${event.type}`);
    }

    await storeStripeEvent(event);

    const totalTime = Date.now() - startTime;
    console.log(`✅ Stripe webhook processed successfully in ${totalTime}ms`);

    return NextResponse.json({
      received: true,
      event_type: event.type,
      processing_time_ms: totalTime,
    });
  } catch (error) {
    const totalTime = Date.now() - startTime;
    console.error(`❌ Stripe webhook processing failed after ${totalTime}ms:`, error);
    return new Response('Internal server error', { status: 500 });
  }
}

/**
 * Build subscription update data (safe for Stripe 2025 API)
 */
function buildSubscriptionUpdateData(subscription: Stripe.Subscription): any {
  const updateData: any = {
    stripeSubscriptionId: subscription.id,
    subscriptionStatus: mapStripeStatusToDb(subscription.status),
    isSubscriptionActive: ['active', 'trialing'].includes(subscription.status),
  };

  // ✅ Always save price ID from first subscription item
  const firstItem = subscription.items.data[0];
  if (firstItem) {
    updateData.stripePriceId = firstItem.price.id;

    // ✅ Handle period dates using subscription item (Stripe 2025 change)
    if (firstItem.current_period_start) {
      updateData.lastBillingDate = new Date(firstItem.current_period_start * 1000);
    }
    if (firstItem.current_period_end) {
      updateData.subscriptionPeriodEnd = new Date(firstItem.current_period_end * 1000);
      updateData.nextBillingDate = new Date(firstItem.current_period_end * 1000);
    }
  }

  // ✅ Handle trial info
  if (subscription.status === 'trialing' && subscription.trial_end) {
    updateData.trialEndsAt = new Date(subscription.trial_end * 1000);
  } else if (subscription.status === 'active') {
    updateData.trialEndsAt = null;
  }

  return updateData;
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  console.log('💳 Processing checkout.session.completed', {
    sessionId: session.id,
    customerId: session.customer,
    subscriptionId: session.subscription,
    organizationId: session.metadata?.organizationId,
  });

  const organizationId = session.metadata?.organizationId;
  if (!organizationId) {
    console.warn('⚠️ No organizationId in checkout session metadata');
    return;
  }

  try {
    const updateData: any = {
      stripeCustomerId: session.customer as string,
    };

    if (session.customer_details?.email) {
      updateData.billingEmail = session.customer_details.email;
    }

    if (session.subscription) {
      const subscription = await stripe.subscriptions.retrieve(
        session.subscription as string
      );
      Object.assign(updateData, buildSubscriptionUpdateData(subscription));
    }

    await prisma.organization.update({
      where: { id: organizationId },
      data: updateData,
    });

    console.log('✅ Organization updated after checkout completion', updateData);
  } catch (error) {
    console.error('❌ Error updating organization after checkout completion:', error);
    throw error;
  }
}

async function handleSubscriptionCreated(subscription: Stripe.Subscription) {
  console.log('🆕 Processing customer.subscription.created', {
    subscriptionId: subscription.id,
    customerId: subscription.customer,
    status: subscription.status,
    priceId: subscription.items.data[0]?.price.id,
  });

  try {
    const organization = await prisma.organization.findFirst({
      where: { stripeCustomerId: subscription.customer as string },
    });
    if (!organization) {
      console.warn(`⚠️ Organization not found for customer: ${subscription.customer}`);
      return;
    }

    await prisma.organization.update({
      where: { id: organization.id },
      data: buildSubscriptionUpdateData(subscription),
    });

    console.log('✅ Organization updated after subscription creation');
  } catch (error) {
    console.error('❌ Error handling subscription creation:', error);
    throw error;
  }
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  console.log('🔄 Processing customer.subscription.updated', {
    subscriptionId: subscription.id,
    customerId: subscription.customer,
    status: subscription.status,
    priceId: subscription.items.data[0]?.price.id,
  });

  try {
    const organization = await prisma.organization.findFirst({
      where: { stripeCustomerId: subscription.customer as string },
    });
    if (!organization) {
      console.warn(`⚠️ Organization not found for customer: ${subscription.customer}`);
      return;
    }

    await prisma.organization.update({
      where: { id: organization.id },
      data: buildSubscriptionUpdateData(subscription),
    });

    console.log('✅ Organization updated after subscription update');
  } catch (error) {
    console.error('❌ Error handling subscription update:', error);
    throw error;
  }
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  console.log('🗑️ Processing customer.subscription.deleted', {
    subscriptionId: subscription.id,
    customerId: subscription.customer,
  });

  try {
    const organization = await prisma.organization.findFirst({
      where: { stripeCustomerId: subscription.customer as string },
    });
    if (!organization) {
      console.warn(`⚠️ Organization not found for customer: ${subscription.customer}`);
      return;
    }

    await prisma.organization.update({
      where: { id: organization.id },
      data: {
        subscriptionStatus: 'CANCELED',
        isSubscriptionActive: false,
        stripeSubscriptionId: null,
        stripePriceId: null,
        nextBillingDate: null,
        subscriptionPeriodEnd: null,
        trialEndsAt: null,
      },
    });

    console.log('✅ Organization updated after subscription deletion');
  } catch (error) {
    console.error('❌ Error handling subscription deletion:', error);
    throw error;
  }
}

async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  console.log('💰 Processing invoice.payment_succeeded', {
    invoiceId: invoice.id,
    customerId: invoice.customer,
    subscriptionId: typeof invoice.lines.data[0]?.subscription === 'string'
      ? invoice.lines.data[0]?.subscription
      : null,
    amount: invoice.amount_paid,
  });

  try {
    const organization = await prisma.organization.findFirst({
      where: { stripeCustomerId: invoice.customer as string },
    });
    if (!organization) {
      console.warn(`⚠️ Organization not found for customer: ${invoice.customer}`);
      return;
    }

    const updateData: any = {
      subscriptionStatus: 'ACTIVE',
      isSubscriptionActive: true,
      lastBillingDate: new Date(),
    };

    if (invoice.customer_email) {
      updateData.billingEmail = invoice.customer_email;
    }

    const subscriptionId =
      typeof invoice.lines.data[0]?.subscription === 'string'
        ? invoice.lines.data[0]?.subscription
        : null;
    if (subscriptionId) {
      const subscription = await stripe.subscriptions.retrieve(subscriptionId);
      Object.assign(updateData, buildSubscriptionUpdateData(subscription));
    }

    await prisma.organization.update({
      where: { id: organization.id },
      data: updateData,
    });

    console.log('✅ Organization updated after invoice payment succeeded');
  } catch (error) {
    console.error('❌ Error handling invoice success:', error);
    throw error;
  }
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  const subscriptionId =
    typeof (invoice as any).subscription === 'string'
      ? (invoice as any).subscription
      : invoice.lines.data[0]?.subscription || null;

  console.log('❌ Processing invoice.payment_failed', {
    invoiceId: invoice.id,
    customerId: invoice.customer,
    subscriptionId,
  });

  try {
    const organization = await prisma.organization.findFirst({
      where: { stripeCustomerId: invoice.customer as string },
    });
    if (!organization) {
      console.warn(`⚠️ Organization not found for customer: ${invoice.customer}`);
      return;
    }

    const updateData: any = {
      subscriptionStatus: 'PAST_DUE',
      isSubscriptionActive: false,
    };

    if (subscriptionId) {
      const subscription = await stripe.subscriptions.retrieve(subscriptionId);
      Object.assign(updateData, buildSubscriptionUpdateData(subscription));
    }

    await prisma.organization.update({
      where: { id: organization.id },
      data: updateData,
    });

    console.log('✅ Organization updated after failed invoice payment');
  } catch (error) {
    console.error('❌ Error handling invoice failure:', error);
    throw error;
  }
}

async function handleCheckoutExpired(session: Stripe.Checkout.Session) {
  console.log('⏰ Processing checkout.session.expired', {
    sessionId: session.id,
    organizationId: session.metadata?.organizationId,
  });
}

function mapStripeStatusToDb(
  stripeStatus: string
): 'TRIAL' | 'ACTIVE' | 'PAST_DUE' | 'CANCELED' | 'INCOMPLETE' | 'EXPIRED' {
  switch (stripeStatus) {
    case 'active':
      return 'ACTIVE';
    case 'past_due':
      return 'PAST_DUE';
    case 'canceled':
    case 'cancelled':
      return 'CANCELED';
    case 'incomplete':
    case 'incomplete_expired':
      return 'INCOMPLETE';
    case 'trialing':
      return 'TRIAL';
    default:
      console.warn(`⚠️ Unknown Stripe status: ${stripeStatus}, defaulting to EXPIRED`);
      return 'EXPIRED';
  }
}

async function storeStripeEvent(event: Stripe.Event) {
  try {
    await prisma.stripeEvent.create({
      data: {
        stripeEventId: event.id,
        eventType: event.type,
        data: JSON.stringify(event.data),
        processed: true,
        organizationId: extractOrganizationId(event),
      },
    });
  } catch (error) {
    console.error('❌ Error storing Stripe event:', error);
  }
}

function extractOrganizationId(event: Stripe.Event): string | null {
  const data = event.data.object as any;
  if (data.metadata?.organizationId) return data.metadata.organizationId;
  if (event.type.startsWith('checkout.session')) {
    return data.metadata?.organizationId || null;
  }
  return null;
}

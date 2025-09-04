// app/api/webhooks/stripe/route.ts
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

    // Verify webhook signature
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

    console.log(`🔔 Processing Stripe webhook: ${event.type}`, {
      id: event.id,
      created: new Date(event.created * 1000).toISOString()
    });

    // Handle different event types
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;
        
      case 'checkout.session.expired':
        await handleCheckoutExpired(event.data.object as Stripe.Checkout.Session);
        break;

      case 'customer.source.updated':
        await handleCustomerSourceUpdated(event.data.object as Stripe.Source);
        break;

      case 'customer.subscription.created':
        await handleSubscriptionCreated(event.data.object as Stripe.Subscription);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;

      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice);
        break;

      default:
        console.log(`ℹ️ Unhandled Stripe webhook event: ${event.type}`);
    }

    // Store event for audit trail
    await storeStripeEvent(event);

    const totalTime = Date.now() - startTime;
    console.log(`✅ Stripe webhook processed successfully in ${totalTime}ms`);

    return NextResponse.json({ 
      received: true, 
      event_type: event.type,
      processing_time_ms: totalTime 
    });

  } catch (error) {
    const totalTime = Date.now() - startTime;
    console.error(`❌ Stripe webhook processing failed after ${totalTime}ms:`, error);
    return new Response('Internal server error', { status: 500 });
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  console.log('💳 Processing checkout.session.completed', {
    sessionId: session.id,
    customerId: session.customer,
    subscriptionId: session.subscription,
    organizationId: session.metadata?.organizationId
  });

  const organizationId = session.metadata?.organizationId;
  if (!organizationId) {
    console.warn('⚠️ No organizationId in checkout session metadata');
    return;
  }

  try {
    // Get the subscription details if it exists
    let subscriptionData = null;
    if (session.subscription) {
      subscriptionData = await stripe.subscriptions.retrieve(session.subscription as string);
    }

    const updateData: any = {
      stripeCustomerId: session.customer as string,
    };

    if (subscriptionData) {
      updateData.stripeSubscriptionId = subscriptionData.id;
      updateData.subscriptionStatus = mapStripeStatusToDb(subscriptionData.status);
      updateData.isSubscriptionActive = subscriptionData.status === 'active';
      updateData.subscriptionPeriodEnd = new Date((subscriptionData as any).current_period_end * 1000);
      updateData.stripePriceId = subscriptionData.items.data[0]?.price.id;
      
      // If subscription is active, clear trial
      if (subscriptionData.status === 'active') {
        updateData.trialEndsAt = null;
      }
    }

    const organization = await prisma.organization.update({
      where: { id: organizationId },
      data: updateData
    });

    console.log('✅ Organization updated after checkout completion:', {
      organizationId: organization.id,
      subscriptionStatus: organization.subscriptionStatus,
      isActive: organization.isSubscriptionActive
    });

  } catch (error) {
    console.error(`❌ Error updating organization after checkout completion:`, error);
    throw error;
  }
}

async function handleCheckoutExpired(session: Stripe.Checkout.Session) {
  console.log('⏰ Processing checkout.session.expired', {
    sessionId: session.id,
    organizationId: session.metadata?.organizationId
  });
  
  // Could optionally track failed checkout attempts
  // For now, just log it
}

async function handleCustomerSourceUpdated(source: Stripe.Source) {
  console.log('💳 Processing customer.source.updated', {
    customerId: source.customer,
    sourceId: source.id
  });
  
  // Payment method updated - could trigger notification or update billing info
}

async function handleSubscriptionCreated(subscription: Stripe.Subscription) {
  console.log('🆕 Processing customer.subscription.created', {
    subscriptionId: subscription.id,
    customerId: subscription.customer,
    status: subscription.status
  });

  try {
    const organization = await prisma.organization.findFirst({
      where: { stripeCustomerId: subscription.customer as string }
    });

    if (!organization) {
      console.warn(`⚠️ Organization not found for Stripe customer: ${subscription.customer}`);
      return;
    }

    await prisma.organization.update({
      where: { id: organization.id },
      data: {
        stripeSubscriptionId: subscription.id,
        subscriptionStatus: mapStripeStatusToDb(subscription.status),
        isSubscriptionActive: subscription.status === 'active',
        subscriptionPeriodEnd: new Date((subscription as any).current_period_end * 1000),
        stripePriceId: subscription.items.data[0]?.price.id,
        nextBillingDate: new Date((subscription as any).current_period_end * 1000),
        // Clear trial when subscription becomes active
        trialEndsAt: subscription.status === 'active' ? null : organization.trialEndsAt
      }
    });

    console.log('✅ Organization updated after subscription creation');

  } catch (error) {
    console.error('❌ Error handling subscription creation:', error);
    throw error;
  }
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  console.log('🗑️ Processing customer.subscription.deleted', {
    subscriptionId: subscription.id,
    customerId: subscription.customer
  });

  try {
    const organization = await prisma.organization.findFirst({
      where: { stripeCustomerId: subscription.customer as string }
    });

    if (!organization) {
      console.warn(`⚠️ Organization not found for Stripe customer: ${subscription.customer}`);
      return;
    }

    await prisma.organization.update({
      where: { id: organization.id },
      data: {
        subscriptionStatus: 'CANCELED',
        isSubscriptionActive: false,
        stripeSubscriptionId: null,
        stripePriceId: null,
        nextBillingDate: null
      }
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
    subscriptionId: (invoice as any).subscription, // Use type assertion if you expect subscription to exist
    amount: invoice.amount_paid
  });

  try {
    const organization = await prisma.organization.findFirst({
      where: { stripeCustomerId: invoice.customer as string }
    });

    if (!organization) {
      console.warn(`⚠️ Organization not found for Stripe customer: ${invoice.customer}`);
      return;
    }

    // Update billing dates and ensure subscription is active
    await prisma.organization.update({
      where: { id: organization.id },
      data: {
        subscriptionStatus: 'ACTIVE',
        isSubscriptionActive: true,
        lastBillingDate: new Date(),
        nextBillingDate: invoice.next_payment_attempt ? 
          new Date(invoice.next_payment_attempt * 1000) : 
          null
      }
    });

    console.log('✅ Organization updated after successful invoice payment');

  } catch (error) {
    console.error('❌ Error handling invoice payment success:', error);
    throw error;
  }
}

// Helper function to map Stripe subscription status to your DB enum
function mapStripeStatusToDb(stripeStatus: string): 'TRIAL' | 'ACTIVE' | 'PAST_DUE' | 'CANCELED' | 'INCOMPLETE' | 'EXPIRED' {
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

// Store Stripe events for audit trail
async function storeStripeEvent(event: Stripe.Event) {
  try {
    await prisma.stripeEvent.create({
      data: {
        stripeEventId: event.id,
        eventType: event.type,
        data: JSON.stringify(event.data),
        processed: true,
        organizationId: extractOrganizationId(event)
      }
    });
  } catch (error) {
    console.error('❌ Error storing Stripe event:', error);
    // Don't throw - this shouldn't break webhook processing
  }
}

// Extract organization ID from various event types
function extractOrganizationId(event: Stripe.Event): string | null {
  const data = event.data.object as any;
  
  // Try to get org ID from metadata
  if (data.metadata?.organizationId) {
    return data.metadata.organizationId;
  }
  
  // For checkout sessions
  if (event.type.startsWith('checkout.session')) {
    return data.metadata?.organizationId || null;
  }
  
  return null;
}



// import { NextRequest } from 'next/server';
// import { stripe } from '../../../../lib/stripe/stripe';
// import { prisma } from '@repo/database';
// import Stripe from 'stripe';

// export async function POST(req: NextRequest) {
//   const body = await req.text();
//   const signature = req.headers.get('stripe-signature')!;

//   let event: Stripe.Event;

//   try {
//     event = stripe.webhooks.constructEvent(
//       body,
//       signature,
//       process.env.STRIPE_WEBHOOK_SECRET!
//     );
//   } catch (err) {
//     console.error('Webhook signature verification failed:', err);
//     return new Response('Webhook Error', { status: 400 });
//   }

//   switch (event.type) {
//     case 'checkout.session.completed':
//       await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
//       break;
    
//     case 'customer.subscription.created':
//     case 'customer.subscription.updated':
//       await handleSubscriptionUpdate(event.data.object as Stripe.Subscription);
//       break;
      
//     case 'customer.subscription.deleted':
//       await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
//       break;
//   }

//   return new Response('OK', { status: 200 });
// }

// async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
//   const organizationId = session.metadata?.organizationId;
//   if (!organizationId) return;

//   // Update organization with subscription details
//   await prisma.organization.update({
//     where: { id: organizationId },
//     data: {
//       stripeSubscriptionId: session.subscription as string,
//       subscriptionStatus: 'ACTIVE',
//       isSubscriptionActive: true,
//     }
//   });
// }

// async function handleSubscriptionUpdate(subscription: Stripe.Subscription) {
//   // Find organization by customer ID
//   const org = await prisma.organization.findFirst({
//     where: { stripeCustomerId: subscription.customer as string }
//   });
  
//   if (!org) return;

//   await prisma.organization.update({
//     where: { id: org.id },
//     data: {
//       subscriptionStatus: subscription.status === 'active' ? 'ACTIVE' : 
//                          subscription.status === 'past_due' ? 'PAST_DUE' :
//                          'EXPIRED',
//       isSubscriptionActive: subscription.status === 'active',
//       subscriptionPeriodEnd: new Date((subscription as any).current_period_end * 1000),
//       stripePriceId: subscription.items.data[0]?.price.id,
//     }
//   });
// }

// async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
//   // Find organization by customer ID
//   const org = await prisma.organization.findFirst({
//     where: { stripeCustomerId: subscription.customer as string }
//   });

//   if (!org) return;

//   await prisma.organization.update({
//     where: { id: org.id },
//     data: {
//       subscriptionStatus: 'EXPIRED',
//       isSubscriptionActive: false,
//       subscriptionPeriodEnd: null,
//       stripePriceId: null,
//     }
//   });
// }
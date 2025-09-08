// app/api/billing/cancel-subscription/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { PrismaClient } from '../../../../../../packages/database/generated/client';
import { cancelSubscriptionImmediately, cancelSubscriptionAtPeriodEnd } from '../../../../lib/stripe/subscription';
import Stripe from 'stripe';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { cancelImmediately = false, reason } = await request.json().catch(() => ({}));

    console.log('Cancel subscription request:', { cancelImmediately, reason, userId });

    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      include: {
        currentOrganization: {
          select: {
            id: true,
            stripeCustomerId: true,
            stripeSubscriptionId: true,
            subscriptionStatus: true,
            isSubscriptionActive: true
          }
        }
      }
    });

    if (!user || !user.currentOrganization) {
      return NextResponse.json({ error: 'User or organization not found' }, { status: 404 });
    }

    const organization = user.currentOrganization;

    if (!organization.stripeSubscriptionId || !organization.isSubscriptionActive) {
      return NextResponse.json({ error: 'No active subscription found' }, { status: 400 });
    }

    let canceledSubscription: Stripe.Subscription;
    try {
      if (cancelImmediately) {
        console.log('Cancelling subscription immediately:', organization.stripeSubscriptionId);
        canceledSubscription = await cancelSubscriptionImmediately(organization.stripeSubscriptionId);
      } else {
        console.log('Cancelling subscription at period end:', organization.stripeSubscriptionId);
        canceledSubscription = await cancelSubscriptionAtPeriodEnd(organization.stripeSubscriptionId, {
          cancellation_reason: reason,
          cancelled_by: user.email || 'unknown'
        });
      }

      console.log('Subscription cancelled in Stripe:', {
        subscriptionId: organization.stripeSubscriptionId,
        immediate: cancelImmediately,
        status: canceledSubscription.status,
        cancel_at_period_end: canceledSubscription.cancel_at_period_end,
        current_period_end: canceledSubscription.items.data[0].current_period_end
      });

    } catch (stripeError: any) {
      console.error('Error cancelling subscription in Stripe:', stripeError);
      return NextResponse.json({
        error: 'Failed to cancel subscription in Stripe',
        details: stripeError.message || 'Unknown error'
      }, { status: 500 });
    }

    // Update database based on cancellation type
    let updateData: any = {};
    if (cancelImmediately) {
      updateData = {
        subscriptionStatus: 'CANCELED',
        isSubscriptionActive: false,
        stripeSubscriptionId: null,
        stripePriceId: null,
        nextBillingDate: null,
        subscriptionPeriodEnd: null
      };
    } else {
      // For period end cancellation, keep subscription active but remove next billing date
      updateData = {
        nextBillingDate: null,
        // Optionally set a flag to indicate it's scheduled for cancellation
        subscriptionStatus: 'ACTIVE_CANCEL_AT_PERIOD_END' // You might need to add this status to your enum
      };
    }

    await prisma.organization.update({
      where: { id: organization.id },
      data: updateData
    });

    console.log('Organization updated after subscription cancellation:', updateData);

    // Calculate end date for period-end cancellations
   let endsAt: string | null = null;
const periodEnd = canceledSubscription.items.data[0].current_period_end;
if (!cancelImmediately && periodEnd !== null && periodEnd !== undefined) {
  endsAt = new Date(periodEnd * 1000).toISOString();
}

    // Send the response (removed duplicate return)
    return NextResponse.json({
      success: true,
      cancelled: true,
      immediate: cancelImmediately,
      endsAt,
      subscriptionStatus: canceledSubscription.status,
      cancelAtPeriodEnd: canceledSubscription.cancel_at_period_end,
      message: cancelImmediately
        ? 'Subscription cancelled immediately'
        : 'Subscription will cancel at the end of current billing period'
    });

  } catch (error: any) {
    console.error('Unexpected error cancelling subscription:', error);
    return NextResponse.json({
      error: error.message || 'Failed to cancel subscription'
    }, { status: 500 });
  }
}
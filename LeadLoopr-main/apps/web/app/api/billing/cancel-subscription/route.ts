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
            isSubscriptionActive: true,
            cancelAtPeriodEnd: true // Include the new field
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

    // Check if subscription is already scheduled for cancellation
    if (organization.cancelAtPeriodEnd && !cancelImmediately) {
      return NextResponse.json({ 
        error: 'Subscription is already scheduled for cancellation at period end' 
      }, { status: 400 });
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
      // Immediate cancellation - set status to CANCELED and deactivate
      updateData = {
        subscriptionStatus: 'CANCELED',
        isSubscriptionActive: false,
        cancelAtPeriodEnd: false, // Reset this field
        stripeSubscriptionId: null,
        stripePriceId: null,
        nextBillingDate: null,
        subscriptionPeriodEnd: null
      };
    } else {
      // Period end cancellation - keep ACTIVE status but set flag
      updateData = {
        cancelAtPeriodEnd: true, // Set the new flag
        nextBillingDate: null, // Remove next billing since it's scheduled for cancellation
        // Keep subscriptionStatus as ACTIVE since subscription is still active until period end
        // Keep isSubscriptionActive as true since user still has access
      };
    }

    await prisma.organization.update({
      where: { id: organization.id },
      data: updateData
    });

    console.log('Organization updated after subscription cancellation:', updateData);

    // Calculate end date for period-end cancellations
    let endsAt: string | null = null;
    if (canceledSubscription.items.data[0].current_period_end) {
      endsAt = new Date(canceledSubscription.items.data[0].current_period_end * 1000).toISOString();
    }

    // Send the response
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
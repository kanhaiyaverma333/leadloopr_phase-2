// app/api/billing/details/route.ts
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { PrismaClient } from '../../../../../../packages/database/generated/client';
import { stripe } from '../../../../lib/stripe/stripe';
import { getSubscriptionPlans } from '../../../../lib/stripe/subscription-plan';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user and current organization
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      include: {
        currentOrganization: true
      }
    });

    if (!user || !user.currentOrganization) {
      return NextResponse.json({ 
        error: 'User or organization not found' 
      }, { status: 404 });
    }

    const organization = user.currentOrganization;

    // Get available plans to match current plan
    const plans = await getSubscriptionPlans();
    const currentPlan = plans.find(plan => plan.stripePriceId === organization.stripePriceId);

    // Get payment method from Stripe if customer exists
    let paymentMethod = null;
    if (organization.stripeCustomerId) {
      try {
        const paymentMethods = await stripe.paymentMethods.list({
          customer: organization.stripeCustomerId,
          type: 'card',
          limit: 1,
        });
        
        if (paymentMethods.data.length > 0) {
          const pm = paymentMethods.data[0];
          paymentMethod = {
            brand: pm.card?.brand?.toUpperCase() || 'CARD',
            last4: pm.card?.last4 || '****',
            expMonth: pm.card?.exp_month || 0,
            expYear: pm.card?.exp_year || 0,
          };
        }
      } catch (error) {
        console.error('Error fetching payment method:', error);
        // Continue without payment method data
      }
    }

    // Calculate trial info
    let trialInfo = null;
   if (organization.trialEndsAt) {
  const now = new Date();
  const trialEnd = new Date(organization.trialEndsAt);
  const daysLeft = Math.max(0, Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));

  trialInfo = {
    daysLeft,
    endsAt: organization.trialEndsAt,
    isActive: daysLeft > 0
  };
}


    return NextResponse.json({
      subscription: {
        status: organization.subscriptionStatus,
        isActive: organization.isSubscriptionActive,
        periodEnd: organization.subscriptionPeriodEnd,
        nextBillingDate: organization.nextBillingDate,
        lastBillingDate: organization.lastBillingDate,
      },
      plan: currentPlan ? {
        name: currentPlan.name,
        price: currentPlan.price,
        currency: currentPlan.currency,
        interval: currentPlan.interval,
        leadLimit: currentPlan.leadLimit,
        teamLimit: currentPlan.teamLimit,
      } : null,
      paymentMethod,
      trialInfo,
    //   usage: {
    //     currentLeads: organization.currentPeriodLeads,
    //     leadLimit: organization.monthlyLeadLimit,
    //     teamMembers: organization.currentTeamMembers,
    //     teamLimit: organization.maxTeamMembers,
    //   }
    });

  } catch (error) {
    console.error('Error fetching billing details:', error);
    return NextResponse.json(
      { error: 'Failed to fetch billing details' },
      { status: 500 }
    );
  }
}
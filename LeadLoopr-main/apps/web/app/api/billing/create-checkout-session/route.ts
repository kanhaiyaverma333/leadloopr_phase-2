// app/api/billing/create-checkout-session/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { PrismaClient } from '../../../../../../packages/database/generated/client';
import { stripe } from '../../../../lib/stripe/stripe';
import { getSubscriptionPlans } from '../../../../lib/stripe/subscription-plan';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const { userId, orgId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { planId } = await request.json();
    if (!planId) {
      return NextResponse.json({ error: 'Plan ID is required' }, { status: 400 });
    }

    // Get organization context
    let organizationId = orgId;
    
    if (!organizationId) {
      const user = await prisma.user.findUnique({
        where: { clerkId: userId },
        select: { currentOrganizationId: true }
      });
      
      if (!user?.currentOrganizationId) {
        return NextResponse.json({ 
          error: 'No organization context found' 
        }, { status: 404 });
      }
      
      organizationId = user.currentOrganizationId;
    }

    // Verify user has admin access to this organization
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { id: true, email: true, firstName: true, lastName: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const organizationUser = await prisma.organizationUser.findUnique({
      where: {
        userId_organizationId: {
          userId: user.id,
          organizationId: organizationId
        }
      },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            stripeCustomerId: true,
            subscriptionStatus: true,
            isSubscriptionActive: true
          }
        }
      }
    });

    if (!organizationUser) {
      return NextResponse.json({ 
        error: 'Organization not found or access denied' 
      }, { status: 404 });
    }

    // Check if user has permission to manage billing (admin or owner)
    if (!['ADMIN', 'OWNER'].includes(organizationUser.role)) {
      return NextResponse.json({ 
        error: 'Insufficient permissions to manage billing' 
      }, { status: 403 });
    }

    const organization = organizationUser.organization;

    // Get the selected plan
    const plans = await getSubscriptionPlans();
    const selectedPlan = plans.find(p => p.id === planId);
    
    if (!selectedPlan) {
      return NextResponse.json({ error: 'Invalid plan selected' }, { status: 400 });
    }

    // Check if organization already has an active subscription
    if (organization.isSubscriptionActive && organization.subscriptionStatus === 'ACTIVE') {
      return NextResponse.json({ 
        error: 'Organization already has an active subscription' 
      }, { status: 400 });
    }

    // Create or get Stripe customer for the organization
    let stripeCustomerId = organization.stripeCustomerId;
    
    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email,
        metadata: {
          organizationId: organization.id,
          organizationName: organization.name,
          userId: user.id,
          clerkUserId: userId
        },
      });
      
      stripeCustomerId = customer.id;
      
      // Update organization with Stripe customer ID
      await prisma.organization.update({
        where: { id: organization.id },
        data: { stripeCustomerId }
      });
    }

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price: selectedPlan.stripePriceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      subscription_data: {
        trial_period_days: selectedPlan.trialDays || 30,
        metadata: {
          organizationId: organization.id,
          organizationName: organization.name,
          planId: selectedPlan.id,
          planName: selectedPlan.name
        }
      },
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?session_id={CHECKOUT_SESSION_ID}&success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/subscription?canceled=true`,
      metadata: {
        organizationId: organization.id,
        planId: selectedPlan.id,
        userId: user.id
      },
      // Allow promotion codes
      allow_promotion_codes: true,
      // Collect billing address
      billing_address_collection: 'required',
      // Custom success message
      custom_text: {
        submit: {
          message: `You're subscribing ${organization.name} to the ${selectedPlan.name} plan.`
        }
      }
    });

    return NextResponse.json({ 
      url: session.url,
      sessionId: session.id,
      organization: {
        id: organization.id,
        name: organization.name
      },
      plan: {
        id: selectedPlan.id,
        name: selectedPlan.name,
        price: selectedPlan.price,
        interval: selectedPlan.interval
      }
    });

  } catch (error: any) {
    console.error('Error creating checkout session:', error);
    return NextResponse.json(
      { 
        error: 'Failed to create checkout session',
        details: error.message 
      },
      { status: 500 }
    );
  }
}
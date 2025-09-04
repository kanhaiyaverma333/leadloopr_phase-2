// app/api/billing/create-checkout-session/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { stripe } from '../../../../lib/stripe/stripe';
import { PrismaClient } from '../../../../../../packages/database/generated/client';
import { getSubscriptionPlan, SubscriptionPlan } from '../../../../lib/stripe/subscription-plan';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    // 1️⃣ Authenticate user
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2️⃣ Parse planId from request
    const { planId } = (await request.json()) as { planId: string };
    if (!planId) {
      return NextResponse.json({ error: 'Missing plan ID' }, { status: 400 });
    }

    // 3️⃣ Get plan from Stripe / cache
    const plan: SubscriptionPlan | null = await getSubscriptionPlan(planId);
    if (!plan) {
      return NextResponse.json({ error: 'Invalid plan ID' }, { status: 400 });
    }

    // 4️⃣ Fetch user + organization
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      include: { currentOrganization: true },
    });

    if (!user || !user.currentOrganization) {
      return NextResponse.json({ error: 'User or organization not found' }, { status: 404 });
    }

    const organization = user.currentOrganization;

    // 5️⃣ Create or reuse Stripe customer
    let stripeCustomerId = organization.stripeCustomerId;
    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim(),
        metadata: {
          organizationId: organization.id,
          userId: user.id,
        },
      });

      stripeCustomerId = customer.id;

      await prisma.organization.update({
        where: { id: organization.id },
        data: { stripeCustomerId },
      });
    }

    // 6️⃣ Create Checkout Session
    const checkoutSession = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price: plan.stripePriceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      subscription_data: {
        trial_period_days: plan.trialDays ?? 30,
        metadata: {
          organizationId: organization.id,
          planId: plan.id,
        },
      },
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?subscription=success`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/subscription?cancelled=true`,
      metadata: {
        organizationId: organization.id,
        planId: plan.id,
      },
    });

    return NextResponse.json({
      url: checkoutSession.url,
      sessionId: checkoutSession.id,
    });
  } catch (error: any) {
  console.error('Error creating checkout session:', error);
  return NextResponse.json(
    { error: error.message || 'Failed to create checkout session', details: error },
    { status: 500 }
  );
}
}

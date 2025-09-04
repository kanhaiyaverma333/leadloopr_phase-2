// app/api/billing/subscription-status/route.ts
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { PrismaClient } from '../../../../../../packages/database/generated/client';
import { checkSubscriptionStatus } from '../../../../lib/stripe/subscription-check';

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
        currentOrganization: {
          select: {
            id: true,
            subscriptionStatus: true,
            isSubscriptionActive: true,
            trialEndsAt: true,
            subscriptionPeriodEnd: true
          }
        }
      }
    });

    if (!user || !user.currentOrganization) {
      return NextResponse.json({ 
        error: 'User or organization not found' 
      }, { status: 404 });
    }

    const subscriptionStatus = await checkSubscriptionStatus(user.currentOrganization.id);

    return NextResponse.json(subscriptionStatus);

  } catch (error) {
    console.error('Error fetching subscription status:', error);
    return NextResponse.json(
      { error: 'Failed to fetch subscription status' },
      { status: 500 }
    );
  }
}
// app/api/billing/organization-subscription-status/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { PrismaClient } from '../../../../../../packages/database/generated/client';
import { checkSubscriptionStatus } from '../../../../lib/stripe/subscription-check';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get orgId from query params
    const { searchParams } = new URL(request.url);
    const orgId = searchParams.get('orgId');

    if (!orgId) {
      return NextResponse.json({ error: 'Organization ID is required' }, { status: 400 });
    }

    // Verify user has access to this organization
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { id: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const organizationUser = await prisma.organizationUser.findUnique({
      where: {
        userId_organizationId: {
          userId: user.id,
          organizationId: orgId
        }
      },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            subscriptionStatus: true,
            isSubscriptionActive: true,
            trialEndsAt: true,
            subscriptionPeriodEnd: true,
            cancelAtPeriodEnd: true
          }
        }
      }
    });

    if (!organizationUser) {
      return NextResponse.json({ 
        error: 'Organization not found or access denied' 
      }, { status: 404 });
    }

    // Get detailed subscription status
    const subscriptionStatus = await checkSubscriptionStatus(orgId);

    return NextResponse.json({
      organizationId: orgId,
      ...subscriptionStatus
    });

  } catch (error) {
    console.error('Error fetching organization subscription status:', error);
    return NextResponse.json(
      { error: 'Failed to fetch subscription status' },
      { status: 500 }
    );
  }
}
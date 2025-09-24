// app/api/billing/subscription-status/route.ts
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { PrismaClient } from '../../../../../../packages/database/generated/client';
import { checkSubscriptionStatus } from '../../../../lib/stripe/subscription-check';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const { userId, orgId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Use orgId from Clerk if available, otherwise fall back to user's current organization
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

    // Verify user has access to this organization
    const organizationUser = await prisma.organizationUser.findUnique({
      where: {
        userId_organizationId: {
          userId: await getUserId(userId),
          organizationId: organizationId
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
            cancelAtPeriodEnd: true,
            stripeCustomerId: true,
            stripeSubscriptionId: true
          }
        }
      }
    });

    if (!organizationUser) {
      return NextResponse.json({ 
        error: 'Organization not found or access denied' 
      }, { status: 404 });
    }

    const organization = organizationUser.organization;

    // Get detailed subscription status
    const subscriptionStatus = await checkSubscriptionStatus(organization.id);

    // Enhanced response with organization context
    return NextResponse.json({
      ...subscriptionStatus,
      organization: {
        id: organization.id,
        name: organization.name,
        hasStripeCustomer: !!organization.stripeCustomerId,
        hasActiveSubscription: organization.isSubscriptionActive,
        cancelAtPeriodEnd: organization.cancelAtPeriodEnd
      }
    });

  } catch (error) {
    console.error('Error fetching subscription status:', error);
    return NextResponse.json(
      { error: 'Failed to fetch subscription status' },
      { status: 500 }
    );
  }
}

// Helper function to get internal user ID from Clerk ID
async function getUserId(clerkId: string): Promise<string> {
  const user = await prisma.user.findUnique({
    where: { clerkId },
    select: { id: true }
  });
  
  if (!user) {
    throw new Error('User not found');
  }
  
  return user.id;
}
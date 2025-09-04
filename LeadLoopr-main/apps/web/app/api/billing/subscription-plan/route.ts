// app/api/billing/subscription-plans/route.ts
import { NextResponse } from 'next/server';
import { getSubscriptionPlans } from '../../../../lib/stripe/subscription-plan';

export async function GET() {
  try {
    const plans = await getSubscriptionPlans();
    
    return NextResponse.json({
      success: true,
      plans,
      count: plans.length,
      cached: true, // Will be true if served from cache
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error in subscription plans API:', error);
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch subscription plans',
        plans: []
      },
      { status: 500 }
    );
  }
}

// Optional: POST endpoint to refresh cache
export async function POST() {
  try {
    // Clear cache and fetch fresh data
    const { clearPlansCache } = await import('../../../../lib/stripe/subscription-plan');
    clearPlansCache();
    
    const plans = await getSubscriptionPlans();
    
    return NextResponse.json({
      success: true,
      message: 'Plans cache refreshed',
      plans,
      count: plans.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error refreshing subscription plans cache:', error);
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to refresh subscription plans cache'
      },
      { status: 500 }
    );
  }
}
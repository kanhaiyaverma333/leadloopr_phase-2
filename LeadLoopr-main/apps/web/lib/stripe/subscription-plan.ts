// lib/subscription-plans.ts (Updated version)
import { stripe } from '../stripe/stripe';
import Stripe from 'stripe';
import { getTrialDaysForPlan, TRIAL_CONFIG } from './trial-config';

export interface SubscriptionPlan {
  id: string;
  productId: string;
  name: string;
  price: number;
  currency: string;
  interval: string; // Will be "Monthly", "Quartly", or "Yearly"
  trialDays: number; // Make required, always have a value
  features: string[];
  stripePriceId: string;
  leadLimit: number;
  teamLimit: number;
  popular?: boolean;
}

// Cache for plans to avoid repeated Stripe API calls
let plansCache: SubscriptionPlan[] | null = null;
let cacheExpiry: number = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Fetch subscription plans from Stripe with caching
 */
export async function getSubscriptionPlans(): Promise<SubscriptionPlan[]> {
  // Return cached plans if still valid
  if (plansCache && Date.now() < cacheExpiry) {
    return plansCache;
  }

  try {
    // Fetch all active products
    const products = await stripe.products.list({
      active: true,
      expand: ['data.default_price']
    });

    // Fetch all active prices
    const prices = await stripe.prices.list({
      active: true,
      type: 'recurring'
    });

    // Map products to our plan structure
    const plans: SubscriptionPlan[] = products.data
      .map(product => {
        const productPrice = prices.data.find(price => price.product === product.id);
        if (!productPrice) return null;

        return mapStripeProductToPlan(product, productPrice);
      })
      .filter((plan): plan is SubscriptionPlan => plan !== null)
      .sort((a, b) => a.price - b.price); // Sort by price ascending

    // Update cache
    plansCache = plans;
    cacheExpiry = Date.now() + CACHE_DURATION;

    return plans;
  } catch (error) {
    console.error('Error fetching subscription plans from Stripe:', error);
    
    // Fallback to hardcoded plans if Stripe fails
    return getFallbackPlans();
  }
}

/**
 * Map Stripe product and price to our plan structure
 */
function mapStripeProductToPlan(
  product: Stripe.Product, 
  price: Stripe.Price
): SubscriptionPlan | null {
  if (!price.unit_amount) return null;

  // Extract custom metadata for features and limits
  const metadata = product.metadata || {};
  const planId = getReadablePlanId(product.name);
  
  return {
    id: planId,
    productId: product.id,
    name: product.name,
    price: price.unit_amount / 100, // Convert cents to dollars
    currency: price.currency,
    interval: metadata.interval || 'Monthly', // ✅ Use "Monthly", "Quartly", "Yearly" from metadata
    trialDays: getTrialDaysForPlan(planId),
    stripePriceId: price.id,
    features: parseFeatures(metadata.features || product.description || ''),
    leadLimit: parseInt(metadata.leadLimit || '0'),
    teamLimit: parseInt(metadata.teamLimit || '0'),
    popular: metadata.popular === 'true'
  };
}

/**
 * Convert product name to readable plan ID
 */
function getReadablePlanId(productName: string): string {
  return productName.toLowerCase().replace(/[^a-z0-9]/g, '');
}

/**
 * Parse features from metadata or description
 */
function parseFeatures(featuresString: string): string[] {
  if (!featuresString) return [];
  
  return featuresString
    .split(/[\n,|]/)
    .map(feature => feature.trim())
    .filter(feature => feature.length > 0);
}

/**
 * Fallback plans if Stripe API fails
 */
function getFallbackPlans(): SubscriptionPlan[] {
  return [
    {
      id: 'starter',
      productId: 'prod_SzCaVwBgyWO83S',
      name: 'Starter',
      price: 29,
      currency: 'usd',
      interval: 'Monthly', // ✅ fallback default
      trialDays: getTrialDaysForPlan('starter'),
      features: [
        '500 leads per month',
        '5 team members',
        'Basic integrations',
        'Email support',
      ],
      stripePriceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_STARTER!,
      leadLimit: 500,
      teamLimit: 5,
    },
    {
      id: 'professional',
      productId: 'prod_SzCbQy9cRmYeOa',
      name: 'Professional',
      price: 79,
      currency: 'usd',
      interval: 'Monthly', // ✅ fallback default
      trialDays: getTrialDaysForPlan('professional'),
      features: [
        '2,000 leads per month',
        '15 team members',
        'All integrations',
        'Priority support',
        'Advanced analytics',
      ],
      stripePriceId: process.env.NEXT_PUBLIC_STRIPE_PROFESSIONAL_PRICE_ID!,
      leadLimit: 2000,
      teamLimit: 15,
      popular: true,
    },
    {
      id: 'enterprise',
      productId: 'prod_SzCdwzV1WPShQg',
      name: 'Enterprise',
      price: 199,
      currency: 'usd',
      interval: 'Monthly', // ✅ fallback default
      trialDays: getTrialDaysForPlan('enterprise'),
      features: [
        'Unlimited leads',
        'Unlimited team members',
        'Custom integrations',
        'Dedicated support',
        'White-label options',
      ],
      stripePriceId: process.env.NEXT_PUBLIC_STRIPE_ENTERPRISE_PRICE_ID!,
      leadLimit: -1,
      teamLimit: -1,
    },
  ];
}

/**
 * Get a specific plan by ID
 */
export async function getSubscriptionPlan(planId: string): Promise<SubscriptionPlan | null> {
  const plans = await getSubscriptionPlans();
  return plans.find(plan => plan.id === planId) || null;
}

/**
 * Clear the plans cache (useful for testing or manual refresh)
 */
export function clearPlansCache(): void {
  plansCache = null;
  cacheExpiry = 0;
}

/**
 * API route to fetch plans (for frontend use)
 */
export async function GET() {
  try {
    const plans = await getSubscriptionPlans();
    
    return Response.json({
      success: true,
      plans,
      count: plans.length,
      cached: plansCache !== null,
      expires: new Date(cacheExpiry).toISOString(),
      trialConfig: {
        defaultTrialDays: TRIAL_CONFIG.defaultTrialDays,
        enableTrialOverride: TRIAL_CONFIG.enableTrialOverride
      }
    });
  } catch (error) {
    console.error('Error in subscription plans API:', error);
    return Response.json(
      { error: 'Failed to fetch subscription plans' },
      { status: 500 }
    );
  }
}
  
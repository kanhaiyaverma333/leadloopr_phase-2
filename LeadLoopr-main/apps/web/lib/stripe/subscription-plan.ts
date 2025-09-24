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
  interval: "monthly" | "quarterly" | "yearly"; // ✅ Normalized to lowercase
  trialDays: number;
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
    console.log('Returning cached plans');
    return plansCache;
  }

  try {
    console.log('Fetching fresh plans from Stripe...');
    
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

    console.log(`Found ${products.data.length} products and ${prices.data.length} prices`);

    // Map products to our plan structure
    const plans: SubscriptionPlan[] = products.data
      .map(product => {
        const productPrice = prices.data.find(price => price.product === product.id);
        if (!productPrice) {
          console.warn(`No price found for product: ${product.name} (${product.id})`);
          return null;
        }

        return mapStripeProductToPlan(product, productPrice);
      })
      .filter((plan): plan is SubscriptionPlan => plan !== null)
      .sort((a, b) => a.price - b.price); // Sort by price ascending

    console.log(`Mapped ${plans.length} valid plans:`, plans.map(p => ({ name: p.name, interval: p.interval, price: p.price })));

    // Update cache
    plansCache = plans;
    cacheExpiry = Date.now() + CACHE_DURATION;

    return plans;
  } catch (error) {
    console.error('Error fetching subscription plans from Stripe:', error);
    
    // Return fallback plans if Stripe fails
    console.log('Using fallback plans due to Stripe error');
    const fallbackPlans = getFallbackPlans();
    
    // Cache fallback plans for a shorter duration
    plansCache = fallbackPlans;
    cacheExpiry = Date.now() + (1 * 60 * 1000); // 1 minute cache for fallbacks
    
    return fallbackPlans;
  }
}

/**
 * Map Stripe product and price to our plan structure
 */
function mapStripeProductToPlan(
  product: Stripe.Product, 
  price: Stripe.Price
): SubscriptionPlan | null {
  if (!price.unit_amount) {
    console.warn(`Price has no unit_amount for product: ${product.name}`);
    return null;
  }

  // Extract custom metadata for features and limits
  const metadata = product.metadata || {};
  const planId = getReadablePlanId(product.name);
  
  // Normalize interval from Stripe price or metadata
  let interval: "monthly" | "quarterly" | "yearly" = "monthly";
  
  if (price.recurring?.interval) {
    // Map Stripe intervals to our normalized format
    switch (price.recurring.interval) {
      case 'month':
        interval = price.recurring.interval_count === 3 ? 'quarterly' : 'monthly';
        break;
      case 'year':
        interval = 'yearly';
        break;
      default:
        interval = 'monthly';
    }
  } else if (metadata.interval) {
    // Fallback to metadata if recurring interval not available
    interval = normalizeInterval(metadata.interval);
  }

  // Parse features - handle both arrays and strings
  let features: string[] = [];
  if (metadata.features) {
    features = parseFeatures(metadata.features);
  } else if (product.description) {
    features = parseFeatures(product.description);
  }

  const plan: SubscriptionPlan = {
    id: planId,
    productId: product.id,
    name: product.name,
    price: price.unit_amount / 100, // Convert cents to currency units
    currency: price.currency,
    interval,
    trialDays: getTrialDaysForPlan(planId),
    stripePriceId: price.id,
    features,
    leadLimit: parseInt(metadata.leadLimit || '0'),
    teamLimit: parseInt(metadata.teamLimit || '0'),
    popular: metadata.popular === 'true'
  };

  console.log(`Mapped plan: ${plan.name} - ${plan.interval} - ${plan.price} ${plan.currency}`);
  return plan;
}

/**
 * Normalize interval strings to our standard format
 */
function normalizeInterval(interval: string): "monthly" | "quarterly" | "yearly" {
  const normalized = interval.toLowerCase();
  switch (normalized) {
    case 'monthly':
    case 'month':
      return 'monthly';
    case 'quarterly':
    case 'quarter':
    case 'quartly': // Handle typo from your data
      return 'quarterly';
    case 'yearly':
    case 'year':
    case 'annual':
    case 'annually':
      return 'yearly';
    default:
      console.warn(`Unknown interval: ${interval}, defaulting to monthly`);
      return 'monthly';
  }
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
  
  // Handle very long feature strings by splitting them intelligently
  const features = featuresString
    .split(/[\n,|]/) // Split on newlines, commas, or pipes
    .map(feature => feature.trim())
    .filter(feature => feature.length > 0)
    .flatMap(feature => {
      // If feature is too long, try to split it further
      if (feature.length > 100) {
        // Split on capital letters that start new sentences
        return feature
          .split(/(?=[A-Z][a-z])/)
          .map(f => f.trim())
          .filter(f => f.length > 5 && f.length < 80); // Reasonable length features
      }
      return [feature];
    })
    .slice(0, 8); // Limit to 8 features max

  console.log(`Parsed ${features.length} features from: "${featuresString.substring(0, 100)}..."`);
  return features;
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
      price: 50,
      currency: 'inr',
      interval: 'monthly',
      trialDays: getTrialDaysForPlan('starter'),
      features: [
        'Basic lead management',
        'Up to 100 leads',
        '1 team member',
        'Email support',
        'Standard integrations'
      ],
      stripePriceId: 'price_1S3biVCyH2nEoMamXbDI6pi4',
      leadLimit: 100,
      teamLimit: 1,
    },
    {
      id: 'professional',
      productId: 'prod_SzbFGAa8UvpLmr',
      name: 'Professional',
      price: 240,
      currency: 'inr',
      interval: 'quarterly',
      trialDays: getTrialDaysForPlan('professional'),
      features: [
        'Unlimited pipelines & leads',
        'One-click ad platform syncing',
        '35-day free trial',
        'Priority support',
        'Team collaboration',
        'Advanced analytics'
      ],
      stripePriceId: 'price_1S3c3OCyH2nEoMamP470RYRs',
      leadLimit: -1,
      teamLimit: -1,
      popular: true,
    },
    {
      id: 'enterprise',
      productId: 'prod_SzCdwzV1WPShQg',
      name: 'Enterprise',
      price: 800,
      currency: 'inr',
      interval: 'yearly',
      trialDays: getTrialDaysForPlan('enterprise'),
      features: [
        'Everything in Professional',
        'Custom integrations',
        'Dedicated support',
        'White-label options',
        'Advanced security',
        'Custom reporting'
      ],
      stripePriceId: 'price_1S3blNCyH2nEoMam8qsx9k3w',
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
 * Get plans filtered by interval
 */
export async function getSubscriptionPlansByInterval(interval: "monthly" | "quarterly" | "yearly"): Promise<SubscriptionPlan[]> {
  const plans = await getSubscriptionPlans();
  return plans.filter(plan => plan.interval === interval);
}

/**
 * Clear the plans cache (useful for testing or manual refresh)
 */
export function clearPlansCache(): void {
  console.log('Clearing plans cache');
  plansCache = null;
  cacheExpiry = 0;
}

/**
 * Check if cache is valid
 */
export function isCacheValid(): boolean {
  return plansCache !== null && Date.now() < cacheExpiry;
}

/**
 * Get cache info for debugging
 */
export function getCacheInfo() {
  return {
    hasCachedPlans: plansCache !== null,
    cacheExpiry: new Date(cacheExpiry).toISOString(),
    planCount: plansCache?.length || 0,
    timeUntilExpiry: Math.max(0, cacheExpiry - Date.now()),
  };
}
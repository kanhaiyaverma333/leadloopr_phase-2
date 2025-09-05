// lib/stripe/trial-config.ts
export interface TrialConfig {
  defaultTrialDays: number;
  planSpecificTrials?: Record<string, number>;
  enableTrialOverride: boolean;
  maxTrialDays: number;
}

// Default trial configuration - easily changeable
export const TRIAL_CONFIG: TrialConfig = {
  defaultTrialDays: 30, // Default trial period
  planSpecificTrials: {
    // You can set specific trial periods for different plans
    'starter': 14,
    'professional': 30,
    'enterprise': 30,
  },
  enableTrialOverride: true, // Allow environment variable override
  maxTrialDays: 60, // Maximum allowed trial days
};

/**
 * Get trial days for a specific plan
 * Priority: Plan-specific > Environment variable > Default
 */
export function getTrialDaysForPlan(planId: string): number {
  // 1. Check if environment override is enabled and exists
  if (TRIAL_CONFIG.enableTrialOverride && process.env.DEFAULT_TRIAL_DAYS) {
    const envTrialDays = parseInt(process.env.DEFAULT_TRIAL_DAYS);
    if (!isNaN(envTrialDays) && envTrialDays <= TRIAL_CONFIG.maxTrialDays) {
      return envTrialDays;
    }
  }

  // 2. Check plan-specific trial configuration
  if (TRIAL_CONFIG.planSpecificTrials?.[planId]) {
    return TRIAL_CONFIG.planSpecificTrials[planId];
  }

  // 3. Fallback to default
  return TRIAL_CONFIG.defaultTrialDays;
}

/**
 * Get the overall trial days display (for marketing text)
 */
export function getDisplayTrialDays(): number {
  if (TRIAL_CONFIG.enableTrialOverride && process.env.DEFAULT_TRIAL_DAYS) {
    const envTrialDays = parseInt(process.env.DEFAULT_TRIAL_DAYS);
    if (!isNaN(envTrialDays)) return envTrialDays;
  }
  
  return TRIAL_CONFIG.defaultTrialDays;
}

/**
 * Check if trial is enabled for a plan
 */
export function isTrialEnabledForPlan(planId: string): boolean {
  return getTrialDaysForPlan(planId) > 0;
}

/**
 * Validate trial days input
 */
export function validateTrialDays(days: number): boolean {
  return days >= 0 && days <= TRIAL_CONFIG.maxTrialDays;
}

/**
 * Get trial configuration for admin/settings display
 */
export function getTrialConfigDisplay() {
  return {
    ...TRIAL_CONFIG,
    currentDefaultFromEnv: process.env.DEFAULT_TRIAL_DAYS ? 
      parseInt(process.env.DEFAULT_TRIAL_DAYS) : null,
  };
}
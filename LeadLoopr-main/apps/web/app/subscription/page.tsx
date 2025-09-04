"use client";
import React, { useState, useEffect } from 'react';
import { Loader2, Check, AlertCircle } from 'lucide-react';

interface SubscriptionPlan {
  id: string;
  productId: string;
  name: string;
  price: number;
  currency: string;
  interval: string;
  trialDays?: number;
  features: string[];
  stripePriceId: string;
  leadLimit: number;
  teamLimit: number;
  popular?: boolean;
}

export default function SubscriptionPage() {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [subscribing, setSubscribing] = useState(false);

  // Fetch plans from API
  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/billing/subscription-plan');
      const data = await response.json();
      
      if (data.success) {
        setPlans(data.plans);
      } else {
        throw new Error(data.error || 'Failed to fetch plans');
      }
    } catch (err) {
      console.error('Error fetching plans:', err);
      setError(err instanceof Error ? err.message : 'Failed to load plans');
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async (planId: string) => {
    try {
      setSubscribing(true);
      setSelectedPlan(planId);

      const response = await fetch('/api/billing/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ planId }),
      });

      const data = await response.json();

      if (response.ok && data.url) {
        window.location.href = data.url;
      } else {
        throw new Error(data.error || 'Failed to create checkout session');
      }
    } catch (err) {
      console.error('Error creating checkout session:', err);
      setError(err instanceof Error ? err.message : 'Failed to start subscription');
      setSubscribing(false);
      setSelectedPlan(null);
    }
  };

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(price);
  };

  const formatLimit = (limit: number, type: 'leads' | 'team') => {
    if (limit === -1) return 'Unlimited';
    return `${limit.toLocaleString()} ${type === 'leads' ? 'leads' : 'members'}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading subscription plans...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center max-w-md">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Failed to Load Plans</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={fetchPlans}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Choose Your Plan
          </h1>
          <p className="text-xl text-gray-600">
            Start your free trial today. No credit card required.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`relative bg-white rounded-2xl shadow-lg border-2 transition-all duration-200 hover:shadow-xl ${
                plan.popular
                  ? 'border-blue-500 ring-2 ring-blue-200'
                  : 'border-gray-200'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="bg-blue-500 text-white px-4 py-1 rounded-full text-sm font-medium">
                    Most Popular
                  </span>
                </div>
              )}

              <div className="p-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  {plan.name}
                </h3>
                
                <div className="mb-6">
                  <span className="text-4xl font-bold text-gray-900">
                    {formatPrice(plan.price, plan.currency)}
                  </span>
                  <span className="text-gray-600">/{plan.interval}</span>
                  {plan.trialDays && (
                    <div className="text-sm text-green-600 font-medium mt-1">
                      {plan.trialDays} day free trial
                    </div>
                  )}
                </div>

                <div className="mb-6 space-y-2">
                  <div className="text-sm text-gray-600">
                    <span className="font-medium">Leads:</span> {formatLimit(plan.leadLimit, 'leads')} per month
                  </div>
                  <div className="text-sm text-gray-600">
                    <span className="font-medium">Team:</span> {formatLimit(plan.teamLimit, 'team')}
                  </div>
                </div>

                <ul className="mb-8 space-y-3">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-center">
                      <Check className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => handleSubscribe(plan.id)}
                  disabled={subscribing && selectedPlan === plan.id}
                  className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
                    plan.popular
                      ? 'bg-blue-600 text-white hover:bg-blue-700 disabled:bg-blue-400'
                      : 'bg-gray-900 text-white hover:bg-gray-800 disabled:bg-gray-400'
                  } disabled:cursor-not-allowed flex items-center justify-center`}
                >
                  {subscribing && selectedPlan === plan.id ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Starting Trial...
                    </>
                  ) : (
                    `Start ${plan.trialDays}-Day Free Trial`
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mt-12">
          <p className="text-gray-600">
            All plans include a {plans[0]?.trialDays || 30}-day free trial. Cancel anytime.
          </p>
        </div>
      </div>
    </div>
  );
}
"use client";
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Loader2, Check, AlertCircle, Crown } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/marketing/components/ui/radio-group";
import { Label } from "@/components/ui/label";

interface SubscriptionPlan {
  id: string;
  productId: string;
  name: string;
  price: number;
  currency: string;
  interval: "monthly" | "quarterly" | "yearly";
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
  const [billingPeriod, setBillingPeriod] = useState<
    "monthly" | "quarterly" | "yearly"
  >("monthly");

  // Fetch plans from API
  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/billing/subscription-plan");
      const data = await response.json();

      if (data.success) {
        console.log("Fetched Plans:", data);
        setPlans(data.plans);
      } else {
        throw new Error(data.error || "Failed to fetch plans");
      }
    } catch (err) {
      console.error("Error fetching plans:", err);
      setError(err instanceof Error ? err.message : "Failed to load plans");
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async (planId: string) => {
    try {
      setSubscribing(true);
      setSelectedPlan(planId);

      const response = await fetch("/api/billing/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId }),
      });

      const data = await response.json();

      if (response.ok && data.url) {
        window.location.href = data.url;
      } else {
        throw new Error(data.error || "Failed to create checkout session");
      }
    } catch (err) {
      console.error("Error creating checkout session:", err);
      setError(err instanceof Error ? err.message : "Failed to start subscription");
      setSubscribing(false);
      setSelectedPlan(null);
    }
  };

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency.toUpperCase(),
    }).format(price);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Failed to Load Plans</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={fetchPlans}
            className="px-4 py-2 bg-gradient-primary text-white rounded-lg shadow-md hover:opacity-90"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Filter plans by billing period
  const filteredPlans = plans.filter((p) => p.interval.toLowerCase() === billingPeriod);
  console.log("Filtered Plans:", filteredPlans, billingPeriod);
  return (
    <section id="pricing" className="py-24 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{ rotate: 360, scale: [1, 1.3, 1] }}
          transition={{
            rotate: { duration: 40, repeat: Infinity, ease: "linear" },
            scale: { duration: 8, repeat: Infinity, ease: "easeInOut" },
          }}
          className="absolute top-1/3 right-1/4 w-96 h-96 bg-gradient-primary opacity-10 rounded-full blur-3xl"
        />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-10"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-card mb-6"
          >
            <Crown className="w-4 h-4 text-black dark:text-white" />
            <span className="text-sm font-medium">Simple Pricing</span>
          </motion.div>

          <h2 className="text-4xl lg:text-5xl font-bold mb-6">
            One simple plan, built to{" "}
            <span className="bg-gradient-primary bg-clip-text text-transparent">
              scale with you
            </span>
          </h2>

          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Try it free for {filteredPlans[0]?.trialDays || 30} days
          </p>
        </motion.div>

        {/* Toggle */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          viewport={{ once: true }}
          className="flex justify-center mb-16"
        >
          <div className="glass-card p-2 rounded-2xl">
            <RadioGroup
              value={billingPeriod}
              onValueChange={(value) =>
                setBillingPeriod(value as "monthly" | "quarterly" | "yearly")
              }
              className="flex gap-1"
            >
              {["monthly", "quarterly", "yearly"].map((period) => (
                <div
                  key={period}
                  className="has-[button[data-state='checked']]:bg-background rounded-xl transition-all duration-300"
                >
                  <RadioGroupItem
                    value={period}
                    id={period}
                    className="peer sr-only"
                  />
                  <Label
                    htmlFor={period}
                    className={`cursor-pointer px-6 py-3 rounded-xl text-sm font-medium transition-all duration-300 flex items-center gap-2 ${
                      billingPeriod === period
                        ? "text-primary bg-background shadow-md"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {period.charAt(0).toUpperCase() + period.slice(1)}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>
        </motion.div>

        {/* Pricing Cards */}
        <div className="flex flex-wrap justify-center gap-8 max-w-6xl mx-auto">
  {filteredPlans.map((plan) => (
    <motion.div
      key={plan.id}
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      whileHover={{ y: -5, transition: { duration: 0.2 } }}
      viewport={{ once: true }}
      className="relative group max-w-md w-full mx-auto"
    >
              {/* Popular Badge */}
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
                  <div className="bg-gradient-primary text-white px-4 py-2 rounded-full text-sm font-medium shadow-md glow">
                    Most Popular
                  </div>
                </div>
              )}

              <div className="glass-card p-8 rounded-3xl h-full transition-all duration-300 glow border-primary/20">
                {/* Icon */}
                <div className="relative mb-6 flex justify-center">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-primary p-0.5">
                    <div className="w-full h-full bg-card rounded-2xl flex items-center justify-center">
                      <Crown className="w-8 h-8 text-black dark:text-white" />
                    </div>
                  </div>
                  <div className="absolute inset-0 w-16 h-16 bg-gradient-primary rounded-2xl opacity-20 blur-xl group-hover:opacity-40 transition-opacity duration-300" />
                </div>

                {/* Plan Info */}
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                  <p className="text-muted-foreground">
                    {plan.leadLimit === -1
                      ? "Unlimited Leads"
                      : `${plan.leadLimit} Leads`}{" "}
                    ·{" "}
                    {plan.teamLimit === -1
                      ? "Unlimited Team"
                      : `${plan.teamLimit} Members`}
                  </p>
                </div>

                {/* Price */}
                <div className="text-center mb-8">
                  <div className="flex items-baseline justify-center gap-1 mb-2">
                    <span className="text-4xl font-bold">
                      {formatPrice(plan.price, plan.currency)}
                    </span>
                    <span className="text-muted-foreground">/{plan.interval}</span>
                  </div>
                  {plan.trialDays && (
                    <div className="text-sm text-green-600">
                      {plan.trialDays}-day free trial
                    </div>
                  )}
                </div>

                {/* Features */}
                <ul className="space-y-4 mb-8">
                  {plan.features.map((feature, i) => (
                    <motion.li
                      key={feature}
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.4, delay: i * 0.05 }}
                      viewport={{ once: true }}
                      className="flex items-center gap-3"
                    >
                      <div className="w-5 h-5 rounded-full bg-gradient-primary flex items-center justify-center flex-shrink-0">
                        <Check className="w-3 h-3 text-white" />
                      </div>
                      <span className="text-sm">{feature}</span>
                    </motion.li>
                  ))}
                </ul>

                {/* CTA */}
                <button
                  onClick={() => handleSubscribe(plan.id)}
                  disabled={subscribing && selectedPlan === plan.id}
                  className="w-full bg-gradient-primary hover:opacity-90 glow text-white py-3 px-4 rounded-xl font-medium transition-opacity disabled:opacity-50 flex items-center justify-center"
                >
                  {subscribing && selectedPlan === plan.id ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Starting Trial...
                    </>
                  ) : (
                    `Start ${plan.trialDays || 30}-Day Free Trial`
                  )}
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

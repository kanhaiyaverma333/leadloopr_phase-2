import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Crown } from 'lucide-react';
import { Button } from '@/components/marketing/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/marketing/components/ui/radio-group';
import { Label } from '@/components/marketing/components/ui/label';

const Pricing = () => {
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'quarterly' | 'yearly'>('monthly');

  const pricing = {
    monthly: { price: 29, period: '/month', total: 29 },
    quarterly: { price: 25, period: '/month', total: 75, savings: '14%' },
    yearly: { price: 24, period: '/month', total: 288, savings: '17%' },
  };

  const features = [
    'Unlimited pipelines & leads',
    'One-click ad platform syncing',
    '35-day free trial',
    'Priority support',
    'Team collaboration',
    'Advanced analytics',
  ];

  return (
    <section id="pricing" className="py-24 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{
            rotate: 360,
            scale: [1, 1.3, 1],
          }}
          transition={{
            rotate: { duration: 40, repeat: Infinity, ease: "linear" },
            scale: { duration: 8, repeat: Infinity, ease: "easeInOut" }
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
          className="text-center mb-16"
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
            One simple plan, built to{' '}
            <span className="bg-gradient-primary bg-clip-text text-transparent">
              scale with you
            </span>
          </h2>

          <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
            Try it free for 35 days
          </p>

          {/* Billing Toggle */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
            className="flex justify-center"
          >
            <div className="glass-card p-2 rounded-2xl">
              <RadioGroup
                value={billingPeriod}
                onValueChange={(value) => setBillingPeriod(value as 'monthly' | 'quarterly' | 'yearly')}
                className="flex gap-1"
              >
                <div className={`has-[button[data-state="checked"]]:bg-background rounded-xl transition-all duration-300`}>
                  <RadioGroupItem
                    value="monthly"
                    id="monthly"
                    className="peer sr-only"
                  />
                  <Label
                    htmlFor="monthly"
                    className={`cursor-pointer px-6 py-3 rounded-xl text-sm font-medium transition-all duration-300 flex items-center ${billingPeriod === 'monthly' ? 'text-primary bg-background shadow-md' : 'text-muted-foreground hover:text-foreground'
                      }`}
                  >
                    Monthly
                  </Label>
                </div>
                <div className={`has-[button[data-state="checked"]]:bg-background rounded-xl transition-all duration-300`}>
                  <RadioGroupItem
                    value="quarterly"
                    id="quarterly"
                    className="peer sr-only"
                  />
                  <Label
                    htmlFor="quarterly"
                    className={`cursor-pointer px-6 py-3 rounded-xl text-sm font-medium transition-all duration-300 flex items-center gap-2 ${billingPeriod === 'quarterly' ? 'text-primary bg-background shadow-md' : 'text-muted-foreground hover:text-foreground'
                      }`}
                  >
                    Quarterly
                    {billingPeriod === 'quarterly' && (
                      <span className="text-xs bg-gradient-primary text-primary-foreground px-2 py-1 rounded-full">
                        Save {pricing.quarterly.savings}
                      </span>
                    )}
                  </Label>
                </div>
                <div className={`has-[button[data-state="checked"]]:bg-background rounded-xl transition-all duration-300`}>
                  <RadioGroupItem
                    value="yearly"
                    id="yearly"
                    className="peer sr-only"
                  />
                  <Label
                    htmlFor="yearly"
                    className={`cursor-pointer px-6 py-3 rounded-xl text-sm font-medium transition-all duration-300 flex items-center gap-2 ${billingPeriod === 'yearly' ? 'text-primary bg-background shadow-md' : 'text-muted-foreground hover:text-foreground'
                      }`}
                  >
                    Yearly
                    {billingPeriod === 'yearly' && (
                      <span className="text-xs bg-gradient-primary text-primary-foreground px-2 py-1 rounded-full">
                        Save {pricing.yearly.savings}
                      </span>
                    )}
                  </Label>
                </div>
              </RadioGroup>
            </div>
          </motion.div>
        </motion.div>

        {/* Pricing Card */}
        <div className="flex justify-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            whileHover={{
              y: -5,
              transition: { duration: 0.2 }
            }}
            viewport={{ once: true }}
            className="relative group max-w-md w-full"
          >
            {/* Popular Badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              viewport={{ once: true }}
              className="absolute -top-4 left-1/2 -translate-x-1/2 z-10"
            >
              <div className="bg-gradient-primary text-primary-foreground px-4 py-2 rounded-full text-sm font-medium glow">
                Most Popular
              </div>
            </motion.div>

            <div className="glass-card p-8 rounded-3xl h-full transition-all duration-300 glow border-primary/20">
              {/* Icon */}
              <div className="relative mb-6 flex justify-center">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 p-0.5">
                  <div className="w-full h-full bg-card rounded-2xl flex items-center justify-center">
                    <Crown className="w-8 h-8 text-black dark:text-white" />
                  </div>
                </div>
                <div className="absolute inset-0 w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl opacity-20 blur-xl group-hover:opacity-40 transition-opacity duration-300" />
              </div>

              {/* Plan Info */}
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold mb-2">Pro Plan</h3>
                <p className="text-muted-foreground">Full access, full power, no limitations.</p>
              </div>

              {/* Price */}
              <div className="text-center mb-8">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={billingPeriod}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="flex items-baseline justify-center gap-1 mb-2">
                      <span className="text-4xl font-bold">
                        ${pricing[billingPeriod].price}
                      </span>
                      <span className="text-muted-foreground">
                        {pricing[billingPeriod].period}
                      </span>
                    </div>
                    {billingPeriod !== 'monthly' && (
                      <div className="text-sm text-muted-foreground">
                        ${pricing[billingPeriod].total} billed {billingPeriod}
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Features */}
              <ul className="space-y-4 mb-8">
                {features.map((feature, featureIndex) => (
                  <motion.li
                    key={feature}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, delay: featureIndex * 0.05 }}
                    viewport={{ once: true }}
                    className="flex items-center gap-3"
                  >
                    <div className="w-5 h-5 rounded-full bg-gradient-primary flex items-center justify-center flex-shrink-0">
                      <Check className="w-3 h-3 text-primary-foreground" />
                    </div>
                    <span className="text-sm">{feature}</span>
                  </motion.li>
                ))}
              </ul>

              {/* CTA */}
              <Button
                className="w-full bg-gradient-primary hover:opacity-90 glow"
                size="lg"
              >
                Start Free Trial
              </Button>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default Pricing;
// components/account/BillingCard.tsx
"use client"
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CreditCard, Crown, AlertCircle, Clock, CheckCircle } from "lucide-react";

interface BillingData {
  subscription: {
    status: string;
    isActive: boolean;
    periodEnd: string | null;
    nextBillingDate: string | null;
    lastBillingDate: string | null;
  };
  plan: {
    name: string;
    price: number;
    currency: string;
    interval: string;
    leadLimit: number;
    teamLimit: number;
  } | null;
  paymentMethod: {
    brand: string;
    last4: string;
    expMonth: number;
    expYear: number;
  } | null;
  trialInfo: {
    daysLeft: number;
    endsAt: string;
    isActive: boolean;
  } | null;
  usage: {
    currentLeads: number;
    leadLimit: number;
    teamMembers: number;
    teamLimit: number;
  };
}

export function BillingCard() {
  const [billingData, setBillingData] = useState<BillingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBillingData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/billing/details');
      if (!response.ok) {
        throw new Error('Failed to fetch billing data');
      }
      const data = await response.json();
      setBillingData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch billing data');
      console.error('Error fetching billing data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBillingData();
  }, []);

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(price);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Not available';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getStatusBadge = () => {
    if (!billingData) return null;
    
    const { subscription, trialInfo } = billingData;
    
    if (trialInfo?.isActive) {
      return (
        <Badge className="bg-blue-100 text-blue-800 border-blue-200">
          <Clock className="h-3 w-3 mr-1" />
          Trial ({trialInfo.daysLeft} days left)
        </Badge>
      );
    }

    switch (subscription.status) {
      case 'ACTIVE':
        return (
          <Badge className="bg-gradient-primary text-primary-foreground">
            <CheckCircle className="h-3 w-3 mr-1" />
            Active
          </Badge>
        );
      case 'PAST_DUE':
        return (
          <Badge variant="destructive">
            <AlertCircle className="h-3 w-3 mr-1" />
            Past Due
          </Badge>
        );
      case 'CANCELED':
        return (
          <Badge variant="secondary">
            Canceled
          </Badge>
        );
      case 'TRIAL':
        return (
          <Badge className="bg-blue-100 text-blue-800 border-blue-200">
            <Clock className="h-3 w-3 mr-1" />
            Trial
          </Badge>
        );
      default:
        return (
          <Badge variant="outline">
            {subscription.status}
          </Badge>
        );
    }
  };

  const getBillingText = () => {
    if (!billingData) return 'Loading...';
    
    const { subscription, trialInfo } = billingData;
    
    if (trialInfo?.isActive) {
      return `Trial ends ${formatDate(trialInfo.endsAt)}`;
    }
    
    if (subscription.nextBillingDate) {
      return `Next billing: ${formatDate(subscription.nextBillingDate)}`;
    }
    
    return 'Billing date not available';
  };

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <Card className="glass-card h-fit">
          <CardHeader>
            <div>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Billing & Subscription
              </CardTitle>
              <CardDescription>
                Manage your billing and subscription details
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="animate-pulse">
              {/* Current Plan Skeleton */}
              <div className="p-4 rounded-lg border border-primary/20 bg-gradient-primary/5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Crown className="h-5 w-5 text-primary" />
                    <div className="h-4 bg-muted rounded w-24"></div>
                  </div>
                  <div className="h-6 bg-muted rounded w-20"></div>
                </div>
                <div className="h-8 bg-muted rounded w-32 mb-2"></div>
                <div className="h-4 bg-muted rounded w-48 mb-1"></div>
                <div className="h-4 bg-muted rounded w-40"></div>
              </div>

              {/* Actions Skeleton */}
              <div className="space-y-2 mt-6">
                <div className="h-10 bg-muted rounded w-full"></div>
                <div className="h-10 bg-muted rounded w-full"></div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <Card className="glass-card h-fit">
          <CardHeader>
            <div>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Billing & Subscription
              </CardTitle>
              <CardDescription>
                Manage your billing and subscription details
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <p className="text-destructive mb-4">Failed to load billing data</p>
              <Button
                variant="outline"
                onClick={fetchBillingData}
              >
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  if (!billingData) {
    return null;
  }

  const { subscription, plan, paymentMethod, trialInfo, usage } = billingData;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
    >
      <Card className="glass-card h-fit">
        <CardHeader>
          <div>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Billing & Subscription
            </CardTitle>
            <CardDescription>
              Manage your billing and subscription details
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Current Plan */}
          <div className="p-4 rounded-lg border border-primary/20 bg-gradient-primary/5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Crown className="h-5 w-5 text-primary" />
                <h3 className="font-semibold">
                  {plan?.name || 'No Plan'}
                </h3>
              </div>
              {getStatusBadge()}
            </div>
            
            {plan ? (
              <>
                <p className="text-2xl font-bold mb-1">
                  {trialInfo?.isActive 
                    ? 'Free Trial' 
                    : `${formatPrice(plan.price, plan.currency)}/${plan.interval.toLowerCase()}`
                  }
                </p>
                <p className="text-sm text-muted-foreground">
                  {plan.leadLimit === -1 ? 'Unlimited' : plan.leadLimit} leads • {plan.teamLimit === -1 ? 'Unlimited' : plan.teamLimit} team members
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {getBillingText()}
                </p>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                No active subscription plan
              </p>
            )}
          </div>

          {/* Usage Stats */}
          {/* {subscription.isActive && (
            <div className="space-y-3">
              <h4 className="font-medium">Current Usage</h4>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Leads this period</span>
                  <span className="text-sm font-medium">
                    {usage.currentLeads} / {usage.leadLimit === -1 ? '∞' : usage.leadLimit}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Team members</span>
                  <span className="text-sm font-medium">
                    {usage.teamMembers} / {usage.teamLimit === -1 ? '∞' : usage.teamLimit}
                  </span>
                </div>
              </div>
            </div>
          )} */}

          {/* Payment Method */}
          {paymentMethod && subscription.isActive && (
            <div>
              <h4 className="font-medium mb-3">Payment Method</h4>
              <div className="flex items-center justify-between p-3 rounded-lg border border-border/50 glass">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-12 bg-gradient-primary rounded flex items-center justify-center">
                    <span className="text-xs font-bold text-primary-foreground">
                      {paymentMethod.brand}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium">•••• •••• •••• {paymentMethod.last4}</p>
                    <p className="text-sm text-muted-foreground">
                      Expires {paymentMethod.expMonth.toString().padStart(2, '0')}/{paymentMethod.expYear.toString().slice(-2)}
                    </p>
                  </div>
                </div>
                <Button variant="outline" size="sm" className="glass">
                  Update
                </Button>
              </div>
            </div>
          )}

          {/* Billing Actions */}
          <div className="space-y-2">
            <Button variant="outline" className="w-full glass justify-start">
              View Billing History
            </Button>
            {subscription.isActive ? (
              <Button variant="outline" className="w-full glass justify-start">
                Change Plan
              </Button>
            ) : (
              <Button className="w-full bg-gradient-primary text-white">
                Subscribe Now
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
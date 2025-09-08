// components/account/BillingCard.tsx
"use client"
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "../marketing/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { CreditCard, Crown, AlertCircle, Clock, CheckCircle, FileText, Download, ExternalLink, Calendar } from "lucide-react";

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

interface BillingHistoryItem {
  id: string;
  invoiceNumber: string | null;
  amount: number;
  currency: string;
  status: string;
  paidAt: string | null;
  createdAt: string;
  periodStart: string | null;
  periodEnd: string | null;
  description: string;
  downloadUrl: string | null;
  hostedUrl: string | null;
  paymentStatus: string;
  dueDate: string | null;
}

interface BillingHistory {
  invoices: BillingHistoryItem[];
  hasMore: boolean;
  total: number;
}

export function BillingCard() {
  const [billingData, setBillingData] = useState<BillingData | null>(null);
  const [billingHistory, setBillingHistory] = useState<BillingHistory | null>(null);
  const [loading, setLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);

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

  const fetchBillingHistory = async () => {
    try {
      setHistoryLoading(true);
      const response = await fetch('/api/billing/history');
      if (!response.ok) {
        throw new Error('Failed to fetch billing history');
      }
      const data = await response.json();
      setBillingHistory(data);
    } catch (err) {
      console.error('Error fetching billing history:', err);
      // Set empty history on error
      setBillingHistory({ invoices: [], hasMore: false, total: 0 });
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleViewHistory = async () => {
    setShowHistory(true);
    if (!billingHistory) {
      await fetchBillingHistory();
    }
  };

  useEffect(() => {
    fetchBillingData();
  }, []);

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(price / 100); // Stripe amounts are in cents
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

  const getPaymentStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'paid':
        return <Badge className="bg-green-100 text-green-800 border-green-200">Paid</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Pending</Badge>;
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
      case 'canceled':
        return <Badge variant="secondary">Canceled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
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
                    : `${formatPrice(plan.price * 100, plan.currency)}/${plan.interval.toLowerCase()}`
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
            <Button 
              variant="outline" 
              className="w-full glass justify-start"
              onClick={handleViewHistory}
            >
              <FileText className="h-4 w-4 mr-2" />
              View Billing History
            </Button>
            
            {/* Billing History Modal */}
            {showHistory && (
              <div 
                className="fixed inset-0 z-50 flex items-center justify-center"
                style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
                onClick={() => setShowHistory(false)}
              >
                <div 
                  className="bg-white dark:bg-gray-800 rounded-lg max-w-4xl max-h-[80vh] w-full mx-4 flex flex-col"
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Header */}
                  <div className="flex items-center justify-between p-6 border-b">
                    <h2 className="text-xl font-semibold flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Billing History
                    </h2>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowHistory(false)}
                      className="h-8 w-8 p-0"
                    >
                      ✕
                    </Button>
                  </div>

                  {/* Content */}
                  <div className="flex-1 overflow-y-auto p-6">
                    {historyLoading ? (
                      <div className="flex items-center justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                      </div>
                    ) : billingHistory?.invoices.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>No billing history available</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {billingHistory?.invoices.map((invoice, index) => (
                          <div key={invoice.id} className="border rounded-lg p-4 space-y-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div>
                                  <p className="font-medium">
                                    {invoice.invoiceNumber || `Invoice ${invoice.id.slice(-8)}`}
                                  </p>
                                  <p className="text-sm text-muted-foreground">
                                    {invoice.description}
                                  </p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="font-semibold">
                                  {formatPrice(invoice.amount, invoice.currency)}
                                </p>
                                {getPaymentStatusBadge(invoice.paymentStatus)}
                              </div>
                            </div>
                            
                            <div className="flex items-center justify-between text-sm text-muted-foreground">
                              <div className="flex items-center gap-4">
                                <div className="flex items-center gap-1">
                                  <Calendar className="h-4 w-4" />
                                  <span>{formatDate(invoice.createdAt)}</span>
                                </div>
                                {invoice.paidAt && (
                                  <span>Paid {formatDate(invoice.paidAt)}</span>
                                )}
                              </div>
                              
                              <div className="flex items-center gap-2">
                                {invoice.downloadUrl && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => window.open(invoice.downloadUrl!, '_blank')}
                                  >
                                    <Download className="h-4 w-4" />
                                  </Button>
                                )}
                                {invoice.hostedUrl && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => window.open(invoice.hostedUrl!, '_blank')}
                                  >
                                    <ExternalLink className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                            </div>

                            {invoice.periodStart && invoice.periodEnd && (
                              <>
                                <div className="border-t pt-2 mt-2">
                                  <p className="text-xs text-muted-foreground">
                                    Service Period: {formatDate(invoice.periodStart)} - {formatDate(invoice.periodEnd)}
                                  </p>
                                </div>
                              </>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
            
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
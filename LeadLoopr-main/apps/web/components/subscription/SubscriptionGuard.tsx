// components/subscription/SubscriptionGuard.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { Button } from '@/components/ui/button';
import { AlertTriangle, CreditCard } from 'lucide-react';

interface SubscriptionStatus {
  hasActiveSubscription: boolean;
  subscriptionStatus: string;
  trialExpired: boolean;
  daysLeftInTrial?: number;
}

interface SubscriptionGuardProps {
  children: React.ReactNode;
}

export function SubscriptionGuard({ children }: SubscriptionGuardProps) {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkSubscription() {
      if (!isLoaded || !user) return;

      try {
        const response = await fetch('/api/billing/subscription-status');
        const data = await response.json();
        
        if (response.ok) {
          setSubscriptionStatus(data);
          
          // If no active subscription and trial expired, redirect to subscription page
          if (!data.hasActiveSubscription && data.trialExpired) {
            router.push('/subscription');
            return;
          }
        }
      } catch (error) {
        console.error('Error checking subscription:', error);
        // On error, redirect to subscription page as safety measure
        router.push('                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               /subscription');
      } finally {
        setLoading(false);
      }
    }

    checkSubscription();
  }, [user, isLoaded, router]);

  // Show loading state
  if (loading || !isLoaded) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Checking subscription...</p>
        </div>
      </div>
    );
  }

  // Show trial warning if user is in trial with few days left
  if (
    subscriptionStatus?.hasActiveSubscription && 
    subscriptionStatus?.subscriptionStatus === 'TRIAL' && 
    subscriptionStatus?.daysLeftInTrial !== undefined && 
    subscriptionStatus.daysLeftInTrial <= 3
  ) {
    return (
      <div className="min-h-screen bg-background">
        <div className="bg-yellow-50 border-b border-yellow-200 p-4">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <AlertTriangle className="w-5 h-5 text-yellow-600" />
              <span className="text-yellow-800 font-medium">
                Your trial expires in {subscriptionStatus.daysLeftInTrial} day{subscriptionStatus.daysLeftInTrial !== 1 ? 's' : ''}
              </span>
            </div>
            <Button
              onClick={() => router.push('/subscription')}
              size="sm"
              className="bg-yellow-600 hover:bg-yellow-700 text-white"
            >
              <CreditCard className="w-4 h-4 mr-2" />
              Upgrade Now
            </Button>
          </div>
        </div>
        {children}
      </div>
    );
  }

  // If we reach here, user has active subscription or valid trial
  return <>{children}</>;
}
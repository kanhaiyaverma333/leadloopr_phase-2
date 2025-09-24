'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useOrganization } from '@clerk/nextjs'
import { Loader2, AlertCircle, Building2 } from 'lucide-react'
import SubscriptionPage from '@/app/subscription/page'

interface SubscriptionStatus {
  hasActiveSubscription: boolean;
  subscriptionStatus: 'ACTIVE' | 'TRIAL' | 'PAST_DUE' | 'EXPIRED' | 'CANCELED';
  trialExpired: boolean;
  daysLeftInTrial?: number;
  organizationId: string;
  organizationName: string;
}

interface SubscriptionGuardProps {
  children: React.ReactNode
}

export function SubscriptionGuard({ children }: SubscriptionGuardProps) {
  const { organization } = useOrganization()
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    // Only check subscription when organization is loaded
    if (organization) {
      checkSubscriptionStatus()
    }
  }, [organization?.id]) // Re-check when organization changes

  const checkSubscriptionStatus = async () => {
    if (!organization) return

    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('/api/billing/subscription-status', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        cache: 'no-store'
      })

      if (!response.ok) {
        if (response.status === 401) {
          router.push('/sign-in')
          return
        }
        throw new Error(`Failed to fetch subscription status: ${response.status}`)
      }

      const data = await response.json()
      setSubscriptionStatus({
        ...data,
        organizationId: organization.id,
        organizationName: organization.name
      })
    } catch (err) {
      console.error('Error checking subscription status:', err)
      setError(err instanceof Error ? err.message : 'Failed to check subscription status')
    } finally {
      setLoading(false)
    }
  }

  // Show loading while organization is loading or subscription is being checked
  if (!organization || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-background to-background/50">
        <div className="text-center">
          <div className="relative mb-4">
            <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
            <div className="absolute inset-0 h-12 w-12 bg-primary/20 rounded-full blur-xl animate-pulse" />
          </div>
          <h2 className="text-lg font-medium mb-2">Loading Dashboard...</h2>
          <p className="text-sm text-muted-foreground">
            {!organization ? 'Setting up organization...' : 'Checking subscription status...'}
          </p>
        </div>
      </div>
    )
  }

  // Show error state with retry option
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-background to-background/50">
        <div className="text-center max-w-md px-4">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Unable to Load Dashboard</h2>
          <div className="mb-4 p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
              <Building2 className="h-4 w-4" />
              <span>Organization: {organization.name}</span>
            </div>
            <p className="text-sm text-red-600">{error}</p>
          </div>
          <div className="flex gap-3 justify-center">
            <button
              onClick={checkSubscriptionStatus}
              className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg shadow-md hover:opacity-90 transition-opacity"
            >
              Try Again
            </button>
            <button
              onClick={() => router.push('/sign-in')}
              className="px-6 py-2 border border-input bg-background hover:bg-accent hover:text-accent-foreground rounded-lg transition-colors"
            >
              Sign In Again
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Check if organization has active subscription or valid trial
  if (subscriptionStatus && !subscriptionStatus.hasActiveSubscription) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-background/50">
        <div className="container mx-auto px-4 py-8">
          {/* Organization context header */}
          <div className="mb-8 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-muted/50 rounded-full text-sm text-muted-foreground mb-4">
              <Building2 className="h-4 w-4" />
              <span>{subscriptionStatus.organizationName}</span>
            </div>
            <h1 className="text-2xl font-bold mb-2">Subscription Required</h1>
            <p className="text-muted-foreground">
              This organization needs an active subscription to access the dashboard.
              {subscriptionStatus.subscriptionStatus === 'TRIAL' && subscriptionStatus.trialExpired && (
                <span className="block mt-1 text-amber-600">
                  Your trial period has expired.
                </span>
              )}
            </p>
          </div>
          
          <SubscriptionPage />
        </div>
      </div>
    )
  }

  // Organization has active subscription - show dashboard
  return <>{children}</>
}
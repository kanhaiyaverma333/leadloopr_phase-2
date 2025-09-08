'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, AlertCircle } from 'lucide-react'
import SubscriptionPage from '@/app/subscription/page' // Adjust path as needed

interface SubscriptionStatus {
  hasActiveSubscription: boolean;
  subscriptionStatus: 'ACTIVE' | 'TRIAL' | 'PAST_DUE' | 'EXPIRED';
  trialExpired: boolean;
  daysLeftInTrial?: number;
}

interface SubscriptionGuardProps {
  children: React.ReactNode
}

export function SubscriptionGuard({ children }: SubscriptionGuardProps) {
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    checkSubscriptionStatus()
  }, [])

  const checkSubscriptionStatus = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('/api/billing/subscription-status', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        cache: 'no-store' // Ensure fresh data
      })

      if (!response.ok) {
        if (response.status === 401) {
          // User is not authenticated, redirect to login
          router.push('/sign-in')
          return
        }
        throw new Error(`Failed to fetch subscription status: ${response.status}`)
      }

      const data = await response.json()
      setSubscriptionStatus(data)
    } catch (err) {
      console.error('Error checking subscription status:', err)
      setError(err instanceof Error ? err.message : 'Failed to check subscription status')
    } finally {
      setLoading(false)
    }
  }

  // Show loading state while checking subscription
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-background to-background/50">
        <div className="text-center">
          <div className="relative mb-4">
            <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
            <div className="absolute inset-0 h-12 w-12 bg-primary/20 rounded-full blur-xl animate-pulse" />
          </div>
          <h2 className="text-lg font-medium mb-2">Loading Dashboard...</h2>
          <p className="text-sm text-muted-foreground">Checking your subscription status</p>
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
          <p className="text-muted-foreground mb-6">{error}</p>
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

  // Check if user has active subscription or trial
  if (subscriptionStatus && !subscriptionStatus.hasActiveSubscription) {
    // User needs to subscribe - show subscription page inline
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-background/50">
        <SubscriptionPage />
      </div>
    )
  }

  // User has active subscription - show dashboard
  return <>{children}</>
}
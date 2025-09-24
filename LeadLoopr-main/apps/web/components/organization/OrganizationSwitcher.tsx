'use client'

import { useState, useEffect } from 'react'
import { useOrganizationList, useOrganization, CreateOrganization } from '@clerk/nextjs'
import { Button } from '@/components/ui/button'
import { Building2, ChevronDown, Plus, AlertCircle, Crown } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'

interface OrganizationSubscriptionStatus {
  organizationId: string;
  hasActiveSubscription: boolean;
  subscriptionStatus: 'ACTIVE' | 'TRIAL' | 'PAST_DUE' | 'EXPIRED' | 'CANCELED';
  trialExpired: boolean;
  daysLeftInTrial?: number;
}

export function OrganizationSwitcher() {
  const { userMemberships, setActive, isLoaded } = useOrganizationList({
    userMemberships: {
      infinite: true,
    }
  })
  const { organization } = useOrganization()
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [isSwitching, setIsSwitching] = useState(false)
  const [subscriptionStatuses, setSubscriptionStatuses] = useState<Record<string, OrganizationSubscriptionStatus>>({})

  // Fetch subscription statuses for all organizations
  useEffect(() => {
    if (isLoaded && userMemberships?.data) {
      fetchSubscriptionStatuses()
    }
  }, [isLoaded, userMemberships?.data])

  const fetchSubscriptionStatuses = async () => {
    if (!userMemberships?.data) return

    const statuses: Record<string, OrganizationSubscriptionStatus> = {}

    // Fetch subscription status for each organization
    await Promise.all(
      userMemberships.data.map(async (membership) => {
        try {
          const response = await fetch(`/api/billing/organization-subscription-status?orgId=${membership.organization.id}`)
          if (response.ok) {
            const data = await response.json()
            statuses[membership.organization.id] = data
          }
        } catch (error) {
          console.error(`Failed to fetch subscription for org ${membership.organization.id}:`, error)
        }
      })
    )

    setSubscriptionStatuses(statuses)
  }

  // Don't render until loaded
  if (!isLoaded) {
    return (
      <Button variant="ghost" className="w-full justify-start gap-2" disabled>
        <Building2 className="w-4 h-4" />
        <span>Loading...</span>
      </Button>
    )
  }

  const memberships = userMemberships?.data || []
  const hasOrganizations = memberships.length > 0

  const handleOrganizationSwitch = async (orgId: string) => {
    // Don't switch if already on the same organization
    if (organization?.id === orgId) return
    
    if (!setActive) return
    
    console.log('Switching to organization:', orgId)
    setIsSwitching(true)
    
    try {
      await setActive({ organization: orgId })
      console.log('Organization switch successful, reloading page...')
      
      // Small delay to ensure Clerk state is properly updated
      setTimeout(() => {
        // Force a complete page reload for data consistency
        window.location.reload()
      }, 100)
      
    } catch (error) {
      console.error('Error switching organization:', error)
      setIsSwitching(false) // Only reset if there's an error
    }
  }

  const getSubscriptionBadge = (orgId: string) => {
    const status = subscriptionStatuses[orgId]
    if (!status) return null

    if (status.hasActiveSubscription) {
      if (status.subscriptionStatus === 'TRIAL') {
        return (
          <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-800">
            Trial ({status.daysLeftInTrial}d left)
          </Badge>
        )
      }
      return (
        <Badge variant="default" className="text-xs bg-green-100 text-green-800">
          <Crown className="w-3 h-3 mr-1" />
          Active
        </Badge>
      )
    } else {
      return (
        <Badge variant="destructive" className="text-xs">
          <AlertCircle className="w-3 h-3 mr-1" />
          No Subscription
        </Badge>
      )
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="ghost" 
            className="w-full justify-start gap-2"
            disabled={isSwitching}
          >
            <Building2 className="w-4 h-4" />
            <div className="flex flex-col items-start flex-1 min-w-0">
              <span className="truncate text-sm">
                {isSwitching ? 'Switching...' : (organization?.name || (hasOrganizations ? 'Select Organization' : 'No Organization'))}
              </span>
              {organization && subscriptionStatuses[organization.id] && (
                <span className="text-xs text-muted-foreground">
                  {subscriptionStatuses[organization.id].hasActiveSubscription 
                    ? subscriptionStatuses[organization.id].subscriptionStatus 
                    : 'Subscription Required'}
                </span>
              )}
            </div>
            <ChevronDown className="w-4 h-4 ml-auto" />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="start" className="w-80">
          {memberships.length === 0 ? (
            <DropdownMenuItem disabled>
              <span className="text-muted-foreground">No organizations found</span>
            </DropdownMenuItem>
          ) : (
            memberships.map((membership) => (
              <DropdownMenuItem
                key={membership.organization.id}
                onClick={() => handleOrganizationSwitch(membership.organization.id)}
                className={`cursor-pointer p-3 ${organization?.id === membership.organization.id ? 'bg-accent' : ''}`}
                disabled={isSwitching}
              >
                <div className="flex items-center gap-3 w-full">
                  <Building2 className="w-5 h-5 flex-shrink-0" />
                  <div className="flex flex-col flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="truncate font-medium">{membership.organization.name}</span>
                      {organization?.id === membership.organization.id && (
                        <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0" />
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        {membership.role?.replace('org:', '')}
                      </span>
                      {getSubscriptionBadge(membership.organization.id)}
                    </div>
                  </div>
                </div>
              </DropdownMenuItem>
            ))
          )}

          <DropdownMenuSeparator />

          <DropdownMenuItem
            onClick={() => setShowCreateModal(true)}
            className="cursor-pointer text-primary p-3"
            disabled={isSwitching}
          >
            <div className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              <span>Create Organization</span>
            </div>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="sm:max-w-md">
          <div className="py-4">
            <CreateOrganization
              afterCreateOrganizationUrl="/dashboard"
              skipInvitationScreen
              appearance={{
                elements: {
                  rootBox: 'w-full',
                  card: 'shadow-none border-0 bg-transparent',
                  headerTitle: 'text-lg font-semibold text-foreground',
                  headerSubtitle: 'text-sm text-muted-foreground',
                  socialButtonsIconButton: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
                  formButtonPrimary: 'bg-primary text-primary-foreground hover:bg-primary/90',
                  formFieldInput: 'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
                  formFieldLabel: 'text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
                  dividerLine: 'bg-border',
                  dividerText: 'text-muted-foreground',
                  footer: 'hidden'
                },
                variables: {
                  colorPrimary: 'hsl(var(--primary))',
                  colorBackground: 'hsl(var(--background))',
                  colorText: 'hsl(var(--foreground))',
                  colorTextSecondary: 'hsl(var(--muted-foreground))',
                  colorInputBackground: 'hsl(var(--background))',
                  colorInputText: 'hsl(var(--foreground))',
                  borderRadius: '0.5rem'
                }
              }}
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
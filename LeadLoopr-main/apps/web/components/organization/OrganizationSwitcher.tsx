'use client'

import { useState } from 'react'
import { useOrganizationList, useOrganization, CreateOrganization } from '@clerk/nextjs'
import { Button } from '@/components/ui/button'
import { Building2, ChevronDown, Plus } from 'lucide-react'
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

export function OrganizationSwitcher() {
  const { userMemberships, setActive, isLoaded } = useOrganizationList({
    userMemberships: {
      infinite: true,
    }
  })
  const { organization } = useOrganization()
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [isSwitching, setIsSwitching] = useState(false)

  // Enhanced debug logging
  console.log('OrganizationSwitcher Debug:', {
    isLoaded,
    userMemberships: userMemberships,
    membershipData: userMemberships?.data,
    membershipCount: userMemberships?.data?.length,
    currentOrg: organization?.name,
    currentOrgId: organization?.id,
   // hasNext: userMemberships?.hasNext,
    isLoading: userMemberships?.isLoading,
    isFetching: userMemberships?.isFetching
  })

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
            <span className="truncate">
              {isSwitching ? 'Switching...' : (organization?.name || (hasOrganizations ? 'Select Organization' : 'No Organization'))}
            </span>
            <ChevronDown className="w-4 h-4 ml-auto" />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="start" className="w-56">
          {memberships.length === 0 ? (
            <DropdownMenuItem disabled>
              <span className="text-muted-foreground">No organizations found</span>
            </DropdownMenuItem>
          ) : (
            memberships.map((membership) => (
              <DropdownMenuItem
                key={membership.organization.id}
                onClick={() => handleOrganizationSwitch(membership.organization.id)}
                className={`cursor-pointer ${organization?.id === membership.organization.id ? 'bg-accent' : ''}`}
                disabled={isSwitching}
              >
                <div className="flex items-center gap-2 w-full">
                  <Building2 className="w-4 h-4" />
                  <div className="flex flex-col flex-1 min-w-0">
                    <span className="truncate font-medium">{membership.organization.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {membership.role?.replace('org:', '')}
                    </span>
                  </div>
                  {organization?.id === membership.organization.id && (
                    <div className="w-2 h-2 bg-primary rounded-full" />
                  )}
                </div>
              </DropdownMenuItem>
            ))
          )}

          <DropdownMenuSeparator />

          <DropdownMenuItem
            onClick={() => setShowCreateModal(true)}
            className="cursor-pointer text-primary"
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
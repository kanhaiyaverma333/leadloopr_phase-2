'use client'

import { useEffect, useState } from 'react'
import { useOrganizationList, useOrganization } from '@clerk/nextjs'
import { CreateOrganization } from '@clerk/nextjs'

interface OrganizationCheckProps {
    children: React.ReactNode
}

export function OrganizationCheck({ children }: OrganizationCheckProps) {
    const { userMemberships, isLoaded, setActive } = useOrganizationList()
    const { organization } = useOrganization()
    const [showCreateOrg, setShowCreateOrg] = useState(false)
    const [hasChecked, setHasChecked] = useState(false)
    const [isAutoSelecting, setIsAutoSelecting] = useState(false)

    useEffect(() => {
        if (isLoaded && !hasChecked) {
            // Check if user has any organizations
            const hasOrganizations = userMemberships && userMemberships.data.length > 0

            if (!hasOrganizations) {
                setShowCreateOrg(true)
            }

            setHasChecked(true)
        }
    }, [isLoaded, userMemberships, hasChecked])

    // Close create org form if user now has an organization
    useEffect(() => {
        if (hasChecked && organization) {
            setShowCreateOrg(false)
        }
    }, [organization, hasChecked])

    // Auto-select organization with better error handling
    useEffect(() => {
        if (
            hasChecked && 
            !organization && 
            userMemberships?.data && userMemberships.data.length > 0 && 
            setActive && 
            !isAutoSelecting
        ) {
            const firstOrg = userMemberships.data[0]?.organization
            if (firstOrg) {
                setIsAutoSelecting(true)
                console.log('Auto-selecting organization:', firstOrg.name)
                
                setActive({ organization: firstOrg.id })
                    .then(() => {
                        console.log('Auto-selection successful')
                        setIsAutoSelecting(false)
                    })
                    .catch((error) => {
                        console.error('Auto-selection failed:', error)
                        setIsAutoSelecting(false)
                        // Don't show create org on auto-selection failure
                        // Let user manually select from switcher
                    })
            }
        }
    }, [hasChecked, organization, userMemberships, setActive, isAutoSelecting])

    // Don't render children until we've checked for organizations and have a stable state
    if (!isLoaded || !hasChecked) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="flex flex-col items-center gap-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <p className="text-sm text-muted-foreground">Loading...</p>
                </div>
            </div>
        )
    }

    // Show Clerk's CreateOrganization component if user has no organizations
    if (showCreateOrg) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50">
                <div className="w-full max-w-md">
                    <div className="text-center mb-6">
                        <h1 className="text-2xl font-bold text-gray-900 mb-2">Welcome to LeadLoopr</h1>
                        <p className="text-gray-600">Create your first organization to get started</p>
                    </div>
                    <CreateOrganization
                        afterCreateOrganizationUrl="/dashboard"
                        appearance={{
                            elements: {
                                rootBox: 'w-full',
                                card: 'shadow-lg border border-gray-200 bg-white rounded-lg',
                            }
                        }}
                    />
                </div>
            </div>
        )
    }

    // Show loading while auto-selecting organization
    if (isAutoSelecting || (!organization && userMemberships?.data?.length > 0)) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="flex flex-col items-center gap-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <p className="text-sm text-muted-foreground">
                        {isAutoSelecting ? 'Setting up your workspace...' : 'Loading organization...'}
                    </p>
                </div>
            </div>
        )
    }

    // User has organizations and one is active - render the app
    if (organization) {
        return <>{children}</>
    }

    // Fallback: Show a message if something went wrong
    return (
        <div className="flex items-center justify-center min-h-screen">
            <div className="text-center max-w-md mx-auto p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-2">Organization Required</h2>
                <p className="text-gray-600 mb-4">
                    Please select an organization from the sidebar to continue.
                </p>
                <button
                    onClick={() => window.location.reload()}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                    Refresh Page
                </button>
            </div>
        </div>
    )
}
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

    // Don't render children until we've checked for organizations
    if (!isLoaded || !hasChecked) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        )
    }

    // Show Clerk's CreateOrganization component if user has no organizations
    if (showCreateOrg) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50">
                <div className="w-full max-w-md">
                    <CreateOrganization
                        afterCreateOrganizationUrl="/dashboard"
                    />
                </div>
            </div>
        )
    }

    return <>{children}</>
} 
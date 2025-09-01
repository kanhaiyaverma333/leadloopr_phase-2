'use client'

import { useOrganizationList, useOrganization } from '@clerk/nextjs'
import { Button } from '@/components/ui/button'
import { Building2, ChevronDown } from 'lucide-react'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export function OrganizationSwitcher() {
    const { userMemberships, setActive } = useOrganizationList()
    const { organization } = useOrganization()

    if (!userMemberships?.data?.length) {
        return null
    }

    const handleOrganizationSwitch = async (orgId: string) => {
        if (!setActive) return

        try {
            await setActive({ organization: orgId })
        } catch (error) {
            console.error('Error switching organization:', error)
        }
    }

    const memberships = userMemberships.data

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="w-full justify-start gap-2">
                    <Building2 className="w-4 h-4" />
                    <span className="truncate">
                        {organization?.name || 'Select Organization'}
                    </span>
                    <ChevronDown className="w-4 h-4 ml-auto" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
                {memberships.map((membership) => (
                    <DropdownMenuItem
                        key={membership.organization.id}
                        onClick={() => handleOrganizationSwitch(membership.organization.id)}
                        className={`cursor-pointer ${organization?.id === membership.organization.id
                            ? 'bg-accent'
                            : ''
                            }`}
                    >
                        <div className="flex items-center gap-2">
                            <Building2 className="w-4 h-4" />
                            <span className="truncate">
                                {membership.organization.name}
                            </span>
                        </div>
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    )
} 
import { NextResponse } from 'next/server'
import { clerkClient } from '@clerk/nextjs/server'
import { protectOrgRoute, AuthResult } from '@/lib/api-auth'

export async function GET(request: Request): Promise<NextResponse> {
    return protectOrgRoute(async (authResult: AuthResult) => {
        try {
            // Fetch organization memberships using Clerk API
            const clerk = await clerkClient()
            const memberships = await clerk.organizations.getOrganizationMembershipList({
                organizationId: authResult.orgId,
            })

            // Transform the data to match our component's expected format
            const transformedMembers = memberships.data.map((membership: any) => {
                const userData = membership.publicUserData
                const fullName = userData ? `${userData.firstName || ''} ${userData.lastName || ''}`.trim() : 'Unknown User'

                // Map Clerk roles to user-friendly names
                const roleMap: { [key: string]: string } = {
                    'org:admin': 'Admin',
                    'org:member': 'Member',
                    'org:basic_member': 'Member',
                    'org:guest': 'Guest'
                }

                const displayRole = roleMap[membership.role] || membership.role

                return {
                    id: membership.id,
                    userId: membership.publicUserData?.userId || membership.id,
                    name: fullName || 'Unknown User',
                    email: membership.publicUserData?.identifier || 'No email',
                    role: displayRole,
                    initials: getInitials(fullName || 'Unknown User'),
                    imageUrl: membership.publicUserData?.imageUrl || null,
                }
            })

            return NextResponse.json({
                success: true,
                members: transformedMembers,
                total: transformedMembers.length,
            })
        } catch (error) {
            console.error('Error fetching organization members:', error)
            return NextResponse.json(
                { error: 'Failed to fetch organization members' },
                { status: 500 }
            )
        }
    })
}

function getInitials(name: string): string {
    return name
        .split(' ')
        .filter(Boolean)
        .map(word => word.charAt(0))
        .join('')
        .toUpperCase()
        .slice(0, 2)
} 
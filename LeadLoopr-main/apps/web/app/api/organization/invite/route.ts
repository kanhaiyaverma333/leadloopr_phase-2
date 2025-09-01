import { NextResponse } from 'next/server'
import { clerkClient } from '@clerk/nextjs/server'
import { protectAdminRoute, AuthResult } from '@/lib/api-auth'

export async function POST(request: Request): Promise<NextResponse> {
    return protectAdminRoute(async (authResult: AuthResult) => {
        try {
            // Parse the request body
            const { emailAddress, role = 'org:member' } = await request.json()

            if (!emailAddress) {
                return NextResponse.json(
                    { error: 'Email address is required' },
                    { status: 400 }
                )
            }

            console.log(`📧 Creating invitation for ${emailAddress} in organization ${authResult.orgId}`)

            // Create the organization invitation
            const clerk = await clerkClient()
            const invitation = await clerk.organizations.createOrganizationInvitation({
                organizationId: authResult.orgId,
                inviterUserId: authResult.userId,
                emailAddress: emailAddress,
                role: role,
                redirectUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/invitation?org_id=${authResult.orgId}`,
            })

            console.log(`✅ Invitation created successfully: ${invitation.id}`)

            return NextResponse.json({
                success: true,
                invitation: {
                    id: invitation.id,
                    emailAddress: invitation.emailAddress,
                    status: invitation.status,
                    role: invitation.role,
                    createdAt: invitation.createdAt,
                }
            })

        } catch (error: any) {
            console.error('❌ Error creating organization invitation:', error)

            // Handle specific Clerk errors
            if (error.errors && error.errors.length > 0) {
                const clerkError = error.errors[0]

                if (clerkError.code === 'organization_invitation_already_exists') {
                    return NextResponse.json(
                        { error: 'An invitation has already been sent to this email address' },
                        { status: 409 }
                    )
                }

                if (clerkError.code === 'organization_invitation_email_already_member') {
                    return NextResponse.json(
                        { error: 'This email address is already a member of the organization' },
                        { status: 409 }
                    )
                }
            }

            return NextResponse.json(
                { error: 'Failed to send invitation' },
                { status: 500 }
            )
        }
    })
} 
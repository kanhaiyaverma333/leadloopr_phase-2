import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

export interface AuthResult {
    userId: string
    orgId: string
    orgRole: string
    isAuthenticated: boolean
    isOrgMember: boolean
    isAdmin: boolean
}

/**
 * Authenticate and authorize API requests using Clerk
 */
async function authenticateApiRequest(): Promise<AuthResult> {
    try {
        const { userId, orgId, orgRole } = await auth()

        if (!userId) {
            return {
                userId: '',
                orgId: '',
                orgRole: '',
                isAuthenticated: false,
                isOrgMember: false,
                isAdmin: false
            }
        }

        const isOrgMember = !!orgId && !!orgRole
        const isAdmin = orgRole === 'org:admin'

        return {
            userId,
            orgId: orgId || '',
            orgRole: orgRole || '',
            isAuthenticated: true,
            isOrgMember,
            isAdmin
        }
    } catch (error) {
        console.error('Authentication error:', error)
        return {
            userId: '',
            orgId: '',
            orgRole: '',
            isAuthenticated: false,
            isOrgMember: false,
            isAdmin: false
        }
    }
}

/**
 * Protect routes that require organization membership
 */
export async function protectOrgRoute(
    handler: (authResult: AuthResult) => Promise<NextResponse>
): Promise<NextResponse> {
    try {
        const authResult = await authenticateApiRequest()

        if (!authResult.isAuthenticated) {
            return NextResponse.json(
                { error: 'Unauthorized - Authentication required' },
                { status: 401 }
            )
        }

        if (!authResult.isOrgMember) {
            return NextResponse.json(
                { error: 'Forbidden - Organization membership required' },
                { status: 403 }
            )
        }

        return await handler(authResult)
    } catch (error) {
        console.error('API route protection error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}

/**
 * Protect routes that require admin privileges
 */
export async function protectAdminRoute(
    handler: (authResult: AuthResult) => Promise<NextResponse>
): Promise<NextResponse> {
    try {
        const authResult = await authenticateApiRequest()

        if (!authResult.isAuthenticated) {
            return NextResponse.json(
                { error: 'Unauthorized - Authentication required' },
                { status: 401 }
            )
        }

        if (!authResult.isOrgMember) {
            return NextResponse.json(
                { error: 'Forbidden - Organization membership required' },
                { status: 403 }
            )
        }

        if (!authResult.isAdmin) {
            return NextResponse.json(
                { error: 'Forbidden - Admin privileges required' },
                { status: 403 }
            )
        }

        return await handler(authResult)
    } catch (error) {
        console.error('API route protection error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
} 
import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { syncCurrentUser } from '@/lib/clerk-sync'

export async function POST() {
    try {
        const { userId } = await auth()

        if (!userId) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            )
        }

        const user = await syncCurrentUser()

        if (!user) {
            return NextResponse.json({
                success: false,
                message: 'User not created - email not verified',
                user: null
            })
        }

        return NextResponse.json({
            success: true,
            message: 'User synced successfully',
            user: {
                id: user.id,
                clerkId: user.clerkId,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
            }
        })
    } catch (error) {
        console.error('Error syncing user:', error)
        return NextResponse.json(
            { error: 'Failed to sync user' },
            { status: 500 }
        )
    }
}

export async function GET() {
    try {
        const { userId } = await auth()

        if (!userId) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            )
        }

        const user = await syncCurrentUser()

        if (!user) {
            return NextResponse.json({
                success: false,
                message: 'User not created - email not verified',
                user: null
            })
        }

        return NextResponse.json({
            success: true,
            message: 'User synced successfully',
            user: {
                id: user.id,
                clerkId: user.clerkId,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
            }
        })
    } catch (error) {
        console.error('Error syncing user:', error)
        return NextResponse.json(
            { error: 'Failed to sync user' },
            { status: 500 }
        )
    }
} 
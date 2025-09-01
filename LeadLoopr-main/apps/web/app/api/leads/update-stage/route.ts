import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { prisma } from '@repo/database'

export async function POST(req: Request) {
    try {
        const { userId } = await auth()

        if (!userId) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            )
        }

        const body = await req.json()
        const { leadId, newStageId } = body

        // Get the user and their current organization
        const user = await prisma.user.findUnique({
            where: { clerkId: userId },
            include: {
                currentOrganization: true
            }
        })

        if (!user?.currentOrganization) {
            return NextResponse.json(
                { error: 'No organization found' },
                { status: 404 }
            )
        }

        const organizationId = user.currentOrganization.id

        // Validate required fields
        if (!leadId) {
            return NextResponse.json(
                { error: 'Lead ID is required' },
                { status: 400 }
            )
        }

        if (!newStageId) {
            return NextResponse.json(
                { error: 'New stage ID is required' },
                { status: 400 }
            )
        }

        // Check if the lead exists and belongs to the organization
        const existingLead = await prisma.lead.findFirst({
            where: {
                id: leadId,
                organizationId
            },
            include: {
                stage: true
            }
        })

        if (!existingLead) {
            return NextResponse.json(
                { error: 'Lead not found' },
                { status: 404 }
            )
        }

        // Verify the new stage exists and belongs to the organization
        const newStage = await prisma.pipelineStage.findFirst({
            where: {
                id: newStageId,
                organizationId
            }
        })

        if (!newStage) {
            return NextResponse.json(
                { error: 'Invalid stage ID' },
                { status: 400 }
            )
        }

        // Don't update if the stage is the same
        if (existingLead.currentStageId === newStageId) {
            return NextResponse.json({
                success: true,
                lead: existingLead,
                message: 'Lead already in this stage'
            })
        }

        // Update the lead's current stage
        const updatedLead = await prisma.lead.update({
            where: {
                id: leadId
            },
            data: {
                currentStageId: newStageId
            },
            include: {
                stage: true
            }
        })

        return NextResponse.json({
            success: true,
            lead: updatedLead,
            message: 'Lead stage updated successfully'
        })
    } catch (error) {
        console.error('Error updating lead stage:', error)
        return NextResponse.json(
            { error: 'Failed to update lead stage' },
            { status: 500 }
        )
    }
}   
import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { prisma } from '@repo/database'

export async function GET() {
    try {
        const { userId } = await auth()
        console.log('Fetching leads for user:', userId)
        if (!userId) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            )
        }

        // Get the user and their current organization
        const user = await prisma.user.findUnique({
            where: { clerkId: userId },
            include: {
                currentOrganization: {
                    include: {
                        leads: {
                            include: {
                                stage: true
                            },
                            orderBy: { createdAt: 'desc' }
                        }
                    }
                }
            }
        })

        if (!user?.currentOrganization) {
            return NextResponse.json(
                { error: 'No organization found' },
                { status: 404 }
            )
        }

        return NextResponse.json({
            success: true,
            leads: user.currentOrganization.leads
        })
    } catch (error) {
        console.error('Error fetching leads:', error)
        return NextResponse.json(
            { error: 'Failed to fetch leads' },
            { status: 500 }
        )
    }
}

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
        const {
            name,
            email,
            phone,
            websiteUrl,
            landingPageUrl,
            path,
            referrerUrl,
            utmSource,
            utmMedium,
            utmCampaign,
            gclid,
            fbclid,
            li_fat_id,
            metaFbp,
            gaClientId,
            gaSessionId,
            msclkid,
            consentStatus,
            consentTimestamp,
            adStorageConsent,
            adUserDataConsent,
            adPersonalizationConsent,
            analyticsStorageConsent,
            value,
            currency,
            priority,
            qualification,
            tags,
            isManual,
            currentStageId,
            
        } = body

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
        if (!name || !name.trim()) {
            return NextResponse.json(
                { error: 'Lead name is required' },
                { status: 400 }
            )
        }

        if (!currentStageId) {
            return NextResponse.json(
                { error: 'Stage ID is required' },
                { status: 400 }
            )
        }

        // Verify the stage exists and belongs to the organization
        const stage = await prisma.pipelineStage.findFirst({
            where: {
                id: currentStageId,
                organizationId
            }
        })

        if (!stage) {
            return NextResponse.json(
                { error: 'Invalid stage ID' },
                { status: 400 }
            )
        }

        // Create the lead
        const newLead = await prisma.lead.create({
            data: {
                organizationId,
                currentStageId,
                name: name.trim(),
                email: email?.trim() || null,
                phone: phone?.trim() || null,
                websiteUrl: websiteUrl?.trim() || null,
                landingPageUrl: landingPageUrl?.trim() || null,
                path: path?.trim() || null,
                referrerUrl: referrerUrl?.trim() || null,
                utmSource: utmSource?.trim() || null,
                utmMedium: utmMedium?.trim() || null,
                utmCampaign: utmCampaign?.trim() || null,
                gclid: gclid?.trim() || null,
                fbclid: fbclid?.trim() || null,
                li_fat_id: li_fat_id?.trim() || null,
                metaFbp: metaFbp?.trim() || null,
                gaClientId: gaClientId?.trim() || null,
                gaSessionId: gaSessionId?.trim() || null,
                msclkid: msclkid?.trim() || null,
                consentStatus: consentStatus || 'UNKNOWN',
                consentTimestamp: consentTimestamp ? new Date(consentTimestamp) : null,
                adStorageConsent: adStorageConsent || null,
                adUserDataConsent: adUserDataConsent || null,
                adPersonalizationConsent: adPersonalizationConsent || null,
                analyticsStorageConsent: analyticsStorageConsent || null,
                value: value || null,
                currency: currency || 'EUR',
                priority: priority || 'MEDIUM',
                qualification: qualification || 'UNQUALIFIED',
                tags: tags || [],
                isManual: isManual !== undefined ? isManual : true,
                lastUpdatedById: user.id,
            },
            include: {
                stage: true
            }
        })

        return NextResponse.json({
            success: true,
            lead: newLead
        })
    } catch (error) {
        console.error('Error creating lead:', error)
        return NextResponse.json(
            { error: 'Failed to create lead' },
            { status: 500 }
        )
    }
}

export async function PUT(req: Request) {
    try {
        const { userId } = await auth()

        if (!userId) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            )
        }

        const body = await req.json()
        const {
            leadId,
            name,
            email,
            phone,
            websiteUrl,
            landingPageUrl,
            path,
            referrerUrl,
            utmSource,
            utmMedium,
            utmCampaign,
            gclid,
            fbclid,
            li_fat_id,
            metaFbp,
            gaClientId,
            gaSessionId,
            msclkid,
            consentStatus,
            consentTimestamp,
            adStorageConsent,
            adUserDataConsent,
            adPersonalizationConsent,
            analyticsStorageConsent,
            value,
            currency,
            priority,
            qualification,
            tags,
            isManual,
            currentStageId
        } = body

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

        if (!name || !name.trim()) {
            return NextResponse.json(
                { error: 'Lead name is required' },
                { status: 400 }
            )
        }

        // Check if the lead exists and belongs to the organization
        const existingLead = await prisma.lead.findFirst({
            where: {
                id: leadId,
                organizationId
            }
        })

        if (!existingLead) {
            return NextResponse.json(
                { error: 'Lead not found' },
                { status: 404 }
            )
        }

        // If currentStageId is provided, verify it exists and belongs to the organization
        if (currentStageId) {
            const stage = await prisma.pipelineStage.findFirst({
                where: {
                    id: currentStageId,
                    organizationId
                }
            })

            if (!stage) {
                return NextResponse.json(
                    { error: 'Invalid stage ID' },
                    { status: 400 }
                )
            }
        }

        // Update the lead
        const updateData: any = {
            name: name.trim(),
            email: email?.trim() || null,
            phone: phone?.trim() || null,
            websiteUrl: websiteUrl?.trim() || null,
            landingPageUrl: landingPageUrl?.trim() || null,
            path: path?.trim() || null,
            referrerUrl: referrerUrl?.trim() || null,
            utmSource: utmSource?.trim() || null,
            utmMedium: utmMedium?.trim() || null,
            utmCampaign: utmCampaign?.trim() || null,
            gclid: gclid?.trim() || null,
            fbclid: fbclid?.trim() || null,
            li_fat_id: li_fat_id?.trim() || null,
            metaFbp: metaFbp?.trim() || null,
            gaClientId: gaClientId?.trim() || null,
            gaSessionId: gaSessionId?.trim() || null,
            msclkid: msclkid?.trim() || null,
            consentStatus: consentStatus || 'UNKNOWN',
            consentTimestamp: consentTimestamp ? new Date(consentTimestamp) : null,
            adStorageConsent: adStorageConsent || null,
            adUserDataConsent: adUserDataConsent || null,
            adPersonalizationConsent: adPersonalizationConsent || null,
            analyticsStorageConsent: analyticsStorageConsent || null,
            value: value || null,
            currency: currency || 'EUR',
            priority: priority || 'MEDIUM',
            qualification: qualification || 'UNQUALIFIED',
            tags: tags || [],
            isManual: isManual !== undefined ? isManual : true,
            lastUpdatedById: user.id,
        }

        if (currentStageId) {
            updateData.currentStageId = currentStageId
        }

        const updatedLead = await prisma.lead.update({
            where: {
                id: leadId
            },
            data: updateData,
            include: {
                stage: true
            }
        })

        return NextResponse.json({
            success: true,
            lead: updatedLead
        })
    } catch (error) {
        console.error('Error updating lead:', error)
        return NextResponse.json(
            { error: 'Failed to update lead' },
            { status: 500 }
        )
    }
}

export async function DELETE(req: Request) {
    try {
        const { userId } = await auth()

        if (!userId) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            )
        }

        const { searchParams } = new URL(req.url)
        const leadId = searchParams.get('id')

        if (!leadId) {
            return NextResponse.json(
                { error: 'Lead ID is required' },
                { status: 400 }
            )
        }

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

        // Check if the lead exists and belongs to the organization
        const existingLead = await prisma.lead.findFirst({
            where: {
                id: leadId,
                organizationId
            }
        })

        if (!existingLead) {
            return NextResponse.json(
                { error: 'Lead not found' },
                { status: 404 }
            )
        }

        // Delete the lead
        await prisma.lead.delete({
            where: {
                id: leadId
            }
        })

        return NextResponse.json({
            success: true,
            message: 'Lead deleted successfully'
        })
    } catch (error) {
        console.error('Error deleting lead:', error)
        return NextResponse.json(
            { error: 'Failed to delete lead' },
            { status: 500 }
        )
    }
} 
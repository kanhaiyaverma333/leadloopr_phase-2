// app/api/organization/create/route.ts
import { NextResponse } from 'next/server'
import { clerkClient } from '@clerk/nextjs/server'
import { auth } from '@clerk/nextjs/server'

// Simple validation function
function validateOrgData(data: any) {
    const errors = []
    
    if (!data.name || typeof data.name !== 'string' || data.name.trim().length === 0) {
        errors.push('Organization name is required')
    }
    
    if (data.name && data.name.length > 100) {
        errors.push('Organization name is too long (max 100 characters)')
    }
    
    if (data.website && data.website.trim() !== '') {
        const urlPattern = /^https?:\/\/.+\..+/
        if (!urlPattern.test(data.website)) {
            errors.push('Invalid website URL format')
        }
    }
    
    return {
        isValid: errors.length === 0,
        errors,
        data: {
            name: data.name?.trim(),
            website: data.website?.trim() || undefined
        }
    }
}

export async function POST(request: Request): Promise<NextResponse> {
    try {
        // Get the authenticated user
        const { userId } = await auth()
        
        if (!userId) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            )
        }

        // Parse and validate request body
        const body = await request.json()
        const validation = validateOrgData(body)
        
        if (!validation.isValid) {
            return NextResponse.json(
                { 
                    error: 'Invalid input', 
                    details: validation.errors 
                },
                { status: 400 }
            )
        }

        const { name, website } = validation.data
        
        console.log(`Creating organization: ${name} for user: ${userId}`)

        // Create organization using Clerk
        const clerk = await clerkClient()
        
        // First, check if organization with this name already exists for this user
        const existingOrgs = await clerk.organizations.getOrganizationList()
        const orgExists = existingOrgs.data.some(org => 
            org.name.toLowerCase() === name.toLowerCase()
        )

        if (orgExists) {
            return NextResponse.json(
                { error: 'An organization with this name already exists' },
                { status: 409 }
            )
        }

        // Create the organization
        const organization = await clerk.organizations.createOrganization({
            name: name,
            slug: name.toLowerCase()
                .replace(/[^a-z0-9\s-]/g, '')
                .replace(/\s+/g, '-')
                .replace(/-+/g, '-')
                .trim()
                .substring(0, 50), // Clerk has slug length limits
            createdBy: userId,
            // Store website in public metadata so webhook can access it
            publicMetadata: website ? { website } : {}
        })

        console.log(`Organization created successfully: ${organization.id}`)

        return NextResponse.json({
            success: true,
            organization: {
                id: organization.id,
                name: organization.name,
                slug: organization.slug,
                website: website || null,
                createdAt: organization.createdAt,
            }
        })

    } catch (error: any) {
        console.error('Error creating organization:', error)

        // Handle specific Clerk errors
        if (error.errors && error.errors.length > 0) {
            const clerkError = error.errors[0]
            
            if (clerkError.code === 'organization_slug_exists') {
                return NextResponse.json(
                    { error: 'Organization name is not available. Please choose a different name.' },
                    { status: 409 }
                )
            }
            
            if (clerkError.code === 'organization_name_exists') {
                return NextResponse.json(
                    { error: 'An organization with this name already exists' },
                    { status: 409 }
                )
            }
        }

        return NextResponse.json(
            { error: 'Failed to create organization' },
            { status: 500 }
        )
    }
}
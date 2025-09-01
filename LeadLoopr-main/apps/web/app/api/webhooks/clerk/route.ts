export const dynamic = 'force-dynamic'

import { Webhook } from 'svix';
import { headers } from 'next/headers';
import { WebhookEvent } from '@clerk/nextjs/server';
import { prisma } from '@repo/database';
import { NextResponse } from 'next/server';

/**
 * Generic retry helper function
 * @param operation - The async operation to retry
 * @param maxAttempts - Maximum number of attempts
 * @param delay - Delay between attempts in milliseconds
 * @param operationName - Name of the operation for logging
 * @param identifier - Identifier for the operation (e.g., clerkId)
 */
async function retryOperation<T>(
    operation: () => Promise<T | null>,
    maxAttempts: number,
    delay: number,
    operationName: string,
    identifier: string
): Promise<{ result: T | null; attempts: number }> {
    let result: T | null = null;
    let attempts = 0;

    while (!result && attempts < maxAttempts) {
        attempts++;
        console.log(`🔄 ${operationName} attempt (${attempts}/${maxAttempts}): ${identifier}`);

        result = await operation();

        if (!result && attempts < maxAttempts) {
            console.log(`⚠️ ${operationName} not found. Retrying (${attempts}/${maxAttempts}) in ${delay}ms...`);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }

    if (result) {
        console.log(`✅ ${operationName} found on attempt ${attempts}: ${identifier}`);
    } else {
        console.log(`❌ ${operationName} not found after ${maxAttempts} attempts: ${identifier}`);
    }

    return { result, attempts };
}

export async function POST(req: Request) {
    const startTime = Date.now();

    try {
        // Get the headers
        const headerPayload = headers();
        const svix_id = headerPayload.get("svix-id");
        const svix_timestamp = headerPayload.get("svix-timestamp");
        const svix_signature = headerPayload.get("svix-signature");

        console.log('🔔 Webhook received:', {
            svix_id: svix_id ? 'present' : 'missing',
            svix_timestamp: svix_timestamp ? 'present' : 'missing',
            svix_signature: svix_signature ? 'present' : 'missing',
            has_secret: !!process.env.CLERK_WEBHOOK_SECRET
        });

        // If there are no headers, error out
        if (!svix_id || !svix_timestamp || !svix_signature) {
            console.error('❌ Missing Svix headers:', { svix_id, svix_timestamp, svix_signature });
            return new Response('Error occurred -- no svix headers', {
                status: 400
            });
        }

        // Get the body
        const payload = await req.json();
        const body = JSON.stringify(payload);

        // Validate webhook secret exists
        if (!process.env.CLERK_WEBHOOK_SECRET) {
            console.error('❌ CLERK_WEBHOOK_SECRET is not set');
            return new Response('Webhook secret not configured', {
                status: 500
            });
        }

        // Create a new Svix instance with your secret.
        const wh = new Webhook(process.env.CLERK_WEBHOOK_SECRET);

        let evt: WebhookEvent;

        // Verify the payload with the headers
        try {
            evt = wh.verify(body, {
                "svix-id": svix_id,
                "svix-timestamp": svix_timestamp,
                "svix-signature": svix_signature,
            }) as WebhookEvent;
            console.log('✅ Webhook signature verified successfully');
        } catch (err) {
            console.error('❌ Error verifying webhook signature:', err);
            return new Response('Error occurred during verification', {
                status: 400
            });
        }

        // Get the ID and type
        const { id } = evt.data;
        const eventType = evt.type;

        console.log(`📨 Processing webhook:`, {
            id,
            type: eventType,
            timestamp: new Date().toISOString(),
            processing_time_ms: Date.now() - startTime
        });

        // Handle the webhook
        switch (eventType) {
            case 'user.created':
            case 'user.updated':
                const user = await handleUserUpsert(evt.data);

                // Debug: Log metadata structure
                console.log('User webhook metadata:', {
                    public_metadata: evt.data?.public_metadata,
                    private_metadata: evt.data?.private_metadata,
                    organization_id: evt.data?.public_metadata?.organization_id || evt.data?.private_metadata?.organization_id
                });

                // If the user was created via an invite, org info might be present in metadata
                if (user) {
                    const organizationId = evt.data?.public_metadata?.organization_id || evt.data?.private_metadata?.organization_id;

                    if (organizationId && typeof organizationId === 'string') {
                        console.log(`🎯 INVITATION FLOW: User ${user.id} has organization metadata: ${organizationId}`);
                        await linkUserToOrganization(user.id, organizationId);
                    } else {
                        console.log(`📝 REGULAR SIGNUP: User ${user.id} created without organization metadata`);
                    }
                }
                break;
            case 'user.deleted':
                await handleUserDelete(evt.data);
                break;
            case 'organization.created':
            case 'organization.updated':
                console.log(`🏢 Organization webhook payload:`, {
                    id: evt.data?.id,
                    name: evt.data?.name,
                    slug: evt.data?.slug,
                    created_at: evt.data?.created_at,
                    updated_at: evt.data?.updated_at
                });
                await handleOrganizationUpsert(evt.data);
                break;
            case 'organization.deleted':
                await handleOrganizationDelete(evt.data);
                break;
            case 'organizationMembership.created':
                console.log(`🔗 Organization membership webhook payload:`, {
                    organization_id: evt.data?.organization?.id,
                    user_id: evt.data?.public_user_data?.user_id,
                    role: evt.data?.role
                });
                await handleOrganizationMembershipCreated(evt.data);
                break;
            case 'organizationMembership.deleted':
                await handleOrganizationMembershipDeleted(evt.data);
                break;
            default:
                console.log(`⚠️ Unhandled event type: ${eventType}`);
        }

        const totalTime = Date.now() - startTime;
        console.log(`✅ Webhook processed successfully in ${totalTime}ms`);

        return NextResponse.json({
            success: true,
            processing_time_ms: totalTime,
            event_type: eventType
        });
    } catch (error) {
        const totalTime = Date.now() - startTime;
        console.error(`❌ Webhook processing failed after ${totalTime}ms:`, error);

        return new Response('Internal server error', {
            status: 500
        });
    }
}

async function handleUserUpsert(userData: any) {
    const startTime = Date.now();

    try {
        const {
            id: clerkId,
            first_name: firstName,
            last_name: lastName,
            email_addresses,
            image_url: imageUrl,
            external_accounts,
        } = userData;

        console.log(`👤 Processing user upsert for clerkId: ${clerkId}`);

        // Get the primary email address
        const primaryEmail = email_addresses?.find((email: any) => email.id === userData.primary_email_address_id);
        const email = primaryEmail?.email_address;

        // Determine if the email is verified (for OAuth and email signups)
        const primaryEmailVerified = email_addresses?.some((email: any) =>
            email.id === userData.primary_email_address_id && email.verification?.status === 'verified'
        );
        const oauthVerified = external_accounts?.some((account: any) => account.verification?.status === 'verified');
        const isEmailVerified = primaryEmailVerified || oauthVerified;

        console.log(`📧 Email verification check for ${clerkId}:`, {
            email,
            primaryEmailVerified,
            oauthVerified,
            isEmailVerified,
            primaryEmailId: userData.primary_email_address_id,
            emailAddresses: email_addresses?.map((e: any) => ({ id: e.id, verified: e.verification?.status })),
            externalAccounts: external_accounts?.map((e: any) => ({ verified: e.verification?.status }))
        });

        // Check if user already exists by clerkId
        const existingUserByClerkId = await prisma.user.findUnique({
            where: { clerkId },
        });

        // Check if user already exists by email (in case of email conflicts)
        const existingUserByEmail = email ? await prisma.user.findUnique({
            where: { email },
        }) : null;

        let user = null;

        if (existingUserByClerkId) {
            console.log(`🔄 User exists by clerkId, updating: ${existingUserByClerkId.id}`);

            // User exists by clerkId, always update (but only if we have an email)
            if (email) {
                user = await prisma.user.update({
                    where: { clerkId },
                    data: {
                        firstName: firstName || null,
                        lastName: lastName || null,
                        email: email,
                        imageUrl: imageUrl || null,
                        updatedAt: new Date(),
                    },
                });
                console.log(`✅ User updated successfully: ${user.id}`);
            } else {
                console.log(`⚠️ Skipping user update - no email available for clerkId: ${clerkId}`);
                user = existingUserByClerkId; // Return existing user even if we can't update
            }
        } else if (existingUserByEmail && existingUserByEmail.clerkId !== clerkId) {
            console.log(`⚠️ Email conflict detected: Email ${email} exists with different clerkId ${existingUserByEmail.clerkId}`);
            console.log(`   Updating existing user ${existingUserByEmail.id} with new clerkId ${clerkId}`);

            // Update the existing user with the new clerkId
            user = await prisma.user.update({
                where: { id: existingUserByEmail.id },
                data: {
                    clerkId: clerkId,
                    firstName: firstName || existingUserByEmail.firstName,
                    lastName: lastName || existingUserByEmail.lastName,
                    imageUrl: imageUrl || existingUserByEmail.imageUrl,
                    updatedAt: new Date(),
                },
            });
            console.log(`✅ User updated with new clerkId successfully: ${user.id}`);
        } else {
            console.log(`🆕 User doesn't exist, checking if we can create`);

            // User doesn't exist, only create if email is verified and available
            if (isEmailVerified && email) {
                user = await prisma.user.create({
                    data: {
                        clerkId,
                        firstName: firstName || null,
                        lastName: lastName || null,
                        email: email,
                        imageUrl: imageUrl || null,
                    },
                });
                console.log(`✅ User created successfully: ${user.id}`);
            } else {
                console.log(`⚠️ Skipping user creation - email not verified or not available for clerkId: ${clerkId}`);
                console.log(`   Email: ${email}, Verified: ${isEmailVerified}`);
            }
        }

        const processingTime = Date.now() - startTime;
        console.log(`✅ User upsert completed in ${processingTime}ms for clerkId: ${clerkId}`);

        return user;
    } catch (error) {
        const processingTime = Date.now() - startTime;
        console.error(`❌ Error upserting user ${userData?.id} after ${processingTime}ms:`, error);

        // Log specific error details for debugging
        if (error instanceof Error) {
            console.error('Error details:', {
                message: error.message,
                stack: error.stack,
                clerkId: userData?.id
            });
        }

        throw error;
    }
}

async function handleUserDelete(userData: any) {
    const startTime = Date.now();

    try {
        const { id: clerkId } = userData;

        console.log(`🗑️ Processing user deletion for clerkId: ${clerkId}`);

        // Delete the user from the database
        await prisma.user.delete({
            where: { clerkId },
        });

        const processingTime = Date.now() - startTime;
        console.log(`✅ User deleted successfully in ${processingTime}ms: ${clerkId}`);
    } catch (error) {
        const processingTime = Date.now() - startTime;
        console.error(`❌ Error deleting user ${userData?.id} after ${processingTime}ms:`, error);

        // Don't throw error for delete operations as the user might not exist
        console.log('⚠️ User might not exist in database, continuing...');
    }
}

async function linkUserToOrganization(userId: string, organizationId: string) {
    const startTime = Date.now();

    try {
        console.log(`🔗 Linking user ${userId} to organization ${organizationId}`);

        const org = await prisma.organization.findUnique({ where: { id: organizationId } });
        if (!org) {
            console.warn(`⚠️ Org ${organizationId} not found in DB — skipping user-org link`);
            return;
        }

        const membership = await prisma.organizationUser.upsert({
            where: {
                userId_organizationId: {
                    userId,
                    organizationId
                }
            },
            update: {
                // No updates needed for existing membership
            },
            create: {
                userId,
                organizationId
            }
        });

        // Optionally set currentOrganizationId on the user
        await prisma.user.update({
            where: { id: userId },
            data: {
                currentOrganizationId: organizationId
            }
        });

        const processingTime = Date.now() - startTime;
        console.log(`✅ Linked user ${userId} to org ${organizationId} in ${processingTime}ms`);

        return membership;
    } catch (error) {
        const processingTime = Date.now() - startTime;
        console.error(`❌ Error linking user ${userId} to organization ${organizationId} after ${processingTime}ms:`, error);
        throw error;
    }
}

async function handleOrganizationUpsert(orgData: any) {
    const startTime = Date.now();

    try {
        const {
            id: clerkOrgId,
            name: orgName,
            slug: orgSlug,
            image_url: orgImageUrl,
        } = orgData;

        console.log(`🏢 Processing organization upsert for clerkOrgId: ${clerkOrgId}`, {
            name: orgName,
            slug: orgSlug,
            eventType: orgData.type || 'unknown',
            created: orgData.created,
            createdAt: orgData.created_at
        });

        // Check if this organization already exists in our database
        const existingOrg = await prisma.organization.findUnique({
            where: { id: clerkOrgId }
        });

        const isNewOrganization = !existingOrg;

        // Create or update the organization in the database
        const organization = await prisma.organization.upsert({
            where: { id: clerkOrgId },
            update: {
                name: orgName,
                website: orgSlug ? `https://${orgSlug}.clerk.accounts.dev` : null,
            },
            create: {
                id: clerkOrgId,
                name: orgName,
                website: orgSlug ? `https://${orgSlug}.clerk.accounts.dev` : null,
            }
        });

        console.log(`✅ Organization ${isNewOrganization ? 'created' : 'updated'} successfully: ${organization.id}`);

        // If this is a new organization, create default pipeline stages
        if (isNewOrganization) {
            console.log(`🎯 Creating default pipeline stages for new organization: ${organization.id}`);

            const defaultStages = [
                { name: "Proposal", position: 1, color: "bg-purple-500" },
                { name: "Qualified", position: 2, color: "bg-orange-500" },
                { name: "Sales Contact", position: 3, color: "bg-green-500" },
                { name: "Lost", position: 5, color: "bg-red-500" },
                { name: "Won", position: 4, color: "bg-emerald-500" },
            ];

            try {
                await Promise.all(
                    defaultStages.map((stage) =>
                        prisma.pipelineStage.create({
                            data: {
                                organizationId: organization.id,
                                name: stage.name,
                                position: stage.position,
                                color: stage.color,
                            }
                        })
                    )
                );

                console.log(`✅ Default pipeline stages created for organization: ${organization.id}`);
            } catch (stageError) {
                console.error(`❌ Error creating default pipeline stages for organization ${organization.id}:`, stageError);
                // Don't throw here - the organization was created successfully, stages can be added later
            }
        }

        const processingTime = Date.now() - startTime;
        console.log(`✅ Organization upsert completed in ${processingTime}ms for clerkOrgId: ${clerkOrgId}`);

        return organization;
    } catch (error) {
        const processingTime = Date.now() - startTime;
        console.error(`❌ Error upserting organization ${orgData?.id} after ${processingTime}ms:`, error);

        // Log specific error details for debugging
        if (error instanceof Error) {
            console.error('Error details:', {
                message: error.message,
                stack: error.stack,
                clerkOrgId: orgData?.id
            });
        }

        throw error;
    }
}

async function handleOrganizationDelete(orgData: any) {
    const startTime = Date.now();

    try {
        const { id: clerkOrgId } = orgData;

        console.log(`🗑️ Processing organization deletion for clerkOrgId: ${clerkOrgId}`);

        // Delete the organization from the database
        await prisma.organization.delete({
            where: { id: clerkOrgId },
        });

        const processingTime = Date.now() - startTime;
        console.log(`✅ Organization deleted successfully in ${processingTime}ms: ${clerkOrgId}`);
    } catch (error) {
        const processingTime = Date.now() - startTime;
        console.error(`❌ Error deleting organization ${orgData?.id} after ${processingTime}ms:`, error);

        // Don't throw error for delete operations as the org might not exist
        console.log('⚠️ Organization might not exist in database, continuing...');
    }
}

async function handleOrganizationMembershipCreated(membershipData: any) {
    const startTime = Date.now();

    try {
        const {
            organization: { id: clerkOrgId },
            public_user_data: { user_id: clerkUserId },
        } = membershipData;

        console.log(`🔗 Processing organization membership created:`, {
            clerkUserId,
            clerkOrgId,
            timestamp: new Date().toISOString()
        });

        // Retry logic for fetching user
        const { result: user, attempts: userAttempts } = await retryOperation(
            () => prisma.user.findUnique({ where: { clerkId: clerkUserId } }),
            5, // maxAttempts
            1000, // delay
            'User fetch',
            clerkUserId
        );

        if (!user) {
            console.log(`❌ User not found after ${userAttempts} attempts for clerkId: ${clerkUserId}`);
            console.log(`   This might indicate a race condition or the user was never created`);
            return;
        }

        // Retry logic for fetching organization
        const { result: organization, attempts: orgAttempts } = await retryOperation(
            () => prisma.organization.findUnique({ where: { id: clerkOrgId } }),
            5, // maxAttempts
            1000, // delay
            'Organization fetch',
            clerkOrgId
        );

        if (!organization) {
            console.log(`❌ Organization not found after ${orgAttempts} attempts for clerkOrgId: ${clerkOrgId}`);
            console.log(`   This might indicate a race condition or the organization was never created`);
            return;
        }

        // Create the organization-user relationship
        const membership = await prisma.organizationUser.upsert({
            where: {
                userId_organizationId: {
                    userId: user.id,
                    organizationId: organization.id,
                }
            },
            update: {
                // No updates needed for existing membership
            },
            create: {
                userId: user.id,
                organizationId: organization.id,
            }
        });

        console.log(`✅ Organization membership created: User ${user.id} added to organization ${organization.id}`);

        // Optionally set this as the user's current organization if they don't have one
        if (!user.currentOrganizationId) {
            try {
                await prisma.user.update({
                    where: { id: user.id },
                    data: { currentOrganizationId: organization.id }
                });
                console.log(`🎯 Set organization ${organization.id} as current for user ${user.id}`);
            } catch (currentOrgError) {
                console.error(`⚠️ Error setting current organization for user ${user.id}:`, currentOrgError);
                // Don't throw - this is optional functionality
            }
        }

        const processingTime = Date.now() - startTime;
        console.log(`✅ Organization membership creation completed in ${processingTime}ms`);

        return membership;
    } catch (error) {
        const processingTime = Date.now() - startTime;
        console.error(`❌ Error creating organization membership after ${processingTime}ms:`, error);

        // Log specific error details for debugging
        if (error instanceof Error) {
            console.error('Error details:', {
                message: error.message,
                stack: error.stack,
                membershipData: {
                    clerkUserId: membershipData?.public_user_data?.user_id,
                    clerkOrgId: membershipData?.organization?.id
                }
            });
        }

        throw error;
    }
}

async function handleOrganizationMembershipDeleted(membershipData: any) {
    const startTime = Date.now();

    try {
        const {
            organization: { id: clerkOrgId },
            public_user_data: { user_id: clerkUserId },
        } = membershipData;

        console.log(`🔗 Processing organization membership deleted:`, {
            clerkUserId,
            clerkOrgId,
            timestamp: new Date().toISOString()
        });

        // Retry logic for fetching user
        const { result: user, attempts: userAttempts } = await retryOperation(
            () => prisma.user.findUnique({ where: { clerkId: clerkUserId } }),
            5, // maxAttempts
            1000, // delay
            'User fetch',
            clerkUserId
        );

        if (!user) {
            console.log(`❌ User not found after ${userAttempts} attempts for clerkId: ${clerkUserId}`);
            console.log(`   This might indicate a race condition or the user was never created`);
            return;
        }

        // Retry logic for fetching organization
        const { result: organization, attempts: orgAttempts } = await retryOperation(
            () => prisma.organization.findUnique({ where: { id: clerkOrgId } }),
            5, // maxAttempts
            1000, // delay
            'Organization fetch',
            clerkOrgId
        );

        if (!organization) {
            console.log(`❌ Organization not found after ${orgAttempts} attempts for clerkOrgId: ${clerkOrgId}`);
            console.log(`   This might indicate a race condition or the organization was never created`);
            return;
        }

        // Delete the organization-user relationship
        await prisma.organizationUser.delete({
            where: {
                userId_organizationId: {
                    userId: user.id,
                    organizationId: organization.id,
                }
            }
        });

        // If this was the user's current organization, clear it
        await prisma.user.updateMany({
            where: {
                id: user.id,
                currentOrganizationId: organization.id
            },
            data: {
                currentOrganizationId: null
            }
        });

        const processingTime = Date.now() - startTime;
        console.log(`✅ Organization membership deleted in ${processingTime}ms: User ${user.id} removed from organization ${organization.id}`);
    } catch (error) {
        const processingTime = Date.now() - startTime;
        console.error(`❌ Error deleting organization membership after ${processingTime}ms:`, error);

        // Don't throw error for delete operations as the membership might not exist
        console.log('⚠️ Organization membership might not exist in database, continuing...');
    }
}
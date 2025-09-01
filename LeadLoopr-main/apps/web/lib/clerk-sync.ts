import { prisma } from '@repo/database';
import { currentUser } from '@clerk/nextjs/server';

export interface ClerkUserData {
    id: string;
    firstName?: string | null;
    lastName?: string | null;
    emailAddresses?: Array<{
        id: string;
        emailAddress: string;
        verification?: {
            status: string;
        } | null;
    }>;
    primaryEmailAddressId?: string | null;
    imageUrl?: string | null;
    externalAccounts?: Array<{
        verification?: {
            status: string;
        } | null;
    }>;
}

/**
 * Syncs a Clerk user with the Prisma database
 * Only creates new users if their email is verified
 */
export async function syncClerkUser(userData: ClerkUserData) {
    try {
        const {
            id: clerkId,
            firstName,
            lastName,
            emailAddresses,
            primaryEmailAddressId,
            imageUrl,
            externalAccounts,
        } = userData;

        // Get the primary email address
        const primaryEmail = emailAddresses?.find((email) => email.id === primaryEmailAddressId);
        const email = primaryEmail?.emailAddress;

        // Determine if the email is verified (for OAuth and email signups)
        const isEmailVerified =
            emailAddresses?.some((email) => email.id === primaryEmailAddressId && email.verification?.status === 'verified') ||
            externalAccounts?.some((account) => account.verification?.status === 'verified');

        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
            where: { clerkId },
        });

        if (existingUser) {
            // User exists, always update (but only if we have an email)
            if (email) {
                const user = await prisma.user.update({
                    where: { clerkId },
                    data: {
                        firstName: firstName || null,
                        lastName: lastName || null,
                        email: email,
                        imageUrl: imageUrl || null,
                        updatedAt: new Date(),
                    },
                });
                console.log(`User updated successfully: ${user.id}`);
                return user;
            } else {
                console.log(`Skipping user update - no email available for clerkId: ${clerkId}`);
                return existingUser;
            }
        } else {
            // User doesn't exist, only create if email is verified and available
            if (isEmailVerified && email) {
                const user = await prisma.user.create({
                    data: {
                        clerkId,
                        firstName: firstName || null,
                        lastName: lastName || null,
                        email: email,
                        imageUrl: imageUrl || null,
                    },
                });
                console.log(`User created successfully: ${user.id}`);
                return user;
            } else {
                console.log(`Skipping user creation - email not verified or not available for clerkId: ${clerkId}`);
                return null;
            }
        }
    } catch (error) {
        console.error('Error syncing user:', error);
        throw error;
    }
}

/**
 * Gets the current user from Clerk and syncs them with the database
 * Only creates new users if their email is verified
 */
export async function syncCurrentUser() {
    try {
        const user = await currentUser();

        if (!user) {
            throw new Error('No authenticated user found');
        }

        const syncedUser = await syncClerkUser(user);

        if (!syncedUser) {
            throw new Error('Failed to sync user with database');
        }

        // Get the user with their current organization
        const userWithOrganization = await prisma.user.findUnique({
            where: { id: syncedUser.id },
            include: {
                currentOrganization: true
            }
        });

        return userWithOrganization;
    } catch (error) {
        console.error('Error syncing current user:', error);
        throw error;
    }
}

/**
 * Gets a user from the database by their Clerk ID
 */
export async function getUserByClerkId(clerkId: string) {
    try {
        return await prisma.user.findUnique({
            where: { clerkId },
        });
    } catch (error) {
        console.error('Error getting user by Clerk ID:', error);
        throw error;
    }
}

/**
 * Gets a user from the database by their email
 */
export async function getUserByEmail(email: string) {
    try {
        return await prisma.user.findUnique({
            where: { email },
        });
    } catch (error) {
        console.error('Error getting user by email:', error);
        throw error;
    }
} 
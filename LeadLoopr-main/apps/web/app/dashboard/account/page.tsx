import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { syncCurrentUser } from '@/lib/clerk-sync'
import { AccountInformationCard } from '@/components/account/AccountInformationCard'
import { BillingCard } from '@/components/account/BillingCard'
import { TeamMembersCard } from '@/components/account/TeamMembersCard'


export default async function AccountPage() {
    const { userId } = await auth()

    if (!userId) {
        redirect('/auth/sign-in')
    }

    // Sync user with database and get user data
    const user = await syncCurrentUser()

    if (!user) {
        redirect('/auth/sign-in')
    }

    return (
        <div className="min-h-screen bg-background p-6">
            <div className="max-w-7xl mx-auto">
                <div className="flex items-center justify-between mb-6">
                    <h1 className="text-2xl font-bold text-foreground">Account</h1>
                </div>

                {/* Account Information Section */}
                <div className="mb-8">
                    <AccountInformationCard user={user} />
                </div>

                <div className="grid gap-8 lg:grid-cols-2">
                    {/* Team Members Section */}
                    <div>
                        <TeamMembersCard />
                    </div>

                    {/* Billing Section */}
                    <div>
                        <BillingCard />
                    </div>
                </div>
            </div>
        </div>
    )
} 
// app/dashboard/layout.tsx
import { AppSidebar } from "@/components/layout/app-sidebar";
import { OrganizationCheck } from "@/components/organization/OrganizationCheck";
import { SubscriptionGuard } from "@/components/subscription/SubscriptionGuard";


export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <OrganizationCheck>
            <SubscriptionGuard>
                <div className="flex h-screen bg-background">
                    <AppSidebar />
                    <main className="flex-1 overflow-auto">
                        {children}
                    </main>
                </div>
            </SubscriptionGuard>
        </OrganizationCheck>
    );
}
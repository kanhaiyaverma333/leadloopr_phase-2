import { AppSidebar } from "@/components/layout/app-sidebar";
import { OrganizationCheck } from "@/components/organization/OrganizationCheck";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <OrganizationCheck>
            <div className="flex h-screen bg-background">
                <AppSidebar />
                <main className="flex-1 overflow-auto">
                    {children}
                </main>
            </div>
        </OrganizationCheck>
    );
} 
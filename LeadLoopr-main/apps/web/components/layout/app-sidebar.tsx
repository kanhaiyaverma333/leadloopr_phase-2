'use client'

import {
    Building2,
    Calendar,
    ChevronDown,
    CreditCard,
    Globe,
    LayoutDashboard,
    Settings,
    Users,
    Zap,
} from "lucide-react";
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from "@/components/ui/sidebar";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useClerk } from "@clerk/nextjs";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useState, useCallback } from "react";
import { OrganizationSwitcher } from "@/components/organization/OrganizationSwitcher";

// Navigation items
const navigationItems = [
    {
        title: "Dashboard",
        url: "/dashboard",
        icon: LayoutDashboard,
    },
    {
        title: "Lead pipeline",
        url: "/dashboard/lead-pipeline",
        icon: Calendar,
    },
    {
        title: "CRM",
        url: "/dashboard/crm",
        icon: Users,
    },
    {
        title: "Integrations",
        url: "/dashboard/integrations",
        icon: Zap,
    },
    {
        title: "Account",
        url: "/dashboard/account",
        icon: Settings,
    },
];

export function AppSidebar() {
    const { signOut } = useClerk();
    const router = useRouter();
    const pathname = usePathname();
    const [isNavigating, setIsNavigating] = useState(false);

    const handleSignOut = useCallback(async () => {
        setIsNavigating(true);
        try {
            await signOut();
            router.push('/');
        } finally {
            setIsNavigating(false);
        }
    }, [signOut, router]);

    const handleAccountNavigation = useCallback(async () => {
        setIsNavigating(true);
        try {
            await router.push('/dashboard/account');
        } finally {
            setIsNavigating(false);
        }
    }, [router]);

    return (
        <Sidebar className="items-center">
            <SidebarHeader className="flex flex-col items-center justify-center h-28 px-0 mb-2">
                {/* Placeholder SVG logo, replace with your own */}
                <div className="w-12 h-12 rounded-full flex items-center justify-center bg-gradient-to-br from-blue-400 to-blue-600 mb-2">
                    <svg width="32" height="32" viewBox="0 0 32 32" fill="none"><circle cx="16" cy="16" r="16" fill="#fff" /></svg>
                </div>
                <span className="text-2xl font-bold tracking-wide text-muted-foreground">LeadLoopr</span>
            </SidebarHeader>

            <SidebarContent>
                <SidebarGroup>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {navigationItems.map((item) => {
                                const isActive = pathname === item.url || (item.url !== '/dashboard' && pathname?.startsWith(item.url));
                                return (
                                    <SidebarMenuItem key={item.title}>
                                        <Link
                                            href={item.url}
                                            prefetch={true}
                                            className="block w-full"
                                        >
                                            <SidebarMenuButton
                                                className={`flex items-center gap-4 px-4 py-3 text-lg font-semibold transition-colors w-full justify-start rounded-2xl ${isActive
                                                        ? 'bg-accent text-accent-foreground'
                                                        : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                                                    } ${isNavigating ? 'opacity-75' : ''}`}
                                                style={{ minHeight: 56 }}
                                                onMouseEnter={() => router.prefetch(item.url)}
                                            >
                                                <div className="bg-card rounded-xl p-2">
                                                    <item.icon className={`w-6 h-6 ${isActive ? 'stroke-[2.5]' : 'stroke-2'}`} />
                                                </div>
                                                <span className="leading-none">{item.title}</span>
                                            </SidebarMenuButton>
                                        </Link>
                                    </SidebarMenuItem>
                                );
                            })}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>

            <SidebarFooter className="flex flex-col items-center w-full mt-auto">
                <div className="w-full px-2 mb-2">
                    <OrganizationSwitcher />
                </div>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <button
                            className={`flex items-center gap-3 w-full p-2 rounded-2xl bg-accent hover:bg-accent/80 transition-colors ${isNavigating ? 'opacity-75 cursor-not-allowed' : ''
                                }`}
                            disabled={isNavigating}
                        >
                            <div className="w-9 h-9 bg-muted rounded-lg flex items-center justify-center">
                                <Building2 className="w-5 h-5 text-muted-foreground" />
                            </div>
                            <div className="flex flex-col items-start leading-none">
                                <span className="text-xs text-muted-foreground">Account</span>
                                <span className="text-base font-medium text-foreground">
                                    Settings
                                </span>
                            </div>
                            <ChevronDown className="w-5 h-5 ml-auto text-muted-foreground" />
                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-56">
                        <DropdownMenuItem
                            onClick={handleAccountNavigation}
                            disabled={isNavigating}
                        >
                            Account Settings
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            onClick={handleSignOut}
                            disabled={isNavigating}
                        >
                            Sign Out
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </SidebarFooter>
        </Sidebar>
    );
}
'use client'

import { IntegrationsList, integrations } from "@/components/integrations";

export default function IntegrationsPage() {
    return (
        <div className="min-h-screen bg-background p-6">
            <div className="max-w-7xl mx-auto">
                <div className="flex items-center justify-between mb-6">
                    <h1 className="text-2xl font-bold text-foreground">Integrations</h1>
                </div>
                <IntegrationsList integrations={integrations} />
            </div>
        </div>
    );
} 
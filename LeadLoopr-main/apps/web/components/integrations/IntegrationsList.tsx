'use client'

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { IntegrationCard } from "./IntegrationCard";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Integration {
    id: string;
    name: string;
    description: string;
    icon: string;
    added: boolean;
    route: (orgId: string) => string;
}

interface IntegrationsListProps {
    integrations: {
        incoming: Integration[];
        outgoing: Integration[];
    };
}

export const IntegrationsList = ({ integrations }: IntegrationsListProps) => {
    return (
        <Tabs defaultValue="incoming" className="w-full">
            <TabsList className="grid w-full max-w-md grid-cols-2 mb-8">
                <TabsTrigger value="incoming">
                    Incoming
                </TabsTrigger>
                <TabsTrigger value="outgoing">
                    Outgoing
                </TabsTrigger>
            </TabsList>

            <TabsContent value="incoming" className="space-y-0">
                <div className="space-y-4">
                    {integrations.incoming.map((integration) => (
                        <IntegrationCard key={integration.id} integration={integration} />
                    ))}
                    <Card>
                        <CardContent className="p-6 flex items-center gap-4">
                            <div className="flex flex-col items-center justify-center w-12 h-12 bg-blue-100 rounded-lg">
                                <span role="img" aria-label="rocket" className="text-2xl">🚀</span>
                            </div>
                            <div className="flex-1">
                                <Badge variant="secondary" className="mb-2">Coming Soon</Badge>
                                <h3 className="font-semibold text-foreground mb-1">More integrations coming soon</h3>
                                <p className="text-sm text-muted-foreground leading-relaxed">
                                    We are actively working to add more incoming integrations to make your life easier. Stay tuned!
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </TabsContent>

            <TabsContent value="outgoing" className="space-y-0">
                <div className="space-y-4">
                    {integrations.outgoing.map((integration) => (
                        <IntegrationCard key={integration.id} integration={integration} />
                    ))}
                </div>
            </TabsContent>
        </Tabs>
    );
}; 
// app/integrations/page.tsx or components/IntegrationsPage.tsx
'use client'

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
// Update the import path below if the actual path is different

import { IntegrationsList } from '@/components/integrations/IntegrationsList';
import { integrations } from '@/components/integrations/integrations-data';


const useToast = () => ({
  toast: ({ title, description, variant }: { title: string; description: string; variant?: string }) => {
    console.log(`[${variant || "info"}] ${title}: ${description}`);
  }
});

export default function IntegrationsPage() {

  const searchParams = useSearchParams();
  const { toast } = useToast();

  useEffect(() => {
    const success = searchParams?.get('success');
    const error = searchParams?.get('error');

    if (success === 'google_ads_connected') {
      toast({
        title: "Google Ads Connected!",
        description: "Your Google Ads integration has been successfully connected.",
        variant: "default",
      });

      // Clean up URL
      window.history.replaceState({}, '', '/integrations');
    }

    if (error) {
      let errorMessage = "An error occurred while connecting the integration.";

      switch (error) {
        case 'oauth_denied':
          errorMessage = "OAuth access was denied. Please try again and grant the necessary permissions.";
          break;
        case 'missing_params':
          errorMessage = "Missing required parameters. Please try connecting again.";
          break;
        case 'invalid_state':
          errorMessage = "Invalid state parameter. This might be a security issue. Please try again.";
          break;
        case 'token_exchange_failed':
          errorMessage = "Failed to exchange authorization code for tokens. Please try again.";
          break;
        case 'no_refresh_token':
          errorMessage = "No refresh token received. Please revoke access in your Google account and try again.";
          break;
        case 'callback_failed':
          errorMessage = "OAuth callback failed. Please check your configuration and try again.";
          break;
      }

      toast({
        title: "Connection Failed",
        description: errorMessage,
        variant: "destructive",
      });

      // Clean up URL
      window.history.replaceState({}, '', '/integrations');
    }
  }, [searchParams, toast]);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Integrations</h1>
          <p className="text-muted-foreground">
            Connect your favorite tools and platforms to streamline your workflow.
          </p>
        </div>

        <IntegrationsList integrations={integrations} />
      </div>
    </div>
  );
}
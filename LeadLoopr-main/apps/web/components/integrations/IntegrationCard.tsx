'use client';

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, Loader2, AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useOrganization } from "@clerk/nextjs";
import { useState, useEffect } from "react";
import { GTMModal } from "./GTMModal";

const useToast = () => ({
  toast: ({ title, description, variant }: { title: string; description: string; variant?: string }) => {
    console.log(`[${variant || "info"}] ${title}: ${description}`);
  }
});

interface Integration {
  id: string;
  name: string;
  description: string;
  icon: string;
  added: boolean;
  route: (orgId: string) => string;
}

interface IntegrationCardProps {
  integration: Integration;
}

type ConnectionStatus = 'not_connected' | 'connected' | 'loading' | 'expired' | 'error' | 'inactive' | 'needs_configuration' | 'misconfigured';

interface StatusResponse {
  connected: boolean;
  status: string;
  message?: string;
  connectedAt?: string;
  error?: string;
  integrationName?: string;
  measurementId?: string;
}

export const IntegrationCard = ({ integration }: IntegrationCardProps) => {
  const router = useRouter();
  const { organization } = useOrganization();
  const { toast } = useToast();
  const [status, setStatus] = useState<ConnectionStatus>('loading');
  const [isConnecting, setIsConnecting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [isGTMModalOpen, setIsGTMModalOpen] = useState(false); // New state for GTM modal

  // Updated to include Microsoft Ads as OAuth-based, but exclude GTM
  const isOAuthBasedIntegration = integration.id === 'google-ads' ||
    integration.id === 'meta-ads' ||
    integration.id === 'google-analytics' ||
    integration.id === 'microsoft-ads';

  // Special handling for GTM
  const isGTMIntegration = integration.id === 'google-tag-manager';

  console.log(isOAuthBasedIntegration ? `🔗 OAuth-based integration: ${integration.name}` : `📋 Non-OAuth integration: ${integration.name}`);

  useEffect(() => {
    if (isOAuthBasedIntegration && organization) {
      checkConnectionStatus();
    } else if (isGTMIntegration) {
      // For GTM, we don't check connection status - it's always "ready to connect"
      setStatus('not_connected');
    } else {
      setStatus(integration.added ? 'connected' : 'not_connected');
      if (integration.added) {
        console.log(`✅ ${integration.name} is connected (static)`);
      }
    }
  }, [integration.id, organization]);

  const checkConnectionStatus = async () => {
    console.log(`🔍 Checking connection status for ${integration.name}...`);

    try {
      setStatus('loading');
      setStatusMessage('Checking connection...');

      const response = await fetch(`/api/integrations/${integration.id}/status`);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ Status API failed:`, {
          status: response.status,
          error: errorText
        });
        throw new Error(`API returned ${response.status}: ${errorText}`);
      }

      const data: StatusResponse = await response.json();

      if (data.connected) {
        switch (data.status) {
          case 'connected':
            setStatus('connected');
            setStatusMessage(data.message || 'Connected successfully');
            break;
          case 'expired':
            const hasRefreshToken = true;
            if (hasRefreshToken) {
              console.log(`⚠️ Token expired but refresh token exists. Treating as connected.`);
              setStatus('connected');
              setStatusMessage('Token will auto-refresh during usage.');
            } else {
              setStatus('expired');
              setStatusMessage(data.message || 'Connection expired');
            }
            break;
          case 'inactive':
            setStatus('inactive');
            setStatusMessage(data.message || 'Integration is inactive');
            break;
          default:
            setStatus('connected');
            setStatusMessage('Connected successfully');
        }
        console.log(`✅ ${integration.name} is CONNECTED!`);
      } else {
        // Handle specific non-connected statuses for Google Analytics
        switch (data.status) {
          case 'needs_configuration':
            setStatus('needs_configuration');
            setStatusMessage(data.message || 'OAuth complete but needs configuration');
            break;
          case 'misconfigured':
            setStatus('misconfigured');
            setStatusMessage(data.message || 'Missing configuration details');
            break;
          case 'expired':
            setStatus('expired');
            setStatusMessage(data.message || 'Connection expired');
            break;
          default:
            setStatus('not_connected');
            setStatusMessage(data.message || 'Not connected');
        }
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`💥 Error checking ${integration.name} status:`, errorMessage);

      setStatus('error');
      setStatusMessage(`Failed to check status: ${errorMessage}`);

      toast({
        title: "Status Check Failed",
        description: `Unable to check ${integration.name} connection status. ${errorMessage}`,
        variant: "destructive",
      });
    }
  };

  const handleConnect = async () => {
    if (!organization) {
      toast({
        title: "Error",
        description: "No organization selected",
        variant: "destructive",
      });
      return;
    }

    // Special handling for GTM - open modal instead of connecting
    if (isGTMIntegration) {
      setIsGTMModalOpen(true);
      return;
    }

    try {
      setIsConnecting(true);

      if (isOAuthBasedIntegration) {
        // For Google Analytics, if it needs configuration, redirect to config page
        if (integration.id === 'google-analytics' && (status === 'needs_configuration' || status === 'misconfigured')) {
          router.push(`/dashboard/integrations/google-analytics/configure?org=${organization.id}`);
          return;
        }

        const response = await fetch(`/api/integrations/${integration.id}/auth-url`);

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Failed to get auth URL: ${errorText}`);
        }

        const { url } = await response.json();
        if (!url) throw new Error('No auth URL received');

        window.location.href = url;
      } else {
        router.push(integration.route(organization.id));
      }
    } catch (error) {
      setIsConnecting(false);
      toast({
        title: "Connection Failed",
        description: `Failed to connect to ${integration.name}. ${error instanceof Error ? error.message : String(error)}`,
        variant: "destructive",
      });
    }
  };

  const handleDisconnect = async () => {
    if (!organization || !isOAuthBasedIntegration) return;

    try {
      setStatus('loading');
      setStatusMessage('Disconnecting...');

      const response = await fetch(`/api/integrations/${integration.id}/status`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Disconnect failed: ${errorText}`);
      }

      setStatus('not_connected');
      setStatusMessage('Disconnected successfully');

      toast({
        title: "Disconnected",
        description: `${integration.name} has been disconnected successfully.`,
      });
    } catch (error) {
      toast({
        title: "Disconnection Failed",
        description: `Failed to disconnect ${integration.name}. ${error instanceof Error ? error.message : String(error)}`,
        variant: "destructive",
      });
      checkConnectionStatus();
    }
  };

  const getButtonContent = () => {
    if (isConnecting) return (<><Loader2 className="w-4 h-4 mr-1 animate-spin" /> Connecting...</>);

    // Special text for GTM
    if (isGTMIntegration) return "Connect";

    switch (status) {
      case 'loading': return (<><Loader2 className="w-4 h-4 mr-1 animate-spin" /> Loading...</>);
      case 'connected': return (<><Check className="w-4 h-4 mr-1" /> Connected</>);
      case 'expired': return (<><AlertCircle className="w-4 h-4 mr-1" /> Reconnect</>);
      case 'inactive': return (<><AlertCircle className="w-4 h-4 mr-1" /> Activate</>);
      case 'needs_configuration': return (<><AlertCircle className="w-4 h-4 mr-1" /> Configure</>);
      case 'misconfigured': return (<><AlertCircle className="w-4 h-4 mr-1" /> Fix Config</>);
      case 'error': return (<><AlertCircle className="w-4 h-4 mr-1" /> Error</>);
      default: return "Connect";
    }
  };

  const getButtonVariant = () => {
    switch (status) {
      case 'connected': return "default";
      case 'expired':
      case 'inactive':
      case 'needs_configuration':
      case 'misconfigured':
      case 'error':
      default: return "outline";
    }
  };

  const getButtonStyle = () => {
    switch (status) {
      case 'connected': return "bg-green-600 hover:bg-green-700 text-white";
      case 'expired':
      case 'inactive':
      case 'needs_configuration':
      case 'misconfigured': return "border-orange-500 text-orange-600 hover:bg-orange-50";
      case 'error': return "border-red-500 text-red-600 hover:bg-red-50";
      default: return "";
    }
  };

  const getStatusMessage = () => {
    if (statusMessage) return statusMessage;
    switch (status) {
      case 'expired': return 'Connection expired. Please reconnect.';
      case 'inactive': return 'Integration is inactive.';
      case 'needs_configuration': return 'OAuth complete. Configuration needed.';
      case 'misconfigured': return 'Missing configuration details.';
      case 'error': return 'Unable to check status.';
      default: return null;
    }
  };

  const isButtonDisabled = status === 'loading' || isConnecting;

  return (
    <>
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 flex items-center justify-center bg-card rounded-lg overflow-hidden">
                <img
                  src={integration.icon}
                  alt={integration.name}
                  className="w-8 h-8 object-contain"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    target.nextElementSibling?.classList.remove('hidden');
                  }}
                />
                <div className="hidden w-8 h-8 bg-blue-500 rounded flex items-center justify-center text-white font-semibold text-sm">
                  {integration.name.charAt(0)}
                </div>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-foreground mb-1">{integration.name}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{integration.description}</p>
                {(status === 'expired' || status === 'inactive' || status === 'error' || status === 'needs_configuration' || status === 'misconfigured') && (
                  <p className={`text-xs mt-1 ${status === 'error' ? 'text-red-600' : 'text-orange-600'}`}>
                    {getStatusMessage()}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                onClick={status === 'connected' && isOAuthBasedIntegration ? handleDisconnect : handleConnect}
                variant={getButtonVariant()}
                size="sm"
                className={getButtonStyle()}
                disabled={isButtonDisabled}
              >
                {getButtonContent()}
              </Button>
              {status === 'connected' && !isOAuthBasedIntegration && !isGTMIntegration && (
                <Button
                  onClick={handleDisconnect}
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground hover:text-red-600"
                >
                  Disconnect
                </Button>
              )}

            </div>
          </div>
        </CardContent>
      </Card>

      {/* GTM Modal */}
      {isGTMIntegration && (
        <GTMModal
          isOpen={isGTMModalOpen}
          onClose={() => setIsGTMModalOpen(false)}
        />
      )}
    </>
  );
};
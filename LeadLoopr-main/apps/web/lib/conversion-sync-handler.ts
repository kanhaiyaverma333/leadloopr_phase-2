import { toast } from "sonner";

// Types for the utility
export interface LeadStatusHandlerParams {
  leadId: string;
  status: 'qualified' | 'won' | 'lost';
  columns: Array<{ id: string; title: string }>;
  formData: {
    gclid?: string | null;
    fbclid?: string | null;
    msclkid?: string | null; // Added Microsoft Click ID
    [key: string]: any;
  };
  refreshLeads: () => void | Promise<void>;
  onClose: () => void;
  setStatusLoading: (status: string | null) => void;
}

export interface LeadStatusHandlerReturn {
  handleLeadStatusChange: (
    leadId: string,
    status: 'qualified' | 'won' | 'lost'
  ) => Promise<void>;
}

export const createLeadStatusHandler = (params: LeadStatusHandlerParams): LeadStatusHandlerReturn => {
  const { columns, formData, refreshLeads, onClose, setStatusLoading } = params;

  const handleLeadStatusChange = async (
    leadId: string,
    status: 'qualified' | 'won' | 'lost',
  ) => {
    setStatusLoading(status);

    // Helper to update stage
    const updateLeadStage = async () => {
      const matchingColumn = columns.find((col) => col.title.toLowerCase() === status.toLowerCase());
      if (matchingColumn) {
        const newStageId = matchingColumn.id;
        await fetch('/api/leads/update-stage', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ leadId, newStageId }),
        });
        await refreshLeads();
        onClose();
      }
    };

    try {
      // Handle "lost" (no sync needed for ads, but sync GA4 if available)
      if (status === 'lost') {
        // Try to sync GA4 event
        try {
          const gaResponse = await fetch('/api/integrations/google-analytics/sync-event', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ leadId, eventType: 'lead_lost' }),
          });

          if (gaResponse.ok) {
            const gaResult = await gaResponse.json();
            if (gaResult.success) {
              console.log(`Lead marked as LOST and synced to Google Analytics`);
              toast.success(`Lead marked as LOST and synced to Google Analytics`);
            } else {
              console.log(`Lead marked as LOST (Google Analytics sync failed)`);
              toast.success(`Lead marked as LOST`);
            }
          } else {
            console.log(`Lead marked as LOST (Google Analytics not configured)`);
            toast.success(`Lead marked as LOST`);
          }
        } catch (error) {
          console.log(`Lead marked as LOST (Google Analytics sync failed)`);
          toast.success(`Lead marked as LOST`);
        }

        await updateLeadStage();
        return;
      }

      // Prepare sync for qualified/won
      type SyncResult = {
        platform: string;
        success: boolean;
        error?: string;
      };

      const syncPromises: Promise<SyncResult>[] = [];

      // Google Ads sync (existing logic)
      if (formData.gclid) {
        syncPromises.push(
          fetch('/api/integrations/google-ads/conversion', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ leadId }),
          })
            .then(async (res): Promise<SyncResult> => {
              const contentType = res.headers.get('content-type') || '';
              let result: any = null;

              if (contentType.includes('application/json')) {
                result = await res.json();
              } else {
                const fallbackText = await res.text();
                console.warn("Non-JSON response from Google Ads server:", fallbackText.slice(0, 200));
                throw new Error('Google Ads API returned non-JSON response');
              }

              if (!res.ok || !result.success) {
                throw new Error(`Google Ads: ${result?.error || 'Conversion failed'}`);
              }

              return { platform: 'Google Ads', success: true };
            })
            .catch((error): SyncResult => ({
              platform: 'Google Ads',
              success: false,
              error: error.message,
            }))
        );
      }

      // Meta Ads sync (existing logic)
      if (formData.fbclid) {
        syncPromises.push(
          fetch('/api/integrations/meta-ads/conversion', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ leadId }),
          })
            .then(async (res): Promise<SyncResult> => {
              const contentType = res.headers.get('content-type') || '';
              let result: any = null;

              if (contentType.includes('application/json')) {
                result = await res.json();
              } else {
                const fallbackText = await res.text();
                console.warn("Non-JSON response from Meta Ads server:", fallbackText.slice(0, 200));
                throw new Error('Meta Ads API returned non-JSON response');
              }

              if (!res.ok || !result.success) {
                throw new Error(`Meta Ads: ${result?.error || 'Conversion failed'}`);
              }

              return { platform: 'Meta Ads', success: true };
            })
            .catch((error): SyncResult => ({
              platform: 'Meta Ads',
              success: false,
              error: error.message,
            }))
        );
      }

      // Microsoft Ads sync (NEW)
      if (formData.msclkid) {
        syncPromises.push(
          fetch('/api/integrations/microsoft-ads/conversion', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ leadId }),
          })
            .then(async (res): Promise<SyncResult> => {
              const contentType = res.headers.get('content-type') || '';
              let result: any = null;

              if (contentType.includes('application/json')) {
                result = await res.json();
              } else {
                const fallbackText = await res.text();
                console.warn("Non-JSON response from Microsoft Ads server:", fallbackText.slice(0, 200));
                throw new Error('Microsoft Ads API returned non-JSON response');
              }

              if (!res.ok || !result.success) {
                throw new Error(`Microsoft Ads: ${result?.error || 'Conversion failed'}`);
              }

              return { platform: 'Microsoft Ads', success: true };
            })
            .catch((error): SyncResult => ({
              platform: 'Microsoft Ads',
              success: false,
              error: error.message,
            }))
        );
      }

      // Google Analytics sync (existing)
      const eventType = status === 'qualified' ? 'lead_qualified' : 'lead_won';
      syncPromises.push(
        fetch('/api/integrations/google-analytics/sync-event', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ leadId, eventType }),
        })
          .then(async (res): Promise<SyncResult> => {
            const contentType = res.headers.get('content-type') || '';
            let result: any = null;

            if (contentType.includes('application/json')) {
              result = await res.json();
            } else {
              const fallbackText = await res.text();
              console.warn("Non-JSON response from Google Analytics server:", fallbackText.slice(0, 200));
              throw new Error('Google Analytics API returned non-JSON response');
            }

            if (!res.ok || !result.success) {
              // If GA4 is not configured, don't treat it as an error
              if (result?.error?.includes('not connected') || result?.error?.includes('not configured')) {
                console.log('Google Analytics not configured - skipping sync');
                return { platform: 'Google Analytics', success: true, error: 'not_configured' };
              }
              throw new Error(`Google Analytics: ${result?.error || 'Event sync failed'}`);
            }

            return { platform: 'Google Analytics', success: true };
          })
          .catch((error): SyncResult => ({
            platform: 'Google Analytics',
            success: false,
            error: error.message,
          }))
      );

      // Run all syncs
      const results = await Promise.all(syncPromises);
      
      // Filter out GA4 "not configured" results from success/failure counts
      const relevantResults = results.filter(r => r.error !== 'not_configured');
      const successfulSyncs = relevantResults.filter((r) => r.success);
      const failedSyncs = relevantResults.filter((r) => !r.success);
      const gaConfigured = results.find(r => r.platform === 'Google Analytics' && r.error !== 'not_configured');

      // Build success message
      let platforms: string[] = [];
      if (formData.gclid && successfulSyncs.find(r => r.platform === 'Google Ads')) {
        platforms.push('Google Ads');
      }
      if (formData.fbclid && successfulSyncs.find(r => r.platform === 'Meta Ads')) {
        platforms.push('Meta Ads');
      }
      if (formData.msclkid && successfulSyncs.find(r => r.platform === 'Microsoft Ads')) {
        platforms.push('Microsoft Ads');
      }
      if (gaConfigured && successfulSyncs.find(r => r.platform === 'Google Analytics')) {
        platforms.push('Google Analytics');
      }

      if (platforms.length > 0) {
        const platformsText = platforms.join(' and ');
        console.log(`Lead marked as ${status.toUpperCase()} and synced to ${platformsText}`);
        toast.success(`Lead marked as ${status.toUpperCase()} and synced to ${platformsText}`);
      } else {
        console.log(`Lead marked as ${status.toUpperCase()} (no tracking IDs found or no integrations configured)`);
        toast.success(`Lead marked as ${status.toUpperCase()}`);
      }

      // Update stage regardless of sync results (as long as we don't have total failure)
      await updateLeadStage();

      // Show warnings for any failed syncs
      if (failedSyncs.length > 0) {
        const failedPlatforms = failedSyncs.map((r) => r.platform).join(' and ');
        console.warn(`Some syncs failed for ${failedPlatforms}`);
      }

    } catch (error: any) {
      console.error('Unexpected sync error:', error);
      toast.error(`Failed to process lead: ${error.message}`);
    } finally {
      setStatusLoading(null);
    }
  };

  return { handleLeadStatusChange };
};
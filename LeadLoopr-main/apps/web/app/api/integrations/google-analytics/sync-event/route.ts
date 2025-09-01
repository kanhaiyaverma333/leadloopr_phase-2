// app/api/integrations/google-analytics/sync-event/route.ts
import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "../../../../../../../packages/database/generated/client";

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { leadId, eventType } = await req.json();
    
    // Validate event type - added lead_qualified to existing types
    const validEventTypes = ['lead_open', 'lead_won', 'lead_lost', 'lead_qualified'];
    if (!leadId || !eventType || !validEventTypes.includes(eventType)) {
      return NextResponse.json(
        { success: false, error: "Missing or invalid leadId/eventType" },
        { status: 400 }
      );
    }

    // 1. Fetch lead and validate
    const lead = await prisma.lead.findUnique({ 
      where: { id: leadId },
      include: {
        organization: {
          include: {
            googleAnalyticsIntegration: true
          }
        }
      }
    });

    if (!lead) {
      return NextResponse.json(
        { success: false, error: "Lead not found" },
        { status: 404 }
      );
    }

    // 2. Check if GA4 integration exists and is configured
    const integration = lead.organization.googleAnalyticsIntegration;
    if (!integration || !integration.isActive || !integration.isConfigured) {
      return NextResponse.json(
        { success: false, error: "Google Analytics not connected or configured" },
        { status: 400 }
      );
    }

    if (!integration.measurementId || !integration.apiSecret) {
      return NextResponse.json(
        { success: false, error: "Missing GA4 configuration" },
        { status: 400 }
      );
    }

    // 3. Prepare event payload with full attribution support
    // Note: If attribution data is not available, GA4 will assign 
    // the event to "(not set)" in source/medium attribution. 
    // This behavior is expected with server-to-server Measurement Protocol.
    const eventPayload = {
      // Use GA Client ID when available for better attribution linking to original sessions
      client_id: lead.gaClientId || lead.id,
      events: [{
        name: eventType,
        parameters: {
          // Core event parameters
          event_category: 'lead_management',
          event_label: lead.id,
          
          // Session linking (if available) - helps connect events to original user sessions
          ...(lead.gaSessionId && { session_id: lead.gaSessionId }),
          
          // Lead value (if available)
          ...(lead.value && { 
            value: parseFloat(lead.value.toString()),
            currency: lead.currency || 'EUR'
          }),
          
          // Attribution parameters (UTM and traffic source data)
          ...(lead.utmSource && { source: lead.utmSource }),
          ...(lead.utmMedium && { medium: lead.utmMedium }),
          ...(lead.utmCampaign && { campaign: lead.utmCampaign }),
         // ...(lead.trafficSource && { traffic_source: lead.trafficSource }),
          
          // Standard GA4 parameters for better reporting
          ...(lead.referrerUrl && { page_referrer: lead.referrerUrl }),
          ...(lead.landingPageUrl && { page_location: lead.landingPageUrl }),
          ...(lead.path && { page_title: lead.path }),
          
          // Website context
          ...(lead.websiteUrl && { website_url: lead.websiteUrl }),
          
          // Additional lead context (custom parameters)
          ...(lead.priority && { custom_priority: lead.priority }),
          ...(lead.qualification && { custom_qualification: lead.qualification }),
          ...(lead.tags && lead.tags.length > 0 && { custom_tags: lead.tags.join(',') }),
         // ...(lead.campaign && { custom_campaign_name: lead.campaign }),
          
          // Platform tracking IDs (for cross-platform attribution)
          ...(lead.gclid && { gclid: lead.gclid }),
          ...(lead.fbclid && { fbclid: lead.fbclid }),
          ...(lead.li_fat_id && { li_fat_id: lead.li_fat_id }),
          ...(lead.msclkid && { msclkid: lead.msclkid }),
          
          // Additional context
          lead_status: eventType.replace('lead_', ''),
          timestamp: new Date().toISOString(),
          organization_id: lead.organizationId,
          
          // Note: We explicitly exclude PII data like email, phone, and personal names
          // to ensure GDPR/privacy compliance as required by the documentation
        }
      }]
    };

    console.log("📤 Sending event to Google Analytics:", {
      measurementId: integration.measurementId,
      eventType,
      leadId: lead.id,
      clientId: lead.gaClientId || lead.id,
      hasSessionId: !!lead.gaSessionId,
      hasAttribution: !!(lead.utmSource || lead.utmMedium || lead.utmCampaign),
      payload: eventPayload
    });

    // 4. OPTIONAL: Validate the event payload first (for debugging)
    try {
      const validationUrl = `https://www.google-analytics.com/debug/mp/collect?measurement_id=${integration.measurementId}&api_secret=${integration.apiSecret}`;
      const validationResponse = await fetch(validationUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(eventPayload),
      });
      const validationResult = await validationResponse.json();
      console.log("🔍 GA4 Validation result:", validationResult);
      
      // Log any validation issues but don't block the actual send
      if (validationResult.validationMessages && validationResult.validationMessages.length > 0) {
        console.warn("⚠️ GA4 validation warnings:", validationResult.validationMessages);
      }
    } catch (validationError) {
      console.log("⚠️ GA4 validation failed (non-blocking):", validationError);
    }

    // 5. Send to GA4 Measurement Protocol
    const response = await fetch(
      `https://www.google-analytics.com/mp/collect?measurement_id=${integration.measurementId}&api_secret=${integration.apiSecret}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(eventPayload),
      }
    );

    // GA4 Measurement Protocol returns 204 for successful requests
    if (!response.ok && response.status !== 204) {
      const errorText = await response.text();
      console.error("❌ GA4 sync failed:", {
        status: response.status,
        statusText: response.statusText,
        error: errorText,
      });

      return NextResponse.json(
        { success: false, error: "Google Analytics API failed", details: errorText },
        { status: 500 }
      );
    }

    // 6. Log successful sync with attribution details
    console.log("✅ Event successfully sent to Google Analytics:", {
      leadId: lead.id,
      eventType,
      measurementId: integration.measurementId,
      attribution: {
        source: lead.utmSource || '(not set)',
        medium: lead.utmMedium || '(not set)',
        campaign: lead.utmCampaign || '(not set)',
        //trafficSource: lead.trafficSource || '(not set)'
      },
      clientId: lead.gaClientId ? 'GA Client ID' : 'Lead ID fallback',
      sessionId: lead.gaSessionId ? 'Available' : 'Not available',
      value: lead.value || 'No value set'
    });

    // 7. Update lead with sync timestamp (optional tracking)
    await prisma.lead.update({
      where: { id: leadId },
      data: {
        // You could add a field to track GA4 sync if needed in your schema
        // ga4SyncedAt: new Date(),
        updatedAt: new Date()
      },
    });

    return NextResponse.json({ 
      success: true, 
      message: `Event '${eventType}' sent to Google Analytics successfully`,
      eventType,
      leadId,
      attribution: {
        hasSource: !!lead.utmSource,
        hasMedium: !!lead.utmMedium,
        hasCampaign: !!lead.utmCampaign,
        hasGaClientId: !!lead.gaClientId,
        hasSessionId: !!lead.gaSessionId
      }
    });

  } catch (error) {
    console.error("❌ Error syncing event to Google Analytics:", error);
    return NextResponse.json({ 
      success: false, 
      error: "Server error" 
    }, { status: 500 });
  }
}
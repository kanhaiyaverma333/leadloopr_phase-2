import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "../../../../../../../packages/database/generated/client";
import { getValidAccessToken } from "@/lib/meta-ads/getValidAccessToken"; // update this path if needed

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { leadId } = await req.json();
    if (!leadId) {
      return NextResponse.json({ success: false, error: "Missing leadId" }, { status: 400 });
    }

    // 1. Fetch lead and validate required fields
    const lead = await prisma.lead.findUnique({ where: { id: leadId } });
    if (!lead || !lead.fbclid || !lead.metaPixelId) {
      return NextResponse.json(
        { success: false, error: "Lead not found or missing fbclid/metaPixelId" },
        { status: 404 }
      );
    }

    // 2. Fetch Meta integration record
    const integration = await prisma.metaAdsIntegration.findFirst({
      where: { organizationId: lead.organizationId },
    });

    if (!integration || !integration.accessToken) {
      return NextResponse.json({ 
        success: false, 
        error: "Meta Ads not connected" 
      }, { status: 400 });
    }

    // 3. Get fresh access token (auto refresh if needed)
    const accessToken = await getValidAccessToken(lead.organizationId);

    // 4. Construct the payload for Meta Conversions API
    const eventTime = Math.floor(Date.now() / 1000); // Unix timestamp
    
    const payload = {
      data: [
        {
          event_name: "Purchase", // or use integration.conversionEventId if available
          event_time: eventTime,
          event_id: `${lead.id}_${eventTime}`, // Unique event ID for deduplication
          action_source: "website",
          user_data: {
            // Hash email and phone if available (Meta requires SHA256 hashing)
            ...(lead.email && { em: await hashSHA256(lead.email.toLowerCase().trim()) }),
            ...(lead.phone && { ph: await hashSHA256(lead.phone.replace(/\D/g, '')) }),
            // Client IP and User Agent if available
            ...(lead.clientIpAddress && { client_ip_address: lead.clientIpAddress }),
            ...(lead.clientUserAgent && { client_user_agent: lead.clientUserAgent }),
            // Facebook browser ID
            ...(lead.metaFbp && { fbp: lead.metaFbp }),
            // Facebook click ID for attribution
            ...(lead.fbclid && { fbc: `fb.1.${eventTime}.${lead.fbclid}` }),
          },
          custom_data: {
            currency: lead.currency || "USD",
            value: lead.value || 100.0,
            // Add other custom properties if needed
            ...(lead.utmSource && { utm_source: lead.utmSource }),
            ...(lead.utmMedium && { utm_medium: lead.utmMedium }),
            ...(lead.utmCampaign && { utm_campaign: lead.utmCampaign }),
          },
          event_source_url: lead.landingPageUrl || lead.websiteUrl,
        },
      ],
      test_event_code: process.env.META_TEST_EVENT_CODE, // Optional: for testing
    };

    console.log("📤 Sending conversion to Meta Ads:", payload);

    // 5. Send to Meta Conversions API
    const response = await fetch(
      `https://graph.facebook.com/v19.0/${lead.metaPixelId}/events`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      }
    );

    if (!response.ok) {
      const contentType = response.headers.get("content-type");
      const errorData = contentType?.includes("application/json")
        ? await response.json()
        : await response.text();

      console.error("❌ Meta Ads sync failed:", errorData);

      return NextResponse.json(
        { success: false, error: "Meta Ads API failed", details: errorData },
        { status: 500 }
      );
    }

    const responseData = await response.json();
    console.log("✅ Meta Ads response:", responseData);

    // Check for API warnings or errors in the response
    if (responseData.messages) {
      console.warn("⚠️ Meta Ads API warnings:", responseData.messages);
    }

    // 6. Mark lead as synced
    await prisma.lead.update({
      where: { id: leadId },
      data: { syncedAt: new Date() },
    });

    return NextResponse.json({ 
      success: true, 
      message: "Lead synced to Meta Ads",
      details: responseData 
    });
  } catch (error) {
    console.error("❌ Error syncing lead to Meta:", error);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}

// Helper function to hash data with SHA256 (required by Meta)
async function hashSHA256(data: string): Promise<string> {
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}
import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "../../../../../../../packages/database/generated/client";
import { getValidAccessToken } from "@/lib/microsoft-ads/getValidAccessToken";

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
    if (!lead || !lead.msclkid) {
      return NextResponse.json(
        { success: false, error: "Lead not found or missing msclkid" },
        { status: 404 }
      );
    }

    // 2. Fetch Microsoft Ads integration record
    const integration = await prisma.microsoftAdsIntegration.findFirst({
      where: { organizationId: lead.organizationId },
    });

    if (!integration || !integration.accessToken || !integration.accountId) {
      return NextResponse.json({ 
        success: false, 
        error: "Microsoft Ads not connected" 
      }, { status: 400 });
    }

    // 3. Get fresh access token (auto refresh if needed)
    const accessToken = await getValidAccessToken(lead.organizationId);

    // 4. Construct the REST API payload for Microsoft Ads Offline Conversions
    const conversionTime = new Date(lead.createdAt || Date.now()).toISOString();
    const conversionName = lead.conversionActionId || "Lead Form Submission";
    
    // ✅ Microsoft Ads REST API JSON format (from official docs)
    const payload = {
      OfflineConversions: [
        {
          ConversionCurrencyCode: lead.currency || "USD",
          ConversionName: conversionName,
          ConversionTime: conversionTime,
          ConversionValue: lead.value || 100.0,
          MicrosoftClickId: lead.msclkid,
          
          // Enhanced conversions (optional) - hash PII for privacy
          ...(lead.email && { 
            HashedEmailAddress: await hashSHA256(lead.email.toLowerCase().trim()) 
          }),
          ...(lead.phone && { 
            HashedPhoneNumber: await hashSHA256(lead.phone.replace(/\D/g, '')) 
          }),
          
          // Optional attribution fields
          ExternalAttributionModel: "LastClick",
          ExternalAttributionCredit: 1.0
        }
      ]
    };

    console.log("📤 Sending conversion to Microsoft Ads:", {
      accountId: integration.accountId,
      conversionName,
      conversionTime,
      msclkid: `${lead.msclkid.substring(0, 10)}...`,
      value: payload.OfflineConversions[0].ConversionValue,
      currency: payload.OfflineConversions[0].ConversionCurrencyCode
    });

    // ✅ Microsoft Ads SANDBOX API endpoint for development/testing
    // const apiEndpoint = process.env.MICROSOFT_DEVELOPER_TOKEN === '1065R8SYLH638430' 
    //   ? 'https://campaign.api.sandbox.bingads.microsoft.com/CampaignManagement/v13/OfflineConversions/Apply'
    //   : 'https://campaign.api.bingads.microsoft.com/CampaignManagement/v13/OfflineConversions/Apply';
      const apiEndpoint = 'https://campaign.api.sandbox.bingads.microsoft.com/CampaignManagement/v13/Accounts';
    console.log(`🔗 Using Microsoft Ads API endpoint: ${apiEndpoint}`);
    
    const response = await fetch(apiEndpoint,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${accessToken}`, // ✅ Bearer prefix required
          "Content-Type": "application/json",
          "DeveloperToken": process.env.MICROSOFT_DEVELOPER_TOKEN || "",
          "CustomerAccountId": integration.accountId,
          "CustomerId": integration.customerId || integration.accountId
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(30000) // 30 second timeout
      }
    );
     
    if (!response.ok) {
      const contentType = response.headers.get("content-type");
      let errorData;
      
      try {
        errorData = contentType?.includes("application/json")
          ? await response.json()
          : await response.text();
      } catch (parseError) {
        errorData = `Failed to parse error response: ${response.statusText}`;
      }

      console.error("❌ Microsoft Ads sync failed:", {
        status: response.status,
        statusText: response.statusText,
        errorData
      });

      return NextResponse.json(
        { 
          success: false, 
          error: "Microsoft Ads API failed", 
          details: errorData,
          status: response.status
        },
        { status: 500 }
      );
    }

    let responseData;
    try {
      responseData = await response.json();
    } catch (parseError) {
      responseData = { message: "Conversion submitted successfully" };
    }
    
    console.log("✅ Microsoft Ads response:", responseData);

    // Check for API errors in the response (PartialErrors from documentation)
    if (responseData.PartialErrors && responseData.PartialErrors.length > 0) {
      console.error("❌ Microsoft Ads API errors:", responseData.PartialErrors);
      return NextResponse.json(
        { 
          success: false, 
          error: "Microsoft Ads API returned errors", 
          details: responseData.PartialErrors 
        },
        { status: 400 }
      );
    }

    // 6. Mark lead as synced
    await prisma.lead.update({
      where: { id: leadId },
      data: { 
        syncedAt: new Date(),
      },
    });
 
    return NextResponse.json({ 
      success: true, 
      message: "Lead synced to Microsoft Ads",
      details: responseData,
      conversionName,
      msclkid: `${lead.msclkid.substring(0, 10)}...`
    });

  } catch (error: any) {
    console.error("❌ Error syncing lead to Microsoft Ads:", error);
    
    // ✅ Enhanced error handling
    if (error.name === 'TimeoutError') {
      return NextResponse.json({ 
        success: false, 
        error: "Microsoft Ads API request timed out",
        details: "Request timeout after 30 seconds"
      }, { status: 408 });
    }
    
    if (error.message?.includes('fetch failed') || error.code === 'ENOTFOUND') {
      return NextResponse.json({ 
        success: false, 
        error: "Network error connecting to Microsoft Ads API",
        details: "DNS resolution failed - check network connectivity",
        suggestion: "Verify that your server can reach campaign.api.bingads.microsoft.com"
      }, { status: 503 });
    }
    
    if (error.message?.includes('Unauthorized')) {
      return NextResponse.json({ 
        success: false, 
        error: "Microsoft Ads authentication failed",
        details: error.message
      }, { status: 401 });
    }

    return NextResponse.json({ 
      success: false, 
      error: "Server error", 
      details: error.message 
    }, { status: 500 });
  }
}

// Helper function to hash data with SHA256
async function hashSHA256(data: string): Promise<string> {
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}
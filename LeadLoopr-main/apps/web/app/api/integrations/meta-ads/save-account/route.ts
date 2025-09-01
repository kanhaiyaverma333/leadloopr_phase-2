// app/api/integrations/meta-ads/save-account/route.ts
import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "../../../../../../../packages/database/generated/client";

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" }, 
        { status: 401 }
      );
    }

    const { adAccountId, organizationId } = await req.json();

    if (!adAccountId || !organizationId) {
      return NextResponse.json(
        { success: false, error: "Missing adAccountId or organizationId" }, 
        { status: 400 }
      );
    }

    // Validate organization ID format
    if (!organizationId.startsWith('org_')) {
      return NextResponse.json(
        { success: false, error: "Invalid organization ID format" }, 
        { status: 400 }
      );
    }

    console.log("💾 Saving selected Facebook Ad account:", {
      adAccountId,
      organizationId,
      userId
    });

    // Find the temporary integration
    const tempIntegration = await prisma.metaAdsIntegration.findUnique({
      where: { organizationId },
    });

    if (!tempIntegration) {
      return NextResponse.json(
        { success: false, error: "No temporary integration found. Please restart the connection process." }, 
        { status: 404 }
      );
    }

    if (!tempIntegration.accessToken) {
      return NextResponse.json(
        { success: false, error: "Invalid integration data. Please restart the connection process." }, 
        { status: 400 }
      );
    }

    // Verify the user has access to this ad account by calling Facebook API
    console.log("Checking access for Ad Account:", adAccountId);
   console.log("Using Access Token:", tempIntegration.accessToken);
    try {
      const accountRes = await fetch(
        `https://graph.facebook.com/v19.0/${adAccountId}?fields=id,name,account_status&access_token=${tempIntegration.accessToken}`,
        { method: "GET" }
      );

    //   const responseBody = await accountRes.text();
    //   console.log("FB API response:", responseBody);

      if (!accountRes.ok) {
        return NextResponse.json(
          { success: false, error: "You don't have access to this Facebook Ad account" }, 
          { status: 403 }
        );
      }

      const accountData = await accountRes.json();
      if (accountData.account_status !== 1) {
        return NextResponse.json(
          { success: false, error: "Selected ad account is not active" }, 
          { status: 400 }
        );
      }
    } catch (verifyError) {
      console.warn("⚠️ Account verification failed:", verifyError);
      return NextResponse.json(
        { success: false, error: "Failed to verify ad account access" }, 
        { status: 400 }
      );
    }

    // Update the integration with the selected ad account ID and activate it
    const updatedIntegration = await prisma.metaAdsIntegration.update({
      where: { organizationId },
      data: {
        adAccountId,
        isActive: true,
        lastError: null,
        updatedAt: new Date(),
      },
    });

    console.log("✅ Facebook Ads integration activated:", {
      id: updatedIntegration.id,
      organizationId: updatedIntegration.organizationId,
      adAccountId: updatedIntegration.adAccountId,
      isActive: updatedIntegration.isActive
    });

    // Optional: Fetch and store conversion events for this account
    try {
      const conversionEventsRes = await fetch(
        `https://graph.facebook.com/v19.0/act_${adAccountId}/customconversions?fields=id,name,pixel&access_token=${tempIntegration.accessToken}`,
        { method: "GET" }
      );

      if (conversionEventsRes.ok) {
        const conversionData = await conversionEventsRes.json();
        if (conversionData.data?.length > 0) {
          // Store the first conversion event ID for reference
          const firstConversionEvent = conversionData.data[0];
          
          await prisma.metaAdsIntegration.update({
            where: { organizationId },
            data: { 
              conversionEventId: firstConversionEvent.id,
              // Store additional metadata if needed
              metadata: JSON.stringify({
                conversionEvents: conversionData.data.map((event: any) => ({
                  id: event.id,
                  name: event.name,
                  pixelId: event.pixel?.id
                }))
              })
            },
          });
          
          console.log("✅ Conversion events fetched and stored");
        }
      }
    } catch (conversionError) {
      console.warn("⚠️ Failed to fetch conversion events:", conversionError);
      // Don't fail the whole process for this
    }

    return NextResponse.json({ 
      success: true, 
      message: "Facebook Ad account connected successfully",
      adAccountId 
    });

  } catch (error: any) {
    console.error("💥 Error saving Facebook Ad account:", {
      message: error?.message,
      stack: error?.stack,
    });

    return NextResponse.json(
      { success: false, error: "Failed to save account. Please try again." }, 
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
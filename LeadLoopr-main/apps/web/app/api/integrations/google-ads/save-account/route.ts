// app/api/integrations/google-ads/save-account/route.ts
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

    const { customerId, organizationId } = await req.json();

    if (!customerId || !organizationId) {
      return NextResponse.json(
        { success: false, error: "Missing customerId or organizationId" }, 
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

    console.log("💾 Saving selected Google Ads account:", {
      customerId,
      organizationId,
      userId
    });

    // Find the temporary integration
    const tempIntegration = await prisma.googleAdsIntegration.findUnique({
      where: { organizationId },
    });

    if (!tempIntegration) {
      return NextResponse.json(
        { success: false, error: "No temporary integration found. Please restart the connection process." }, 
        { status: 404 }
      );
    }

    if (!tempIntegration.accessToken || !tempIntegration.refreshToken) {
      return NextResponse.json(
        { success: false, error: "Invalid integration data. Please restart the connection process." }, 
        { status: 400 }
      );
    }

    // Verify the user has access to this customer ID by calling Google Ads API
    try {
      const customerRes = await fetch(
        "https://googleads.googleapis.com/v19/customers:listAccessibleCustomers", 
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${tempIntegration.accessToken}`,
            "developer-token": process.env.GOOGLE_ADS_DEVELOPER_TOKEN!,
          },
        }
      );

      if (customerRes.ok) {
        const customerData = await customerRes.json();
        const hasAccess = customerData.resourceNames?.some((resource: string) => 
          resource === `customers/${customerId}`
        );

        if (!hasAccess) {
          return NextResponse.json(
            { success: false, error: "You don't have access to this Google Ads account" }, 
            { status: 403 }
          );
        }
      } else {
        console.warn("⚠️ Could not verify account access, proceeding anyway");
      }
    } catch (verifyError) {
      console.warn("⚠️ Account verification failed, proceeding anyway:", verifyError);
    }

    // Update the integration with the selected customer ID and activate it
    const updatedIntegration = await prisma.googleAdsIntegration.update({
      where: { organizationId },
      data: {
        customerId,
        isActive: true,
        lastError: null,
        updatedAt: new Date(),
      },
    });

    console.log("✅ Google Ads integration activated:", {
      id: updatedIntegration.id,
      organizationId: updatedIntegration.organizationId,
      customerId: updatedIntegration.customerId,
      isActive: updatedIntegration.isActive
    });

    // Optional: Fetch and store conversion actions for this account
    try {
      const conversionActionsRes = await fetch(
        `https://googleads.googleapis.com/v19/customers/${customerId}/googleAds:search`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${tempIntegration.accessToken}`,
            "developer-token": process.env.GOOGLE_ADS_DEVELOPER_TOKEN!,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            query: `
              SELECT 
                conversion_action.resource_name,
                conversion_action.name,
                conversion_action.type,
                conversion_action.status
              FROM conversion_action 
              WHERE conversion_action.status = 'ENABLED'
              LIMIT 1
            `
          }),
        }
      );

      if (conversionActionsRes.ok) {
        const conversionData = await conversionActionsRes.json();
        if (conversionData.results?.[0]?.conversionAction?.resourceName) {
          const resourceName = conversionData.results[0].conversionAction.resourceName;
          const conversionActionId = resourceName.split('/')[3];
          
          // Update with conversion action ID if found
          await prisma.googleAdsIntegration.update({
            where: { organizationId },
            data: { conversionActionId },
          });
          
          console.log("✅ Conversion action ID saved:", conversionActionId);
        }
      }
    } catch (conversionError) {
      console.warn("⚠️ Failed to fetch conversion actions:", conversionError);
      // Don't fail the whole process for this
    }

    return NextResponse.json({ 
      success: true, 
      message: "Google Ads account connected successfully",
      customerId 
    });

  } catch (error: any) {
    console.error("💥 Error saving Google Ads account:", {
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
import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "../../../../../../../packages/database/generated/client";
import { getValidAccessToken } from "@/lib/google-ads/getValidAccessToken"; // update this path if needed

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
    if (!lead || !lead.gclid || !lead.conversionActionId) {
      return NextResponse.json(
        { success: false, error: "Lead not found or missing GCLID/conversionActionId" },
        { status: 404 }
      );
    }

    // 2. Fetch integration record
    const integration = await prisma.googleAdsIntegration.findFirst({
      where: { organizationId: lead.organizationId },
    });

    if (!integration || !integration.refreshToken || !integration.customerId) {
      return NextResponse.json({ success: false, error: "Google Ads not connected" }, { status: 400 });
    }

    // 3. Get fresh access token (auto refresh if needed)
    const accessToken = await getValidAccessToken(lead.organizationId);

    // 4. Construct the payload
    const payload = {
      conversions: [
        {
          gclid: lead.gclid,
          conversionAction: `customers/${integration.customerId}/conversionActions/${lead.conversionActionId}`,
          conversionDateTime: new Date().toISOString(),
          conversionValue: lead.value ?? 100.0,
          currencyCode: lead.currency ?? "INR",
        },
      ],
      partialFailure: true,
      validateOnly: false,
    };

    console.log("📤 Sending conversion to Google Ads:", payload);

    // 5. Send to Google Ads API
    const headers: Record<string, string> = {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    };

    if (process.env.GOOGLE_ADS_DEVELOPER_TOKEN) {
      headers["developer-token"] = process.env.GOOGLE_ADS_DEVELOPER_TOKEN;
    }

    const response = await fetch(
      `https://googleads.googleapis.com/v19/customers/${integration.customerId}:uploadClickConversions`,
      {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      }
    );

    if (!response.ok) {
      const contentType = response.headers.get("content-type");
      const errorData = contentType?.includes("application/json")
        ? await response.json()
        : await response.text();

      console.error("❌ Google Ads sync failed:", errorData);

      return NextResponse.json(
        { success: false, error: "Google Ads API failed", details: errorData },
        { status: 500 }
      );
    }

    // 6. Mark lead as synced
    await prisma.lead.update({
      where: { id: leadId },
      data: { syncedAt: new Date() },
    });

    return NextResponse.json({ success: true, message: "Lead synced to Google Ads" });
  } catch (error) {
    console.error("❌ Error syncing lead:", error);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}

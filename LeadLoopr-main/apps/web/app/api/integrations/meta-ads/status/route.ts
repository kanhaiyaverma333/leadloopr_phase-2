// app/api/integrations/meta-ads/status/route.ts
import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "../../../../../../../packages/database/generated/client";

const prisma = new PrismaClient();

interface StatusResponse {
  connected: boolean;
  status: string;
  connectedAt?: Date;
  message?: string;
  error?: string;
}

export async function GET(request: NextRequest): Promise<NextResponse<StatusResponse>> {
  console.log("🔍 Checking Facebook Ads integration status...");

  try {
    const { userId, orgId } = await auth() || {};

    if (!userId || !orgId) {
      return NextResponse.json(
        { error: "Unauthorized", connected: false, status: "unauthorized" },
        { status: 401 }
      );
    }

    await prisma.$connect();

    const integration = await prisma.metaAdsIntegration.findUnique({
      where: { organizationId: orgId },
      select: {
        id: true,
        expiryDate: true,
        createdAt: true,
        accessToken: true,
        adAccountId: true,
        isActive: true,
        conversionEventId: true,
      },
    });

    if (!integration) {
      return NextResponse.json({
        connected: false,
        status: "not_connected",
        message: "No Facebook Ads integration found",
      });
    }

    if (!integration.isActive) {
      return NextResponse.json({
        connected: false,
        status: "inactive",
        message: "Integration is inactive",
      });
    }

    if (!integration.adAccountId) {
      return NextResponse.json({
        connected: false,
        status: "incomplete",
        message: "No ad account selected",
      });
    }

    const now = new Date();
    const isExpired = !!integration.expiryDate && integration.expiryDate < now;

    if (isExpired) {
      // Try to refresh the token
      try {
        const refreshResponse = await fetch(
          `https://graph.facebook.com/v19.0/oauth/access_token?` +
          `grant_type=fb_exchange_token&` +
          `client_id=${process.env.FACEBOOK_APP_ID}&` +
          `client_secret=${process.env.FACEBOOK_APP_SECRET}&` +
          `fb_exchange_token=${integration.accessToken}`,
          { method: "GET" }
        );

        if (refreshResponse.ok) {
          const refreshData = await refreshResponse.json();
          const newExpiryDate = new Date(Date.now() + (refreshData.expires_in || 5184000) * 1000);
          
          await prisma.metaAdsIntegration.update({
            where: { organizationId: orgId },
            data: {
              accessToken: refreshData.access_token,
              expiryDate: newExpiryDate,
              lastError: null,
            },
          });

          return NextResponse.json({
            connected: true,
            status: "connected",
            message: "Token refreshed successfully",
            connectedAt: integration.createdAt,
          });
        } else {
          return NextResponse.json({
            connected: false,
            status: "expired",
            message: "Token expired and cannot be refreshed. Please reconnect.",
          });
        }
      } catch (refreshError) {
        console.error("Failed to refresh Facebook token:", refreshError);
        return NextResponse.json({
          connected: false,
          status: "expired",
          message: "Token expired and refresh failed. Please reconnect.",
        });
      }
    }

    // Test token validity with a simple API call
    try {
      const testResponse = await fetch(
        `https://graph.facebook.com/v19.0/${integration.adAccountId}?fields=id,name&access_token=${integration.accessToken}`,
        { method: "GET" }
      );

      if (!testResponse.ok) {
        return NextResponse.json({
          connected: false,
          status: "token_invalid",
          message: "Access token is no longer valid. Please reconnect.",
        });
      }
    } catch (testError) {
      console.warn("Token validation test failed:", testError);
      // Don't fail completely, just warn
    }

    return NextResponse.json({
      connected: true,
      status: "connected",
      message: "Facebook Ads connected successfully",
      connectedAt: integration.createdAt,
    });

  } catch (error) {
    console.error("💥 Error checking Facebook Ads status:", error);
    return NextResponse.json(
      {
        connected: false,
        status: "error",
        message: "Failed to check connection status",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// DELETE endpoint to disconnect integration
export async function DELETE(request: NextRequest) {
  console.log("🗑️ Disconnecting Facebook Ads integration...");

  try {
    const { userId, orgId } = await auth() || {};

    if (!userId || !orgId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const integration = await prisma.metaAdsIntegration.findUnique({
      where: { organizationId: orgId },
    });

    if (integration?.accessToken) {
      // Revoke permissions with Facebook
      try {
        await fetch(
          `https://graph.facebook.com/v19.0/me/permissions?access_token=${integration.accessToken}`,
          { method: "DELETE" }
        );
      } catch (revokeError) {
        console.warn("Failed to revoke Facebook permissions:", revokeError);
        // Continue with deletion even if revoke fails
      }
    }

    await prisma.metaAdsIntegration.delete({
      where: { organizationId: orgId },
    });

    return NextResponse.json({
      success: true,
      message: "Facebook Ads integration disconnected",
    });

  } catch (error) {
    console.error("💥 Error disconnecting Facebook Ads:", error);
    return NextResponse.json(
      { error: "Failed to disconnect integration" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
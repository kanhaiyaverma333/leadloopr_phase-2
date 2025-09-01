// app/api/integrations/google-ads/status/route.ts
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
  console.log("🔍 Checking Google Ads integration status...");

  try {
    const { userId, orgId } = await auth() || {};

    if (!userId || !orgId) {
      return NextResponse.json(
        { error: "Unauthorized", connected: false, status: "unauthorized" },
        { status: 401 }
      );
    }

    await prisma.$connect();

    const integration = await prisma.googleAdsIntegration.findUnique({
      where: { organizationId: orgId },
      select: {
        id: true,
        expiryDate: true,
        createdAt: true,
        accessToken: true,
        refreshToken: true,
        isActive: true,
        // 🔥 REMOVED: conversionActionId
      },
    });

    if (!integration) {
      return NextResponse.json({
        connected: false,
        status: "not_connected",
        message: "No Google Ads integration found",
      });
    }

    if (!integration.isActive) {
      return NextResponse.json({
        connected: false,
        status: "inactive",
        message: "Integration is inactive",
      });
    }

    const now = new Date();
    const isExpired = !!integration.expiryDate && integration.expiryDate < now;
    const hasRefreshToken = !!integration.refreshToken;

    if (isExpired) {
      if (hasRefreshToken) {
        return NextResponse.json({
          connected: true,
          status: "connected", // ✅ Always treat as connected
          message: "Token expired but will auto-refresh on demand.",
          connectedAt: integration.createdAt,
        });
      } else {
        return NextResponse.json({
          connected: false,
          status: "expired",
          message: "Token expired and cannot be refreshed. Please reconnect.",
        });
      }
    }

    return NextResponse.json({
      connected: true,
      status: "connected", // ✅ Always connected if active and token valid
      message: "Google Ads connected successfully",
      connectedAt: integration.createdAt,
    });

  } catch (error) {
    console.error("💥 Error checking Google Ads status:", error);
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
  console.log("🗑️ Disconnecting Google Ads integration...");

  try {
    const { userId, orgId } = await auth() || {};

    if (!userId || !orgId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await prisma.googleAdsIntegration.delete({
      where: { organizationId: orgId },
    });

    return NextResponse.json({
      success: true,
      message: "Google Ads integration disconnected",
    });

  } catch (error) {
    console.error("💥 Error disconnecting Google Ads:", error);
    return NextResponse.json(
      { error: "Failed to disconnect integration" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

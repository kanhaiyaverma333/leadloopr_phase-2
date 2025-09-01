// app/api/integrations/google-analytics/status/route.ts
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
  integrationName?: string;
  measurementId?: string;
}

export async function GET(request: NextRequest): Promise<NextResponse<StatusResponse>> {
  console.log("🔍 Checking Google Analytics integration status...");

  try {
    const { userId, orgId } = await auth() || {};

    if (!userId || !orgId) {
      return NextResponse.json(
        { error: "Unauthorized", connected: false, status: "unauthorized" },
        { status: 401 }
      );
    }

    await prisma.$connect();

    const integration = await prisma.googleAnalyticsIntegration.findUnique({
      where: { organizationId: orgId },
      select: {
        id: true,
        expiryDate: true,
        createdAt: true,
        accessToken: true,
        refreshToken: true,
        isActive: true,
        isConfigured: true,
        integrationName: true,
        measurementId: true,
        apiSecret: true,
      },
    });

    if (!integration) {
      return NextResponse.json({
        connected: false,
        status: "not_connected",
        message: "No Google Analytics integration found",
      });
    }

    // Check if OAuth is complete but not configured
    if (!integration.isConfigured) {
      return NextResponse.json({
        connected: false,
        status: "needs_configuration",
        message: "OAuth complete but GA4 details not configured",
      });
    }

    if (!integration.isActive) {
      return NextResponse.json({
        connected: false,
        status: "inactive",
        message: "Integration is inactive",
      });
    }

    // Check if required GA4 config is missing
    if (!integration.measurementId || !integration.apiSecret) {
      return NextResponse.json({
        connected: false,
        status: "misconfigured",
        message: "Missing GA4 configuration details",
      });
    }

    const now = new Date();
    const isExpired = !!integration.expiryDate && integration.expiryDate < now;
    const hasRefreshToken = !!integration.refreshToken;

    if (isExpired) {
      if (hasRefreshToken) {
        return NextResponse.json({
          connected: true,
          status: "connected",
          message: "Token expired but will auto-refresh on demand.",
          connectedAt: integration.createdAt,
          integrationName: integration.integrationName || undefined,
          measurementId: integration.measurementId || undefined,
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
      status: "connected",
      message: "Google Analytics connected and configured successfully",
      connectedAt: integration.createdAt,
      integrationName: integration.integrationName || undefined,
      measurementId: integration.measurementId || undefined,
    });

  } catch (error) {
    console.error("💥 Error checking Google Analytics status:", error);
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
  console.log("🗑️ Disconnecting Google Analytics integration...");

  try {
    const { userId, orgId } = await auth() || {};

    if (!userId || !orgId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await prisma.googleAnalyticsIntegration.delete({
      where: { organizationId: orgId },
    });

    return NextResponse.json({
      success: true,
      message: "Google Analytics integration disconnected",
    });

  } catch (error) {
    console.error("💥 Error disconnecting Google Analytics:", error);
    return NextResponse.json(
      { error: "Failed to disconnect integration" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
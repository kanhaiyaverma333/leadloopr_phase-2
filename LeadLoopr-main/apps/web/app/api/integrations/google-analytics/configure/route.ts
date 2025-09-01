// app/api/integrations/google-analytics/configure/route.ts
import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "../../../../../../../packages/database/generated/client";

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  console.log("⚙️ Configuring Google Analytics integration...");

  try {
    const { userId, orgId } = await auth() || {};

    if (!userId || !orgId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { measurementId, apiSecret, integrationName } = await request.json();

    if (!measurementId || !apiSecret) {
      return NextResponse.json(
        { error: "Measurement ID and API Secret are required" },
        { status: 400 }
      );
    }

    // Validate measurement ID format (should start with G-)
    if (!measurementId.startsWith('G-')) {
      return NextResponse.json(
        { error: "Invalid Measurement ID format. Should start with 'G-'" },
        { status: 400 }
      );
    }

    // Check if integration exists
    const integration = await prisma.googleAnalyticsIntegration.findUnique({
      where: { organizationId: orgId },
    });

    if (!integration) {
      return NextResponse.json(
        { error: "OAuth not completed. Please connect first." },
        { status: 400 }
      );
    }

    // Update integration with configuration
    await prisma.googleAnalyticsIntegration.update({
      where: { organizationId: orgId },
      data: {
        measurementId,
        apiSecret,
        integrationName: integrationName || `GA4 - ${measurementId}`,
        isConfigured: true,
        isActive: true,
        lastError: null,
        updatedAt: new Date(),
      },
    });

    console.log("✅ Google Analytics integration configured successfully");

    return NextResponse.json({
      success: true,
      message: "Google Analytics integration configured successfully",
      measurementId,
      integrationName: integrationName || `GA4 - ${measurementId}`,
    });

  } catch (error) {
    console.error("💥 Error configuring Google Analytics:", error);
    return NextResponse.json(
      { error: "Failed to configure integration" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// GET endpoint to retrieve current configuration
export async function GET(request: NextRequest) {
  try {
    const { userId, orgId } = await auth() || {};

    if (!userId || !orgId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const integration = await prisma.googleAnalyticsIntegration.findUnique({
      where: { organizationId: orgId },
      select: {
        measurementId: true,
        integrationName: true,
        isConfigured: true,
        isActive: true,
        createdAt: true,
      },
    });

    if (!integration) {
      return NextResponse.json(
        { error: "Integration not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      measurementId: integration.measurementId || '',
      integrationName: integration.integrationName || '',
      isConfigured: integration.isConfigured,
      isActive: integration.isActive,
      connectedAt: integration.createdAt,
    });

  } catch (error) {
    console.error("💥 Error retrieving Google Analytics config:", error);
    return NextResponse.json(
      { error: "Failed to retrieve configuration" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
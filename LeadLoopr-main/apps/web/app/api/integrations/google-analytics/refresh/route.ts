// app/api/integrations/google-analytics/refresh/route.ts
import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "../../../../../../../packages/database/generated/client";

const prisma = new PrismaClient();

interface TokenRefreshResponse {
  access_token: string;
  expires_in: number;
  scope: string;
  token_type: string;
}

export async function POST(request: NextRequest) {
  console.log("🔄 Starting Google Analytics token refresh process...");

  try {
    const { searchParams } = new URL(request.url);
    const orgId = searchParams.get("orgId");

    if (!orgId) {
      return NextResponse.json({ error: "Organization ID required" }, { status: 400 });
    }

    // Get current integration
    const integration = await prisma.googleAnalyticsIntegration.findUnique({
      where: { organizationId: orgId },
    });

    if (!integration) {
      return NextResponse.json({ error: "Integration not found" }, { status: 404 });
    }

    if (!integration.refreshToken) {
      return NextResponse.json({ error: "No refresh token available" }, { status: 400 });
    }

    console.log("🔍 Current token expires at:", integration.expiryDate);
    console.log("🕐 Current time:", new Date());

    // Refresh the access token
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        refresh_token: integration.refreshToken,
        grant_type: "refresh_token",
      }),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error("❌ Token refresh failed:", errorText);

      // If refresh token is invalid, mark integration as expired
      await prisma.googleAnalyticsIntegration.update({
        where: { organizationId: orgId },
        data: {
          isActive: false,
          lastError: `Token refresh failed: ${errorText}`,
          updatedAt: new Date(),
        },
      });

      return NextResponse.json(
        { error: "Token refresh failed", needsReauth: true },
        { status: 401 }
      );
    }

    const tokens: TokenRefreshResponse = await tokenResponse.json();
    const newExpiryDate = new Date(Date.now() + tokens.expires_in * 1000);

    // Update the integration with new token
    await prisma.googleAnalyticsIntegration.update({
      where: { organizationId: orgId },
      data: {
        accessToken: tokens.access_token,
        expiryDate: newExpiryDate,
        isActive: true,
        lastError: null,
        updatedAt: new Date(),
      },
    });

    console.log("✅ Google Analytics token refreshed successfully");
    console.log("🕐 New expiry date:", newExpiryDate);

    return NextResponse.json({
      success: true,
      expiryDate: newExpiryDate,
      message: "Token refreshed successfully",
    });

  } catch (error) {
    console.error("💥 Google Analytics token refresh error:", error);
    return NextResponse.json(
      { error: "Internal server error during token refresh" },
      { status: 500 }
    );
  }
}
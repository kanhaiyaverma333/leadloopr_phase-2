import { PrismaClient } from "../../../../packages/database/generated/client";

const prisma = new PrismaClient();

export async function getValidAccessToken(organizationId: string): Promise<string> {
  try {
    // Find the Microsoft Ads integration for this organization
    const integration = await prisma.microsoftAdsIntegration.findFirst({
      where: { organizationId },
    });

    if (!integration) {
      throw new Error("Microsoft Ads integration not found");
    }

    if (!integration.refreshToken) {
      throw new Error("Microsoft Ads refresh token not available");
    }

    // Check if current access token is still valid (if we store expiry time)
    if (integration.accessToken && integration.expiryDate) {
      const now = new Date();
      const expiresAt = new Date(integration.expiryDate);
      
      // If token expires in more than 5 minutes, use it
      if (expiresAt.getTime() - now.getTime() > 5 * 60 * 1000) {
        console.log("🔄 Using existing Microsoft Ads access token");
        return integration.accessToken;
      }
    }

    console.log("🔄 Refreshing Microsoft Ads access token...");

    // Refresh the access token
    const tokenResponse = await fetch('https://login.microsoftonline.com/common/oauth2/v2.0/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: process.env.MICROSOFT_CLIENT_ID!,
        client_secret: process.env.MICROSOFT_CLIENT_SECRET!,
        refresh_token: integration.refreshToken,
        grant_type: 'refresh_token',
        scope: 'https://ads.microsoft.com/ads.manage offline_access',
      }),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error("❌ Microsoft token refresh failed:", {
        status: tokenResponse.status,
        statusText: tokenResponse.statusText,
        error: errorText
      });
      
      throw new Error(`Microsoft Ads token refresh failed: ${tokenResponse.status} ${errorText}`);
    }

    const tokenData = await tokenResponse.json();

    if (!tokenData.access_token) {
      console.error("❌ No access token in Microsoft response:", tokenData);
      throw new Error("Microsoft Ads token refresh did not return access token");
    }

    // Calculate expiry time (typically 1 hour)
    const expiresIn = tokenData.expires_in || 3600; // Default to 1 hour
    const expiryDate = new Date(Date.now() + (expiresIn * 1000));

    // Update the integration record with new tokens
    await prisma.microsoftAdsIntegration.update({
      where: { id: integration.id },
      data: {
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token || integration.refreshToken, // Keep old refresh token if new one not provided
        expiryDate,
        updatedAt: new Date(),
      },
    });

    console.log("✅ Microsoft Ads access token refreshed successfully");
    return tokenData.access_token;

  } catch (error: any) {
    console.error("❌ Error getting Microsoft Ads access token:", error);
    throw new Error(`Failed to get Microsoft Ads access token: ${error.message}`);
  }
}
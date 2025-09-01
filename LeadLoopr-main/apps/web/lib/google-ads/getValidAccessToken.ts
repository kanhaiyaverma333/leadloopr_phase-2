// lib/googleAds/getValidAccessToken.ts
import { PrismaClient } from "../../../../packages/database/generated/client";

const prisma = new PrismaClient();

export async function getValidAccessToken(orgId: string): Promise<string> {
  const integration = await prisma.googleAdsIntegration.findUnique({
    where: { organizationId: orgId },
  });

  if (!integration) throw new Error("Google Ads integration not found");
  if (!integration.refreshToken) throw new Error("Missing refresh token");

  const isExpired =
    !integration.expiryDate ||
    new Date().getTime() >= new Date(integration.expiryDate).getTime() - 60 * 1000;

  if (!isExpired) return integration.accessToken;

  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      refresh_token: integration.refreshToken,
      grant_type: "refresh_token",
    }),
  });

  const tokenData = await tokenRes.json();

  if (!tokenRes.ok) {
    console.error("🔴 Failed to refresh token", {
      status: tokenRes.status,
      error: tokenData.error,
      description: tokenData.error_description,
    });

    await prisma.googleAdsIntegration.update({
      where: { id: integration.id },
      data: {
        isActive: false,
        lastError: `Refresh failed: ${tokenData.error_description || "Unknown"}`,
      },
    });

    throw new Error("Unable to refresh Google Ads token");
  }

  const newAccessToken = tokenData.access_token;
  const expiresAt = new Date(Date.now() + tokenData.expires_in * 1000);

  await prisma.googleAdsIntegration.update({
    where: { id: integration.id },
    data: {
      accessToken: newAccessToken,
      expiryDate: expiresAt,
      isActive: true,
      lastError: null,
    },
  });

  return newAccessToken;
}

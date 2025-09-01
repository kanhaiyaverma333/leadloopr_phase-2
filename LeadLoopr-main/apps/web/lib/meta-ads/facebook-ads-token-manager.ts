// lib/meta-ads/getValidAccessToken.ts
import { PrismaClient } from "../../../../packages/database/generated/client";

const prisma = new PrismaClient();

export async function getValidAccessToken(orgId: string): Promise<string> {
  const integration = await prisma.metaAdsIntegration.findUnique({
    where: { organizationId: orgId },
  });

  if (!integration) throw new Error("Meta Ads integration not found");
  if (!integration.accessToken) throw new Error("Missing access token");

  const isExpired =
    !integration.expiryDate ||
    new Date().getTime() >= new Date(integration.expiryDate).getTime() - 60 * 1000;

  if (!isExpired) return integration.accessToken;

  // Meta tokens can be refreshed by exchanging for new long-lived tokens
  const tokenRes = await fetch(
    `https://graph.facebook.com/v19.0/oauth/access_token?` +
    `grant_type=fb_exchange_token&` +
    `client_id=${process.env.META_APP_ID}&` +
    `client_secret=${process.env.META_APP_SECRET}&` +
    `fb_exchange_token=${integration.accessToken}`,
    { method: "GET" }
  );

  const tokenData = await tokenRes.json();

  if (!tokenRes.ok) {
    console.error("🔴 Failed to refresh Meta token", {
      status: tokenRes.status,
      error: tokenData.error,
      description: tokenData.error_description,
    });

    await prisma.metaAdsIntegration.update({
      where: { id: integration.id },
      data: {
        isActive: false,
        lastError: `Refresh failed: ${tokenData.error_description || "Unknown"}`,
      },
    });

    throw new Error("Unable to refresh Meta Ads token");
  }

  const newAccessToken = tokenData.access_token;
  const expiresAt = new Date(Date.now() + (tokenData.expires_in || 5184000) * 1000); // Default 60 days

  await prisma.metaAdsIntegration.update({
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
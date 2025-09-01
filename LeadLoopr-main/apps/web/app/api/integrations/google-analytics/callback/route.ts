// app/api/integrations/google-analytics/callback/route.ts
import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "../../../../../../../packages/database/generated/client";

const prisma = new PrismaClient();

interface TokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  scope: string;
  token_type: string;
}

export async function GET(request: NextRequest) {
  console.log("🚀 Google Analytics callback started");

  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const error = searchParams.get("error");

    if (error) {
      console.error("❌ OAuth error:", error);
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard/integrations?error=oauth_denied`);
    }

    if (!code || !state) {
      console.error("❌ Missing code or state");
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard/integrations?error=missing_params`);
    }

    const stateData = JSON.parse(Buffer.from(state, "base64").toString());
    const { orgId, userId, integration } = stateData;

    // Verify this is for Google Analytics
    if (integration !== "google-analytics") {
      console.error("❌ Invalid integration type:", integration);
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard/integrations?error=invalid_integration`);
    }

    if (!orgId?.startsWith("org_")) {
      console.error("❌ Invalid orgId:", orgId);
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard/integrations?error=invalid_org`);
    }

    // 1. Exchange code for tokens
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        code,
        grant_type: "authorization_code",
        redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/google-analytics/callback`,
      }),
    });

    if (!tokenRes.ok) {
      const err = await tokenRes.text();
      console.error("❌ Token exchange failed:", err);
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard/integrations?error=token_exchange_failed`);
    }

    const tokens: TokenResponse = await tokenRes.json();
    if (!tokens.refresh_token) {
      console.error("❌ Missing refresh token");
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard/integrations?error=no_refresh_token`);
    }

    // 2. Store tokens temporarily (user will configure GA4 details next)
    const expiryDate = new Date(Date.now() + tokens.expires_in * 1000);
    
    await prisma.googleAnalyticsIntegration.upsert({
      where: { organizationId: orgId },
      update: {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token!,
        scope: tokens.scope,
        expiryDate,
        isActive: false, // Not active until configured
        isConfigured: false, // Not configured until user enters GA4 details
        lastError: null,
        updatedAt: new Date(),
      },
      create: {
        organizationId: orgId,
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token!,
        scope: tokens.scope,
        expiryDate,
        isActive: false,
        isConfigured: false,
      },
    });

    // Ensure organization exists
    await prisma.organization.upsert({
      where: { id: orgId },
      update: {},
      create: {
        id: orgId,
        name: "Auto-created via Analytics",
        website: null
      }
    });

    console.log("✅ OAuth tokens stored, redirecting to configuration");

    // 3. Redirect to configuration page where user enters GA4 details
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/integrations/google-analytics/configure?org=${orgId}`
    );

  } catch (err: any) {
    console.error("💥 Unexpected callback error:", {
      message: err?.message,
      stack: err?.stack,
    });

    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard/integrations?error=callback_failed`);
  }
}
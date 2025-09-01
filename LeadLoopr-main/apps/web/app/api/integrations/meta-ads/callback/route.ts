// app/api/integrations/meta-ads/callback/route.ts
import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "../../../../../../../packages/database/generated/client";

const prisma = new PrismaClient();

interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in?: number;
}

interface FacebookAdAccount {
  id: string;
  name: string;
  account_status: number;
  currency: string;
}

export async function GET(request: NextRequest) {
  console.log("🚀 Facebook Ads callback started (App Router)");

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
    const { orgId, userId } = stateData;

    if (!orgId?.startsWith("org_")) {
      console.error("❌ Invalid orgId:", orgId);
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard/integrations?error=invalid_org`);
    }

    // 1. Exchange code for access token
    const tokenParams = new URLSearchParams({
      client_id: process.env.FACEBOOK_APP_ID!,
      client_secret: process.env.FACEBOOK_APP_SECRET!,
      redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/meta-ads/callback`,
      code,
    });

    const tokenRes = await fetch(
      `https://graph.facebook.com/v19.0/oauth/access_token?${tokenParams.toString()}`,
      { method: "GET" }
    );

    if (!tokenRes.ok) {
      const err = await tokenRes.text();
      console.error("❌ Token exchange failed:", err);
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard/integrations?error=token_exchange_failed`);
    }

    const tokens: TokenResponse = await tokenRes.json();
    const shortLivedToken = tokens.access_token;

    // 2. Exchange short-lived token for long-lived token
    const longLivedTokenRes = await fetch(
      `https://graph.facebook.com/v19.0/oauth/access_token?` +
      `grant_type=fb_exchange_token&` +
      `client_id=${process.env.FACEBOOK_APP_ID}&` +
      `client_secret=${process.env.FACEBOOK_APP_SECRET}&` +
      `fb_exchange_token=${shortLivedToken}`,
      { method: "GET" }
    );

    if (!longLivedTokenRes.ok) {
      const err = await longLivedTokenRes.text();
      console.error("❌ Long-lived token exchange failed:", err);
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard/integrations?error=long_token_failed`);
    }

    const longLivedTokenData = await longLivedTokenRes.json();
    const accessToken = longLivedTokenData.access_token;
    const expiresIn = longLivedTokenData.expires_in || 5184000; // Default 60 days

    // 3. Fetch accessible ad accounts
    const adAccountsRes = await fetch(
      `https://graph.facebook.com/v19.0/me/adaccounts?fields=id,name,account_status,currency&access_token=${accessToken}`,
      { method: "GET" }
    );

    if (!adAccountsRes.ok) {
      console.error("❌ Failed to fetch ad accounts");
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard/integrations?error=fetch_accounts_failed`);
    }

    const adAccountsData = await adAccountsRes.json();
    console.log("🧾 Ad accounts data:", adAccountsData);

    const accounts: FacebookAdAccount[] = adAccountsData.data || [];

    if (accounts.length === 0) {
      console.warn("⚠️ No Facebook Ad accounts found");
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard/integrations?error=no_accounts`);
    }

    // Filter active accounts only
    const activeAccounts = accounts.filter(account => account.account_status === 1);

    if (activeAccounts.length === 0) {
      console.warn("⚠️ No active Facebook Ad accounts found");
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard/integrations?error=no_active_accounts`);
    }

    // 4. Store tokens temporarily for account selection
    const expiryDate = new Date(Date.now() + expiresIn * 1000);
    
    // Store temporary integration data
    await prisma.metaAdsIntegration.upsert({
      where: { organizationId: orgId },
      update: {
        accessToken,
        expiryDate,
        adAccountId: null, // Will be set when user selects account
        isActive: false, // Not active until account is selected
        lastError: null,
        updatedAt: new Date(),
      },
      create: {
        organizationId: orgId,
        accessToken,
        expiryDate,
        adAccountId: null,
        isActive: false,
      },
    });

    // Ensure organization exists
    await prisma.organization.upsert({
      where: { id: orgId },
      update: {},
      create: {
        id: orgId,
        name: "Auto-created via Facebook Ads",
        website: null
      }
    });

    console.log("✅ Tokens stored temporarily, redirecting to account selection");

    // 5. Redirect to account selection page with accounts data
    const accountsParam = encodeURIComponent(JSON.stringify(activeAccounts));
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/integrations/meta-ads/select-account?accounts=${accountsParam}&org=${orgId}`
    );

  } catch (err: any) {
    console.error("💥 Unexpected callback error:", {
      message: err?.message,
      stack: err?.stack,
    });

    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard/integrations?error=callback_failed`);
  }
}
// app/api/integrations/google-ads/callback/route.ts
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

interface GoogleAdsAccount {
  customerId: string;
  resourceName: string;
  name?: string;
}

export async function GET(request: NextRequest) {
  console.log("🚀 Google Ads callback started (App Router)");

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

    // 1. Exchange code for tokens
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        code,
        grant_type: "authorization_code",
        redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/google-ads/callback`,
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

    const accessToken = tokens.access_token;
    const accounts: GoogleAdsAccount[] = [];

    // 2. Fetch accessible customers
    const customerRes = await fetch("https://googleads.googleapis.com/v19/customers:listAccessibleCustomers", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "developer-token": process.env.GOOGLE_ADS_DEVELOPER_TOKEN!,
      },
    });

    if (!customerRes.ok) {
      console.error("❌ Failed to fetch customer list");
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard/integrations?error=fetch_customers_failed`);
    }

    const customerData = await customerRes.json();
    console.log("🧾 Customer data:", customerData);

    if (customerData.resourceNames?.length) {
      // Get details for each account
      for (const resourceName of customerData.resourceNames) {
        const customerId = resourceName.split("/")[1];
        
        try {
          // Fetch account details
          const accountDetailsRes = await fetch(
            `https://googleads.googleapis.com/v19/customers/${customerId}/googleAds:search`,
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${accessToken}`,
                "developer-token": process.env.GOOGLE_ADS_DEVELOPER_TOKEN!,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                query: `SELECT customer.descriptive_name, customer.id FROM customer WHERE customer.id = ${customerId}`,
              }),
            }
          );

          let accountName = `Account ${customerId}`;
          if (accountDetailsRes.ok) {
            const accountDetails = await accountDetailsRes.json();
            if (accountDetails.results?.[0]?.customer?.descriptiveName) {
              accountName = accountDetails.results[0].customer.descriptiveName;
            }
          }

          accounts.push({
            customerId,
            resourceName,
            name: accountName,
          });
        } catch (error) {
          console.error(`⚠️ Failed to fetch details for account ${customerId}:`, error);
          // Still add the account with basic info
          accounts.push({
            customerId,
            resourceName,
            name: `Account ${customerId}`,
          });
        }
      }
    }

    if (accounts.length === 0) {
      console.warn("⚠️ No Google Ads accounts found");
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard/integrations?error=no_accounts`);
    }

    // 3. Store tokens temporarily for account selection
    const expiryDate = new Date(Date.now() + tokens.expires_in * 1000);
    
    // Store temporary integration data
    await prisma.googleAdsIntegration.upsert({
      where: { organizationId: orgId },
      update: {
        accessToken,
        refreshToken: tokens.refresh_token!,
        scope: tokens.scope,
        expiryDate,
        customerId: null, // Will be set when user selects account
        isActive: false, // Not active until account is selected
        lastError: null,
        updatedAt: new Date(),
      },
      create: {
        organizationId: orgId,
        accessToken,
        refreshToken: tokens.refresh_token!,
        scope: tokens.scope,
        expiryDate,
        customerId: null,
        isActive: false,
      },
    });

    // Ensure organization exists
    await prisma.organization.upsert({
      where: { id: orgId },
      update: {},
      create: {
        id: orgId,
        name: "Auto-created via Ads",
        website: null
      }
    });

    console.log("✅ Tokens stored temporarily, redirecting to account selection");

    // 4. Redirect to account selection page with accounts data
    const accountsParam = encodeURIComponent(JSON.stringify(accounts));
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/integrations/google-ads/select-account?accounts=${accountsParam}&org=${orgId}`
    );

  } catch (err: any) {
    console.error("💥 Unexpected callback error:", {
      message: err?.message,
      stack: err?.stack,
    });

    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard/integrations?error=callback_failed`);
  }
}
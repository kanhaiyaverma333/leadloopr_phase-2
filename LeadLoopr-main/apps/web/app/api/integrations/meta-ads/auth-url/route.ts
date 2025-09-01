// app/api/integrations/meta-ads/auth-url/route.ts
import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

const FACEBOOK_OAUTH_URL = "https://www.facebook.com/v19.0/dialog/oauth";
const FACEBOOK_ADS_SCOPES = [
  "ads_management",
  "ads_read",
  "email",
  "public_profile"
];

console.log("FACEBOOK_APP_ID:", process.env.FACEBOOK_APP_ID);
console.log("FACEBOOK_APP_SECRET:", process.env.FACEBOOK_APP_SECRET);
if (!process.env.FACEBOOK_APP_ID || !process.env.FACEBOOK_APP_SECRET) {
  console.error("❌ Missing Facebook OAuth environment variables");
}

export async function GET(request: NextRequest) {
  try {
    const { userId, orgId } = await auth();
    
    if (!userId || !orgId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    if (!process.env.FACEBOOK_APP_ID || !process.env.FACEBOOK_APP_SECRET) {
      return NextResponse.json(
        { error: "Facebook OAuth not configured" },
        { status: 500 }
      );
    }

    // Generate state parameter for security (includes orgId)
    const state = Buffer.from(JSON.stringify({ 
      orgId, 
      userId, 
      timestamp: Date.now() 
    })).toString('base64');

    const params = new URLSearchParams({
      client_id: process.env.FACEBOOK_APP_ID,
      redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/meta-ads/callback`,
      response_type: "code",
      scope: FACEBOOK_ADS_SCOPES.join(","),
      state: state,
    });

    const authUrl = `${FACEBOOK_OAUTH_URL}?${params.toString()}`;

    return NextResponse.json({ url: authUrl });
  } catch (error) {
    console.error("Error generating Facebook Ads auth URL:", error);
    return NextResponse.json(
      { error: "Failed to generate auth URL" },
      { status: 500 }
    );
  }
}
// app/api/integrations/microsoft-ads/auth-url/route.ts
import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

const MICROSOFT_OAUTH_URL = "https://login.microsoftonline.com/common/oauth2/v2.0/authorize";

// FIX: Use the correct scope format that Microsoft expects
const MICROSOFT_ADS_SCOPES = [
  "https://ads.microsoft.com/ads.manage",  // Changed from /.default
  "offline_access"
];

export async function GET(request: NextRequest) {
  try {
    const { userId, orgId } = await auth();
    
    if (!userId || !orgId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    // Enhanced environment validation
    const requiredEnvVars = ['MICROSOFT_CLIENT_ID', 'MICROSOFT_CLIENT_SECRET', 'MICROSOFT_DEVELOPER_TOKEN'];
    const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);
    
    if (missingEnvVars.length > 0) {
      console.error("❌ Missing environment variables:", missingEnvVars);
      return NextResponse.json(
        { error: `Missing environment variables: ${missingEnvVars.join(', ')}` },
        { status: 500 }
      );
    }
    
    // Enhanced developer token validation
    const devToken = process.env.MICROSOFT_DEVELOPER_TOKEN!;
    // if (!devToken || devToken.length < 15 || !/^[A-Za-z0-9_]+$/.test(devToken)) {
    //   console.error("❌ Invalid developer token format:", {
    //     exists: !!devToken,
    //     length: devToken?.length || 0,
    //     format: devToken ? /^[A-Za-z0-9_]+$/.test(devToken) : false
    //   });
    //   return NextResponse.json(
    //     { error: "Invalid developer token format" },
    //     { status: 500 }
    //   );
    // }

    // Generate state parameter for security (includes orgId)
    const state = Buffer.from(JSON.stringify({ 
      orgId, 
      userId, 
      timestamp: Date.now() 
    })).toString('base64');

    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/microsoft-ads/callback`;

    if (!process.env.MICROSOFT_CLIENT_ID) {
      throw new Error("Missing MICROSOFT_CLIENT_ID in environment variables");
    }

    const params = new URLSearchParams({
      client_id: process.env.MICROSOFT_CLIENT_ID,
      redirect_uri: redirectUri,
      response_type: "code",
      scope: MICROSOFT_ADS_SCOPES.join(" "),
      state,
      response_mode: "query",
      prompt: "consent", // Always ask for consent to ensure we get all scopes
    });

    const authUrl = `${MICROSOFT_OAUTH_URL}?${params.toString()}`;

    console.log("🔗 Generated Microsoft Ads auth URL:", {
      scopes: MICROSOFT_ADS_SCOPES,
      redirectUri,
      hasDevToken: !!process.env.MICROSOFT_DEVELOPER_TOKEN,
      devTokenLength: devToken.length,
      devTokenValid: /^[A-Za-z0-9_]+$/.test(devToken)
    });

    return NextResponse.json({ url: authUrl });
  } catch (error) {
    console.error("❌ Error generating Microsoft Ads auth URL:", error);
    return NextResponse.json(
      { error: "Failed to generate auth URL" },
      { status: 500 }
    );
  }
}
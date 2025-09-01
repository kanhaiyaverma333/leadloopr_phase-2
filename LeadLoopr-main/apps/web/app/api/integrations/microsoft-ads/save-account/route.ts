// app/api/integrations/microsoft-ads/save-account/route.ts
import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "../../../../../../../packages/database/generated/client";
import { auth } from "@clerk/nextjs/server";

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  try {
    // ✅ 1. Authenticate user
    const { userId, orgId } = await auth();
    if (!userId || !orgId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // ✅ 2. Parse request body
    const { accountId } = await req.json();
    if (!accountId) {
      return NextResponse.json({ error: "Missing accountId" }, { status: 400 });
    }

    // ✅ 3. Fetch existing integration
    const integration = await prisma.microsoftAdsIntegration.findUnique({
      where: { organizationId: orgId },
    });

    if (!integration) {
      return NextResponse.json(
        { error: "Microsoft Ads integration not found. Connect first." },
        { status: 404 }
      );
    }

    // ✅ 4. (Optional) Verify account access via Microsoft Ads API
    // Skip in dev if you don't want to make external calls every time
    let accountValid = true;
    try {
      const verifyRes = await fetch(
        `https://ads.microsoft.com/api/v13/customers/${integration.customerId}/accounts/${accountId}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${integration.accessToken}`,
            Accept: "application/json",
          },
        }
      );

      if (!verifyRes.ok) {
        accountValid = false;
      }
    } catch (err) {
      console.error("Microsoft Ads account verification failed:", err);
      accountValid = false;
    }

    if (!accountValid) {
      return NextResponse.json(
        { error: "Failed to verify Microsoft Ads account access." },
        { status: 403 }
      );
    }

    // ✅ 5. Update integration with account ID & mark active
    const updatedIntegration = await prisma.microsoftAdsIntegration.update({
      where: { organizationId: orgId },
      data: {
        accountId,
        isActive: true,
      },
    });

    return NextResponse.json({
      message: "Microsoft Ads account saved successfully",
      integration: updatedIntegration,
    });
  } catch (error) {
    console.error("Error saving Microsoft Ads account:", error);
    return NextResponse.json(
      { error: "Failed to save Microsoft Ads account" },
      { status: 500 }
    );
  }
}







// // app/api/integrations/microsoft-ads/save-account/route.ts
// import { auth } from "@clerk/nextjs/server";
// import { NextRequest, NextResponse } from "next/server";
// import { PrismaClient } from "../../../../../../../packages/database/generated/client";

// const prisma = new PrismaClient();

// // Helper function to parse Microsoft Ads API errors
// function parseMicrosoftAdsError(errorResponse: any): string {
//   if (typeof errorResponse === 'string') {
//     try {
//       errorResponse = JSON.parse(errorResponse);
//     } catch {
//       return errorResponse;
//     }
//   }

//   if (errorResponse.error?.message) {
//     return errorResponse.error.message;
//   }
  
//   if (errorResponse.ApiFaultDetail?.BatchErrors?.[0]) {
//     const batchError = errorResponse.ApiFaultDetail.BatchErrors[0];
//     return `${batchError.Message} (Code: ${batchError.Code})`;
//   }
  
//   if (errorResponse.ApiFaultDetail?.OperationErrors?.[0]) {
//     const opError = errorResponse.ApiFaultDetail.OperationErrors[0];
//     return `${opError.Message} (Code: ${opError.Code})`;
//   }

//   return JSON.stringify(errorResponse);
// }

// async function verifyAccountAccess(accessToken: string, accountId: string): Promise<boolean> {
//   try {
//     // FIX: Use correct API endpoint format
//     const endpoint = "https://clientcenter.api.bingads.microsoft.com/Api/CustomerManagement/v13/GetAccountsInfo";
    
//     const response = await fetch(endpoint, {
//       method: "POST",
//       headers: {
//         "Authorization": `Bearer ${accessToken}`,
//         "Content-Type": "application/json",
//         "DeveloperToken": process.env.MICROSOFT_DEVELOPER_TOKEN!,
//       },
//       body: JSON.stringify({
//         CustomerId: null, // Don't specify customer ID for GetAccountsInfo
//         OnlyParentAccounts: false,
//       }),
//     });

//     if (!response.ok) {
//       const errorText = await response.text();
//       console.error("❌ Account verification failed:", {
//         status: response.status,
//         statusText: response.statusText,
//         body: errorText
//       });
      
//       // Log the specific error for debugging
//       if (response.status === 401) {
//         console.error("❌ 401 Unauthorized - Check developer token and access token");
//       } else if (response.status === 403) {
//         console.error("❌ 403 Forbidden - Check account permissions");
//       }
      
//       return false;
//     }

//     const accountData = await response.json();
//     console.log("📊 Account verification response:", {
//       hasAccountsInfo: !!accountData.AccountsInfo,
//       accountCount: accountData.AccountsInfo?.length || 0
//     });

//     const hasAccess = accountData.AccountsInfo?.some((account: any) => 
//       account.Id?.toString() === accountId
//     );

//     console.log("🔍 Account access check:", {
//       searchingForAccountId: accountId,
//       foundAccounts: accountData.AccountsInfo?.map((a: any) => a.Id?.toString()) || [],
//       hasAccess
//     });

//     return hasAccess;
//   } catch (error) {
//     console.error("❌ Account verification error:", error);
//     return false;
//   }
// }

// export async function POST(req: NextRequest) {
//   try {
//     const { userId } = await auth();
//     if (!userId) {
//       return NextResponse.json(
//         { success: false, error: "Unauthorized" }, 
//         { status: 401 }
//       );
//     }

//     const { accountId, organizationId } = await req.json();

//     if (!accountId || !organizationId) {
//       return NextResponse.json(
//         { success: false, error: "Missing accountId or organizationId" }, 
//         { status: 400 }
//       );
//     }

//     // Validate organization ID format
//     if (!organizationId.startsWith('org_')) {
//       return NextResponse.json(
//         { success: false, error: "Invalid organization ID format" }, 
//         { status: 400 }
//       );
//     }

//     console.log("💾 Saving selected Microsoft Ads account:", {
//       accountId,
//       organizationId,
//       userId
//     });

//     // Find the temporary integration
//     const tempIntegration = await prisma.microsoftAdsIntegration.findUnique({
//       where: { organizationId },
//     });

//     if (!tempIntegration) {
//       return NextResponse.json(
//         { success: false, error: "No temporary integration found. Please restart the connection process." }, 
//         { status: 404 }
//       );
//     }

//     if (!tempIntegration.accessToken || !tempIntegration.refreshToken) {
//       return NextResponse.json(
//         { success: false, error: "Invalid integration data. Please restart the connection process." }, 
//         { status: 400 }
//       );
//     }

//     // Verify the user has access to this account ID
//     console.log("🔍 Verifying account access...");
//     const hasAccess = await verifyAccountAccess(tempIntegration.accessToken, accountId);

//     if (!hasAccess) {
//       console.warn("⚠️ User does not have access to the selected account");
//       return NextResponse.json(
//         { success: false, error: "You don't have access to this Microsoft Ads account or it may not be active" }, 
//         { status: 403 }
//       );
//     }

//     console.log("✅ Account access verified");

//     // Update the integration with the selected account ID and activate it
//     const updatedIntegration = await prisma.microsoftAdsIntegration.update({
//       where: { organizationId },
//       data: {
//         accountId,
//         isActive: true,
//         lastError: null,
//         updatedAt: new Date(),
//       },
//     });

//     console.log("✅ Microsoft Ads integration activated:", {
//       id: updatedIntegration.id,
//       organizationId: updatedIntegration.organizationId,
//       accountId: updatedIntegration.accountId,
//       isActive: updatedIntegration.isActive
//     });

//     // Optional: Try to fetch conversion goals for this account
//     console.log("🎯 Attempting to fetch conversion goals...");
//     try {
//       // FIX: Use correct endpoint and headers
//       const conversionGoalsRes = await fetch(
//         "https://bingads.api.bingads.microsoft.com/Api/Advertiser/CampaignManagement/v13/GetConversionGoals",
//         {
//           method: "POST",
//           headers: {
//             "Authorization": `Bearer ${tempIntegration.accessToken}`,
//             "Content-Type": "application/json",
//             "DeveloperToken": process.env.MICROSOFT_DEVELOPER_TOKEN!,
//             "CustomerId": accountId, // Use the account ID as customer ID
//           },
//           body: JSON.stringify({
//             ConversionGoalIds: null,
//             ConversionGoalTypes: ["UrlGoal", "EventGoal", "OfflineConversionGoal"],
//             ReturnAdditionalFields: "Revenue"
//           }),
//         }
//       );

//       if (conversionGoalsRes.ok) {
//         const conversionData = await conversionGoalsRes.json();
//         console.log("🎯 Conversion goals response:", {
//           hasConversionGoals: !!conversionData.ConversionGoals,
//           goalCount: conversionData.ConversionGoals?.length || 0
//         });

//         if (conversionData.ConversionGoals?.length > 0) {
//           const firstGoal = conversionData.ConversionGoals[0];
//           const conversionGoalId = firstGoal.Id?.toString();
          
//           if (conversionGoalId) {
//             await prisma.microsoftAdsIntegration.update({
//               where: { organizationId },
//               data: { conversionGoalId },
//             });
            
//             console.log("✅ Conversion goal ID saved:", conversionGoalId);
//           }
//         } else {
//           console.log("ℹ️ No conversion goals found for this account");
//         }
//       } else {
//         const errorText = await conversionGoalsRes.text();
//         console.warn("⚠️ Failed to fetch conversion goals:", {
//           status: conversionGoalsRes.status,
//           error: parseMicrosoftAdsError(errorText)
//         });
//       }
//     } catch (conversionError) {
//       console.warn("⚠️ Conversion goals fetch failed:", conversionError);
//       // Don't fail the whole process for this
//     }

//     return NextResponse.json({ 
//       success: true, 
//       message: "Microsoft Ads account connected successfully",
//       accountId 
//     });

//   } catch (error: any) {
//     console.error("💥 Error saving Microsoft Ads account:", {
//       message: error?.message,
//       stack: error?.stack,
//     });

//     return NextResponse.json(
//       { success: false, error: "Failed to save account. Please try again." }, 
//       { status: 500 }
//     );
//   } finally {
//     await prisma.$disconnect();
//   }
// }
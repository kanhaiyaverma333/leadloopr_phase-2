import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "../../../../../../packages/database/generated/client";
import {
  ConsentStatus,
  LeadPriority,
  LeadQualificationStatus,
} from "../../../../../../packages/database/generated/client";

const prisma = new PrismaClient();

const corsHeaders = {
  "Access-Control-Allow-Origin": "*", // replace with specific origin in production
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders,
  });
}

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const {
      name,
      email,
      phone,
      organizationId,
      // Google Ads
      gclid,
      conversionActionId,
      // Meta/Facebook
      fbclid,
      metaPixelId,
      metaEventId,
      // Microsoft Ads - NEW
      msclkid,
      microsoftConversionId,
      // UTM Parameters
      utmSource,
      utmMedium,
      utmCampaign,
      // Page & Tracking
      websiteUrl,
      landingPageUrl,
      path,
      referrerUrl,
      firstSeenAt,
      // Consent
      consentStatus,
      consentTimestamp,
      adStorageConsent,
      adUserDataConsent,
      adPersonalizationConsent,
      analyticsStorageConsent,
      // Additional
      company,
      clientIpAddress,
      clientUserAgent,
      // Lead Source (for easier filtering/reporting)
      leadSource,
    } = data;

    if (!organizationId) {
      return NextResponse.json(
        { success: false, error: "Missing organizationId" },
        { status: 400, headers: corsHeaders }
      );
    }

    // ✅ Ensure "Proposal" stage exists
    let openStage = await prisma.pipelineStage.findFirst({
      where: {
        organizationId,
        name: "Proposal",
      },
    });

    if (!openStage) {
      openStage = await prisma.pipelineStage.create({
        data: {
          organizationId,
          name: "Proposal",
          position: 0,
          color: "bg-blue-500",
        },
      });
    }

    // ✅ Create lead with all platform support
    const lead = await prisma.lead.create({
      data: {
        // Contact Information
        name,
        email,
        phone,
        company,
        organizationId,
        
        // Google Ads Attribution
        gclid,
        conversionActionId,
        
        // Meta/Facebook Attribution
        fbclid,
        metaPixelId,
        metaEventId,
        
        // Microsoft Ads Attribution - NEW
        msclkid,
        microsoftConversionId, // This will need to be added to Prisma schema
        
        // UTM Parameters (shared across platforms)
        utmSource,
        utmMedium,
        utmCampaign,
        
        // Page & Session Data
        websiteUrl,
        landingPageUrl,
        path,
        referrerUrl,
        firstSeenAt: firstSeenAt ? new Date(firstSeenAt) : undefined,
        
        // Device Information
        clientIpAddress,
        clientUserAgent,
        
        // Consent Management
        consentStatus: consentStatus || ConsentStatus.UNKNOWN,
        consentTimestamp: consentTimestamp ? new Date(consentTimestamp) : undefined,
        adStorageConsent,
        adUserDataConsent,
        adPersonalizationConsent,
        analyticsStorageConsent,
        
        // Lead Management
        qualification: LeadQualificationStatus.UNQUALIFIED,
        priority: LeadPriority.MEDIUM,
        isManual: false,
        currentStageId: openStage.id,
        
        // Optional: Store lead source for easy filtering
        // Note: This assumes you have a leadSource field in your schema
        // tags: leadSource ? [leadSource] : [],
      },
      include: {
        stage: true, // ✅ includes full stage object in response
      },
    });

    console.log(`✅ Lead created successfully:`, {
      id: lead.id,
      source: leadSource || 'Unknown',
      gclid: gclid ? '✓' : '✗',
      fbclid: fbclid ? '✓' : '✗',
      msclkid: msclkid ? '✓' : '✗',
      utm: `${utmSource}/${utmMedium}/${utmCampaign}`,
    });

    return NextResponse.json(
      { success: true, lead },
      { status: 201, headers: corsHeaders }
    );
  } catch (error) {
    console.error("❌ Error creating lead:", error);
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500, headers: corsHeaders }
    );
  }
}
export interface Card {
    id: string;
    title: string;
    description: string;
    priority: 'LOW' | 'MEDIUM' | 'HIGH';
    labels?: string[];
    value?: string;
    campaign?: string;
    trafficSource?: string;
    note?: string;
    stageId: string;
    stageName?: string;
    // Contact & Identity
    email?: string;
    phone?: string;
    // Lead Info
    qualification?: 'QUALIFIED' | 'UNQUALIFIED' | 'NEEDS_REVIEW';
    tags?: string[];
    ownerId?: string;
    isManual?: boolean;
    // Attribution & Source
    websiteUrl?: string;
    landingPageUrl?: string;
    path?: string;
    referrerUrl?: string;
    utmSource?: string;
    utmMedium?: string;
    utmCampaign?: string;
    gclid?: string;
    fbclid?: string;
    li_fat_id?: string;
    metaFbp?: string;
    gaClientId?: string;
    gaSessionId?: string;
    msclkid?: string;
    // Consent Info
    consentStatus?: 'GRANTED' | 'DENIED' | 'PARTIAL' | 'UNKNOWN';
    consentTimestamp?: string;
    adStorageConsent?: boolean;
    adUserDataConsent?: boolean;
    adPersonalizationConsent?: boolean;
    analyticsStorageConsent?: boolean;
    createdAt?: string; // ISO date string
    updatedAt?: string; // ISO date string
    stage?: {
        id: string;
        name: string;
        position: number;
        color: string;
    } | null;
    
}

export interface Column {
    id: string;
    title: string;
    color: string;
    cards: Card[];
}

// Database Lead interface to match the schema
export interface DatabaseLead {
    id: string;
    organizationId: string;
    name: string | null;
    email: string | null;
    phone: string | null;
    websiteUrl: string | null;
    landingPageUrl: string | null;
    path: string | null;
    referrerUrl: string | null;
    utmSource: string | null;
    utmMedium: string | null;
    utmCampaign: string | null;
    gclid: string | null;
    fbclid: string | null;
    li_fat_id: string | null;
    metaFbp: string | null;
    gaClientId: string | null;
    gaSessionId: string | null;
    msclkid: string | null;
    firstSeenAt: Date | null;
    consentStatus: 'GRANTED' | 'DENIED' | 'PARTIAL' | 'UNKNOWN';
    consentTimestamp: Date | null;
    adStorageConsent: boolean | null;
    adUserDataConsent: boolean | null;
    adPersonalizationConsent: boolean | null;
    analyticsStorageConsent: boolean | null;
    currentStageId: string | null;
    value: number | null;
    currency: string | null;
    priority: 'LOW' | 'MEDIUM' | 'HIGH';
    qualification: 'QUALIFIED' | 'UNQUALIFIED' | 'NEEDS_REVIEW';
    ownerId: string | null;
    tags: string[];
    isManual: boolean;
    createdAt: Date;
    updatedAt: Date;
    lastUpdatedById: string | null;
    stage?: {
        id: string;
        name: string;
        position: number;
        color: string;
    } | null;
}

// Helper function to convert database lead to UI card
export const databaseLeadToCard = (lead: DatabaseLead): Card => {
    return {
        id: lead.id,
        title: lead.name || 'Untitled Lead',
        description: '', // Not available in current schema
        priority: lead.priority,
        value: lead.value ? `€${lead.value.toLocaleString('de-DE')}` : '',
        campaign: lead.utmCampaign || '',
        trafficSource: lead.utmSource || '',
        note: '', // Not available in current schema
        stageId: lead.currentStageId || '',
        stageName: lead.stage?.name || '',
        email: lead.email || undefined,
        phone: lead.phone || undefined,
        qualification: lead.qualification,
        tags: lead.tags,
        ownerId: lead.ownerId || undefined,
        isManual: lead.isManual,
        websiteUrl: lead.websiteUrl || undefined,
        landingPageUrl: lead.landingPageUrl || undefined,
        path: lead.path || undefined,
        referrerUrl: lead.referrerUrl || undefined,
        utmSource: lead.utmSource || undefined,
        utmMedium: lead.utmMedium || undefined,
        utmCampaign: lead.utmCampaign || undefined,
        gclid: lead.gclid || undefined,
        fbclid: lead.fbclid || undefined,
        li_fat_id: lead.li_fat_id || undefined,
        metaFbp: lead.metaFbp || undefined,
        gaClientId: lead.gaClientId || undefined,
        gaSessionId: lead.gaSessionId || undefined,
        msclkid: lead.msclkid || undefined,
        consentStatus: lead.consentStatus,
        consentTimestamp: lead.consentTimestamp?.toISOString(),
        adStorageConsent: lead.adStorageConsent || undefined,
        adUserDataConsent: lead.adUserDataConsent || undefined,
        adPersonalizationConsent: lead.adPersonalizationConsent || undefined,
        analyticsStorageConsent: lead.analyticsStorageConsent || undefined,
        createdAt: lead.createdAt ? new Date(lead.createdAt).toISOString() : undefined,
        
    };
};

// Helper function to convert UI card to database lead data
export const cardToDatabaseLead = (card: Omit<Card, 'id'>, stageId: string) => {
    return {
        name: card.title,
        email: card.email,
        phone: card.phone,
        websiteUrl: card.websiteUrl,
        landingPageUrl: card.landingPageUrl,
        path: card.path,
        referrerUrl: card.referrerUrl,
        utmSource: card.utmSource,
        utmMedium: card.utmMedium,
        utmCampaign: card.utmCampaign,
        gclid: card.gclid,
        fbclid: card.fbclid,
        li_fat_id: card.li_fat_id,
        metaFbp: card.metaFbp,
        gaClientId: card.gaClientId,
        gaSessionId: card.gaSessionId,
        msclkid: card.msclkid,
        consentStatus: card.consentStatus || 'UNKNOWN',
        consentTimestamp: card.consentTimestamp ? new Date(card.consentTimestamp) : null,
        adStorageConsent: card.adStorageConsent,
        adUserDataConsent: card.adUserDataConsent,
        adPersonalizationConsent: card.adPersonalizationConsent,
        analyticsStorageConsent: card.analyticsStorageConsent,
        value: card.value ? parseFloat(card.value.replace(/[^0-9.-]+/g, '')) : null,
        currency: 'EUR', // Fixed as requested
        priority: card.priority || 'MEDIUM',
        qualification: card.qualification || 'UNQUALIFIED',
        tags: card.tags || [],
        isManual: card.isManual || true, // Manual leads when created through UI
        currentStageId: stageId,
        createdAt: card.createdAt ? new Date(card.createdAt).toISOString() : undefined,
    };
}; 
import { Lead } from '../components/LeadsTableDataTable';
import { Card } from '../components/kanban/types';

export const leadToCard = (lead: Lead): Card => {
    return {
        id: lead.id,
        title: lead.name || 'Unnamed Lead',
        description: '', // Not in Lead model, can be added if needed
        priority: lead.priority || 'MEDIUM',
        value: lead.value ? lead.value.toString() : '',
        campaign: '', // Not in Lead model
        trafficSource: '', // Not in Lead model
        note: '', // Not in Lead model
        stageId: lead.currentStageId || '',
        stageName: lead.stage?.name || '',
        email: lead.email || undefined,
        phone: lead.phone || undefined,
        tags: lead.tags || [],
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
        consentStatus: lead.consentStatus || 'UNKNOWN',
        adStorageConsent: lead.adStorageConsent || false,
        adUserDataConsent: lead.adUserDataConsent || false,
        adPersonalizationConsent: lead.adPersonalizationConsent || false,
        analyticsStorageConsent: lead.analyticsStorageConsent || false,
        isManual: lead.isManual || false,
        createdAt: lead.createdAt ? new Date(lead.createdAt).toISOString() : undefined,
    };
}; 
export interface Integration {
    id: string;
    name: string;
    description: string;
    icon: string;
    added: boolean;
    route: (orgId: string) => string;
}

export const integrations = {
    incoming: [
        {
            id: "google-tag-manager",
            name: "Google Tag Manager",
            description: "Manage and deploy marketing tags without modifying code. Track conversions, site analytics, and remarketing with ease.",
            icon: "https://cdn.simpleicons.org/googletagmanager",
            added: false,
            route: (orgId: string) => (`/api/integrations/google-auth?orgId=${orgId}`)
        }
    ],
    outgoing: [
        {
            id: "google-ads",
            name: "Google Ads",
            description: "Send conversion data to Google Ads to optimize campaigns and improve ROI. Track leads, purchases, and custom conversion events.",
            icon: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c7/Google_Ads_logo.svg/1024px-Google_Ads_logo.svg.png",
            added: false, // This will be dynamically determined
            route: (orgId: string) => (`/api/integrations/google-ads/connect`)
        },
        {
            id: 'google-analytics',
            name: 'Google Analytics 4',
            description: 'Send enhanced conversion data to Google Analytics 4 to improve attribution and measurement accuracy across your marketing channels.',
            icon: 'https://cdn.simpleicons.org/googleanalytics',
            added: false,
            route: (orgId: string) => `/dashboard/integrations/google-analytics/configure?org=${orgId}`
        },
     

        
        {
            id: "meta-ads",
            name: "Meta Ads",
            description: "Send conversion events to Meta (Facebook & Instagram) for better campaign optimization and audience targeting across Meta platforms.",
            icon: "https://cdn.simpleicons.org/meta",
            added: false,
            route: (orgId: string) => `/api/integrations/meta-ads/auth-url?orgId=${orgId}`
        },
        {
            id: "microsoft-ads",
            name: "Microsoft Ads",
            description: "Track conversions in Microsoft Advertising (Bing Ads) to optimize your search campaigns and improve performance on the Microsoft network.",
            icon: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/44/Microsoft_logo.svg/1024px-Microsoft_logo.svg.png",
            added: false,
            route: (orgId: string) => (`/api/integrations/microsoft-ads/connect`)
        }

    ]
};
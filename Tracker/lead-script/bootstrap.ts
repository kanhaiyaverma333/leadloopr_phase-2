import { getTrackerConfig, type TrackerConfig } from './config';
import { checkConsent, showConsentPopup, type ConsentStatus } from './consent';
import { initAttribution, type AttributionData } from './attribution';
import { trackForms } from './forms';

declare global {
    interface Window {
        __LEADLOOPR_INITIALIZED__?: boolean;
    }
}

async function initialize(config: TrackerConfig): Promise<void> {
    if (config.debug) {
        console.log('LeadLoopr: Starting initialization');
    }

    let consent = await checkConsent(config);

    // Always init attribution
    const attribution = initAttribution(config);

    // Always init tracking (with whatever consent we currently have)
    trackForms(config, attribution, consent);

    if (!consent.granted) {
        if (config.debug) {
            console.log('LeadLoopr: Consent not granted initially, reason:', consent.reason);
        }

        // Show popup and await user's choice
        showConsentPopup(
            async () => {
                if (config.debug) console.log('LeadLoopr: User accepted consent');

                document.cookie = `cookie-consent=true; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=None; Secure`;

                // Recheck and reinitialize tracking
                consent = await checkConsent(config);
                if (consent.granted) {
                    // Update tracking logic with latest consent
                    trackForms(config, attribution, consent);
                    if (config.debug) console.log('LeadLoopr: Tracking started after consent');
                }
            },
            async () => {
                if (config.debug) console.log('LeadLoopr: User denied consent');

                document.cookie = `cookie-consent=false; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=None; Secure`;

                // No further action
            }
        );

        return;
    }

    if (config.debug) {
        console.log('LeadLoopr: Initialization complete');
    }
}

export function bootstrap(): void {
    // Prevent double initialization
    if (window.__LEADLOOPR_INITIALIZED__) {
        console.warn('LeadLoopr: Script already initialized');
        return;
    }

    // Function to handle initialization
    const init = async () => {
        try {
            const config = getTrackerConfig();
            await initialize(config);
            window.__LEADLOOPR_INITIALIZED__ = true;
        } catch (error) {
            console.error('LeadLoopr: Initialization failed:', error);
        }
    };

    // Check if DOM is already loaded
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
}

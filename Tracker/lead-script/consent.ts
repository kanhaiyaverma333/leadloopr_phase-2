import type { TrackerConfig } from './config';

declare global {
    interface Window {
        gtag?: (
            command: string,
            action: string,
            callback?: (consent: Record<string, string>) => void
        ) => void;
    }
}

export type ConsentReason =
    | 'google-consent'
    | 'fallback-cookie'
    | 'fallback-localStorage'
    | 'explicit-deny'
    | 'none';

export interface ConsentStatus {
    granted: boolean;
    reason: ConsentReason;
}

const CONSENT_COOKIE = 'cookie-consent';
const CONSENT_STORAGE_KEY = 'leadloopr_consent';

function checkGoogleConsent(): Promise<ConsentStatus> {
    return new Promise((resolve) => {
        if (typeof window.gtag !== 'function') {
            resolve({ granted: false, reason: 'none' });
            return;
        }

        window.gtag('consent', 'get', (consent) => {
            const isGranted =
                consent?.ad_storage === 'granted' ||
                consent?.analytics_storage === 'granted' ||
                consent?.functionality_storage === 'granted';

            resolve({
                granted: isGranted,
                reason: isGranted ? 'google-consent' : 'none',
            });
        });
    });
}

function checkCookieConsent(): ConsentStatus {
    const cookies = document.cookie.split(';');
    const hasConsent = cookies.some((cookie) =>
        cookie.trim().startsWith(`${CONSENT_COOKIE}=true`)
    );

    console.log("checkCookieConsent", cookies)
    console.log("hasConsent", hasConsent)


    return {
        granted: hasConsent,
        reason: hasConsent ? 'fallback-cookie' : 'none',
    };
}

function checkLocalStorageConsent(): ConsentStatus {
    const hasConsent = localStorage.getItem(CONSENT_STORAGE_KEY) === 'true';
    return {
        granted: hasConsent,
        reason: hasConsent ? 'fallback-localStorage' : 'none',
    };
}

export async function checkConsent(config: TrackerConfig): Promise<ConsentStatus> {
    if (config.debug) {
        console.log('LeadLoopr: Checking consent status...');
    }

    // // First try Google Consent Mode
    const googleConsent = await checkGoogleConsent();
    if (googleConsent.granted) {
        if (config.debug) {
            console.log('LeadLoopr: Consent granted via Google Consent Mode');
        }
        return googleConsent;
    }

    // Check if consent fallback is enabled
    if (!config.featureFlags.allowConsentFallback) {
        if (config.debug) {
            console.log('LeadLoopr: Consent fallback disabled, no consent granted');
        }
        return { granted: false, reason: 'none' };
    }

    // Then try cookie fallback
    const cookieConsent = checkCookieConsent();
    if (cookieConsent.granted) {
        if (config.debug) {
            console.log('LeadLoopr: Consent granted via cookie');
        }
        return cookieConsent;
    }

    // Finally try localStorage fallback
    const storageConsent = checkLocalStorageConsent();
    if (storageConsent.granted) {
        if (config.debug) {
            console.log('LeadLoopr: Consent granted via localStorage');
        }
        return storageConsent;
    }

    if (config.debug) {
        console.log('LeadLoopr: No consent granted');
    }
    return { granted: false, reason: 'none' };
} 

export function showConsentPopup(onAccept: () => void, onReject: () => void) {
  const popup = document.createElement("div");
  popup.id = "leadloopr-consent-banner";
  popup.style.cssText = `
    position: fixed;
    bottom: 30px;
    right: 30px;
    width: 320px;
    padding: 20px 24px;
    background: #ffffff;
    border: 1px solid #e0e0e0;
    border-radius: 12px;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
    font-family: 'Segoe UI', Roboto, sans-serif;
    z-index: 9999;
    display: flex;
    flex-direction: column;
    gap: 16px;
    font-size: 14px;
    color: #333;
  `;

  popup.innerHTML = `
    <div style="line-height: 1.5;">
      <strong>We use cookies & tracking</strong><br/>
      This site uses a tracker to capture form and attribution data. Please accept to help us provide a better experience.
    </div>
    <div style="display: flex; justify-content: flex-end; gap: 10px;">
      <button id="llp-reject" style="
        padding: 8px 16px;
        background: #f5f5f5;
        border: 1px solid #ccc;
        border-radius: 6px;
        cursor: pointer;
        font-weight: 500;
      ">Decline</button>
      <button id="llp-accept" style="
        padding: 8px 16px;
        background: #007bff;
        color: white;
        border: none;
        border-radius: 6px;
        cursor: pointer;
        font-weight: 500;
      ">Accept</button>
    </div>
  `;

  document.body.appendChild(popup);

  document.getElementById("llp-accept")?.addEventListener("click", () => {
    popup.remove();
    onAccept();
  });

  document.getElementById("llp-reject")?.addEventListener("click", () => {
    popup.remove();
    onReject();
  });
}



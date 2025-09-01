import type { TrackerConfig } from './config';
import type { AttributionData } from './attribution';
import { checkConsent, type ConsentStatus } from './consent';
import { filterFormDataForConsent } from './extractor';
import { sendLeadPayload } from './payload';

interface FormData {
    name?: string;
    email?: string;
    phone?: string;
    [key: string]: string | undefined;
}

// Common field name variations
const FIELD_PATTERNS: Record<string, string[]> = {
    name: ['name', 'full_name', 'first_name', 'last_name', 'fullname', 'fullName'],
    email: ['email', 'user_email', 'userEmail', 'e-mail', 'mail'],
    phone: ['phone', 'tel', 'telephone', 'mobile', 'cell'],
} as const;

function normalizeFieldName(name: string): string {
    return name.toLowerCase().replace(/[_-]/g, '');
}

function extractFieldValue(form: HTMLFormElement, patterns: string[]): string | undefined {
    for (const pattern of patterns) {
        const input = form.querySelector(`[name="${pattern}"], [id="${pattern}"], [name*="${pattern}"], [id*="${pattern}"]`) as HTMLInputElement;
        if (input?.value) {
            return input.value.trim();
        }
    }
    return undefined;
}

function extractFormData(form: HTMLFormElement): FormData {
    const formData = new FormData(form);
    const data: FormData = {};

    // // Extract standard fields
    // Object.entries(FIELD_PATTERNS).forEach(([field, patterns]) => {
    //     const value = extractFieldValue(form, patterns);
    //     if (value) {
    //         data[field] = value;
    //     }
    // });

    // Extract any additional fields
    formData.forEach((value, key) => {
        if (typeof value === 'string' && value.trim()) {
            data[key] = value.trim();
        }
    });

    return data;
}

async function handleFormSubmit(
  event: SubmitEvent,
  config: TrackerConfig,
  attribution: AttributionData
): Promise<void> {
  const form = event.target as HTMLFormElement;

  // Prevent duplicate handling
  if (form.hasAttribute('data-leadloopr-tracked')) {
    return;
  }
  form.setAttribute('data-leadloopr-tracked', 'true');

  // ⬅️ Always fetch the latest consent
  const consent = await checkConsent(config);

  let filteredData: Record<string, string> = {};
  let excluded: string[] = [];

  if (consent.granted) {
    const rawFormData = extractFormData(form);
    const result = filterFormDataForConsent(rawFormData, consent, config.debug);
    filteredData = result.data;
    excluded = result.excluded;

    if (config.debug) {
      console.log('LeadLoopr: Consent granted, submitting form data:', {
        form: form.id || form.name || 'unnamed',
        rawData: rawFormData,
        filteredData,
        excluded,
        attribution,
      });
    }
  } else {
    if (config.debug) {
      console.log('LeadLoopr: Consent not granted, submitting form with empty data');
    }
  }

  // Send payload to backend regardless
  await sendLeadPayload(
    {
      org_id: config.orgId,
      timestamp: Date.now(),
      attribution,
      consent,
      form_data: filteredData,
    },
    config.endpoint,
    config.debug
  );
}

export function trackForms(
    config: TrackerConfig,
    attribution: AttributionData,
    consent: ConsentStatus
): void {
    if (config.debug) {
        console.log('LeadLoopr: Initializing form tracking');
    }

    // Find all forms
    const forms = document.querySelectorAll('form');

    if (config.debug) {
        console.log(`LeadLoopr: Found ${forms.length} forms to track`);
    }

    // Attach submit listeners
    forms.forEach((form) => {
        form.addEventListener('submit', (event) =>
            handleFormSubmit(event, config, attribution)
        );
    });

    // Handle dynamically added forms only if enabled
    if (config.featureFlags.allowDynamicForms) {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (node instanceof HTMLElement) {
                        const forms = node.querySelectorAll('form');
                        forms.forEach((form) => {
                            if (!form.hasAttribute('data-leadloopr-tracked')) {
                                form.addEventListener('submit', (event) =>
                                    handleFormSubmit(event, config, attribution)
                                );
                            }
                        });
                    }
                });
            });
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true,
        });

        if (config.debug) {
            console.log('LeadLoopr: Dynamic form tracking enabled');
        }
    } else if (config.debug) {
        console.log('LeadLoopr: Dynamic form tracking disabled');
    }

    if (config.debug) {
        console.log('LeadLoopr: Form tracking initialized');
    }
} 
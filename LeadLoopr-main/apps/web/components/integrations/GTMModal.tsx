import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Download, Copy, X } from "lucide-react";
import { useOrganization } from "@clerk/nextjs";

interface GTMModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GTMModal = ({ isOpen, onClose }: GTMModalProps) => {
  const { organization } = useOrganization();
  const [orgId, setOrgId] = useState(organization?.id || 'dummy-org-id-12345');
  const [copied, setCopied] = useState(false);

  // GTM Template JSON
  const gtmTemplate = {
    "exportFormatVersion": 2,
    "exportTime": "2024-01-15 12:00:00 UTC",
    "containerVersion": {
      "path": "accounts/123456789/containers/12345678/versions/1",
      "accountId": "123456789",
      "containerId": "12345678",
      "containerVersionId": "1",
      "name": "Lead Loopr GTM Template",
      "container": {
        "path": "accounts/123456789/containers/12345678",
        "accountId": "123456789",
        "containerId": "12345678",
        "name": "Lead Loopr Integration",
        "publicId": "GTM-XXXXXXX",
        "usageContext": ["WEB"],
        "fingerprint": "1234567890",
        "tagManagerUrl": "https://tagmanager.google.com/"
      },
      "tag": [
        {
          "accountId": "123456789",
          "containerId": "12345678",
          "tagId": "1",
          "name": "Lead Loopr Lead Tracking",
          "type": "html",
          "parameter": [
            {
              "type": "TEMPLATE",
              "key": "html",
              "value": `<script>\n(function() {\n  // Lead Loopr Lead Tracking\n  var Lead LooprEndpoint = 'https://api.Lead Loopr.com/webhooks/gtm/' + '${orgId}';\n  \n  // Get form data from dataLayer\n  var leadData = {\n    email: {{Email}},\n    phone: {{Phone}},\n    name: {{Name}},\n    source: {{Source}},\n    campaign: {{Campaign}},\n    timestamp: new Date().toISOString(),\n    page_url: window.location.href,\n    referrer: document.referrer\n  };\n  \n  // Send to Lead Loopr\n  fetch(Lead LooprEndpoint, {\n    method: 'POST',\n    headers: {\n      'Content-Type': 'application/json',\n    },\n    body: JSON.stringify(leadData)\n  }).then(function(response) {\n    console.log('Lead sent to Lead Loopr:', response.status);\n  }).catch(function(error) {\n    console.error('Error sending lead to Lead Loopr:', error);\n  });\n})();\n</script>`
            }
          ],
          "fingerprint": "1234567890",
          "firingTriggerId": ["2"],
          "tagFiringOption": "ONCE_PER_EVENT"
        }
      ],
      "trigger": [
        {
          "accountId": "123456789",
          "containerId": "12345678",
          "triggerId": "2",
          "name": "Form Submission Trigger",
          "type": "CUSTOM_EVENT",
          "customEventFilter": [
            {
              "type": "EQUALS",
              "parameter": [
                {
                  "type": "TEMPLATE",
                  "key": "arg0",
                  "value": "{{Event}}"
                },
                {
                  "type": "TEMPLATE",
                  "key": "arg1",
                  "value": "submit_lead_form"
                }
              ]
            }
          ],
          "fingerprint": "1234567890"
        }
      ],
      "variable": [
        {
          "accountId": "123456789",
          "containerId": "12345678",
          "variableId": "3",
          "name": "Email",
          "type": "v",
          "parameter": [
            {
              "type": "INTEGER",
              "key": "dataLayerVersion",
              "value": "2"
            },
            {
              "type": "BOOLEAN",
              "key": "setDefaultValue",
              "value": "false"
            },
            {
              "type": "TEMPLATE",
              "key": "name",
              "value": "email"
            }
          ],
          "fingerprint": "1234567890"
        },
        {
          "accountId": "123456789",
          "containerId": "12345678",
          "variableId": "4",
          "name": "Phone",
          "type": "v",
          "parameter": [
            {
              "type": "INTEGER",
              "key": "dataLayerVersion",
              "value": "2"
            },
            {
              "type": "BOOLEAN",
              "key": "setDefaultValue",
              "value": "false"
            },
            {
              "type": "TEMPLATE",
              "key": "name",
              "value": "phone"
            }
          ],
          "fingerprint": "1234567890"
        },
        {
          "accountId": "123456789",
          "containerId": "12345678",
          "variableId": "5",
          "name": "Name",
          "type": "v",
          "parameter": [
            {
              "type": "INTEGER",
              "key": "dataLayerVersion",
              "value": "2"
            },
            {
              "type": "BOOLEAN",
              "key": "setDefaultValue",
              "value": "false"
            },
            {
              "type": "TEMPLATE",
              "key": "name",
              "value": "name"
            }
          ],
          "fingerprint": "1234567890"
        },
        {
          "accountId": "123456789",
          "containerId": "12345678",
          "variableId": "6",
          "name": "Source",
          "type": "v",
          "parameter": [
            {
              "type": "INTEGER",
              "key": "dataLayerVersion",
              "value": "2"
            },
            {
              "type": "BOOLEAN",
              "key": "setDefaultValue",
              "value": "false"
            },
            {
              "type": "TEMPLATE",
              "key": "name",
              "value": "source"
            }
          ],
          "fingerprint": "1234567890"
        },
        {
          "accountId": "123456789",
          "containerId": "12345678",
          "variableId": "7",
          "name": "Campaign",
          "type": "v",
          "parameter": [
            {
              "type": "INTEGER",
              "key": "dataLayerVersion",
              "value": "2"
            },
            {
              "type": "BOOLEAN",
              "key": "setDefaultValue",
              "value": "false"
            },
            {
              "type": "TEMPLATE",
              "key": "name",
              "value": "campaign"
            }
          ],
          "fingerprint": "1234567890"
        }
      ],
      "fingerprint": "1234567890"
    }
  };

  const handleDownloadTemplate = () => {
    // Update the template with current org ID
    const updatedTemplate = { ...gtmTemplate };
    const htmlContent = updatedTemplate.containerVersion.tag[0].parameter[0].value;
    updatedTemplate.containerVersion.tag[0].parameter[0].value = htmlContent.replace(/\$\{orgId\}/g, orgId);

    const blob = new Blob([JSON.stringify(updatedTemplate, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `leadloopr-gtm-template-${orgId}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleCopyOrgId = async () => {
    try {
      await navigator.clipboard.writeText(orgId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <img
              src="https://cdn.simpleicons.org/googletagmanager"
              alt="GTM"
              className="w-6 h-6"
            />
            Add Google Tag Manager Integration
          </DialogTitle>
          <button
            onClick={onClose}
          //className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none"
          >
            {/* <X className="h-4 w-4" /> */}
          </button>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Download our step-by-step setup guide to implement our Google Tag Manager template. This guide will help you
            track conversions, leads, and user interactions efficiently.{' '}
            <a
              href="#"
              className="text-blue-600 hover:underline"
              onClick={(e) => e.preventDefault()}
            >
              Learn more about the integration
            </a>
          </p>

          <Button
            onClick={handleDownloadTemplate}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Download className="w-4 h-4 mr-2" />
            Download Template
          </Button>

          <div className="space-y-2">
            <Label htmlFor="orgId" className="text-sm font-medium">
              Organization ID
            </Label>
            <div className="flex gap-2">
              <Input
                id="orgId"
                value={orgId}
                onChange={(e) => setOrgId(e.target.value)}
                placeholder="Enter your organization ID"
                className="flex-1"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyOrgId}
                className="px-3"
              >
                <Copy className="w-4 h-4" />
                {copied && <span className="ml-1 text-xs">Copied!</span>}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              This ID will be used in the GTM template to send data to your Lead Loopr account.
            </p>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">Setup Instructions:</h4>
            <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
              <li>Download the template above</li>
              <li>Go to your GTM workspace</li>
              <li>Click "Admin" → "Import Container"</li>
              <li>Upload the downloaded JSON file</li>
              <li>Review and publish the changes</li>
            </ol>
          </div>

          <div className="bg-amber-50 p-4 rounded-lg">
            <h4 className="font-medium text-amber-900 mb-2">⚠️ Important:</h4>
            <p className="text-sm text-amber-800">
              Make sure your website pushes form submission events to the dataLayer with the event name{' '}
              <code className="bg-amber-200 px-1 rounded">'submit_lead_form'</code> for the tracking to work properly.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
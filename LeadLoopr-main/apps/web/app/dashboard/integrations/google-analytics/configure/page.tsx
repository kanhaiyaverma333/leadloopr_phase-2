'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Loader2, AlertCircle, CheckCircle, ArrowLeft, ExternalLink, Info } from 'lucide-react';

interface FormData {
  integrationName: string;
  measurementId: string;
  apiSecret: string;
}

interface ValidationErrors {
  integrationName?: string;
  measurementId?: string;
  apiSecret?: string;
}

export default function GoogleAnalyticsConfigurePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orgId = searchParams.get('org');

  const [formData, setFormData] = useState<FormData>({
    integrationName: 'LeadLoopr - GA4 Integration',
    measurementId: '',
    apiSecret: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState(false);
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});

  useEffect(() => {
    if (!orgId || !orgId.startsWith('org_')) {
      router.push('/dashboard/integrations?error=invalid_org');
    }
  }, [orgId, router]);

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError('');

    // Clear specific field validation error
    if (validationErrors[field]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const validateForm = (): boolean => {
    const errors: ValidationErrors = {};

    if (!formData.integrationName.trim()) {
      errors.integrationName = 'Integration name is required';
    }

    if (!formData.measurementId.trim()) {
      errors.measurementId = 'Measurement ID is required';
    } else if (!formData.measurementId.match(/^G-[A-Z0-9]{10}$/)) {
      errors.measurementId = 'Invalid format. Should be G-XXXXXXXXXX (e.g., G-ABC1234567)';
    }

    if (!formData.apiSecret.trim()) {
      errors.apiSecret = 'API Secret is required';
    } else if (formData.apiSecret.length < 10) {
      errors.apiSecret = 'API Secret seems too short. Please verify.';
    }

    setValidationErrors(errors);

    if (Object.keys(errors).length > 0) {
      setError('Please fix the validation errors below');
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    setError('');

    try {
      const response = await fetch('/api/integrations/google-analytics/configure', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          organizationId: orgId,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to configure integration');
      }

      setSuccess(true);

      // Redirect to integrations page after 3 seconds
      setTimeout(() => {
        router.push('/dashboard/integrations?success=ga4_configured');
      }, 3000);

    } catch (err: any) {
      const errorMessage = err instanceof Error ? err.message : 'Configuration failed';
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    router.push('/dashboard/integrations');
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
            <CardTitle className="text-green-600">Integration Configured!</CardTitle>
            <CardDescription>
              Your Google Analytics 4 integration has been configured successfully.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-muted p-4 rounded-lg mb-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Integration:</span>
                <span className="font-medium">{formData.integrationName}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Measurement ID:</span>
                <span className="font-medium">{formData.measurementId}</span>
              </div>
            </div>
            <p className="text-center text-sm text-gray-500">
              Redirecting to integrations page in 3 seconds...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <Button
            onClick={handleCancel}
            variant="ghost"
            className="mb-4"
            disabled={isSubmitting}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Integrations
          </Button>

          <div className="text-center">
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Configure Google Analytics 4
            </h1>
            <p className="text-muted-foreground mb-8">
              Complete your GA4 integration by providing the required details below
            </p>
          </div>
        </div>

        {/* Instructions Card */}
        <Card className="mb-8 bg-accent border-border">
          <CardContent className="p-6">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="space-y-3">
                <h3 className="font-semibold text-blue-900">How to find your GA4 details:</h3>
                <ol className="list-decimal list-inside space-y-1 text-sm text-blue-800">
                  <li>Go to your <strong>Google Analytics 4</strong> property</li>
                  <li>Navigate to <strong>Admin → Data Streams</strong></li>
                  <li>Click on your web data stream</li>
                  <li>Copy the <strong>Measurement ID</strong> (starts with G-)</li>
                  <li>Go to <strong>Admin → Data Streams → Measurement Protocol API secrets</strong></li>
                  <li>Create a new API secret and copy the secret value</li>
                </ol>
                <a
                  href="https://support.google.com/analytics/answer/9310895"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  <ExternalLink className="w-3 h-3 mr-1" />
                  Learn more about GA4 Measurement Protocol
                </a>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Configuration Form Card */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Integration Configuration</CardTitle>
            <CardDescription>
              Enter your GA4 details to complete the setup
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Integration Name */}
            <div className="space-y-2">
              <Label htmlFor="integrationName" className="text-sm font-medium">
                Integration Name
              </Label>
              <Input
                id="integrationName"
                type="text"
                value={formData.integrationName}
                onChange={(e) => handleInputChange('integrationName', e.target.value)}
                placeholder="e.g., LeadLoopr - GA4 Integration"
                className={validationErrors.integrationName ? 'border-red-500 focus:border-red-500' : ''}
                disabled={isSubmitting}
              />
              {validationErrors.integrationName && (
                <p className="text-red-600 text-sm flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {validationErrors.integrationName}
                </p>
              )}
            </div>

            {/* Measurement ID */}
            <div className="space-y-2">
              <Label htmlFor="measurementId" className="text-sm font-medium">
                GA4 Measurement ID
              </Label>
              <Input
                id="measurementId"
                type="text"
                value={formData.measurementId}
                onChange={(e) => handleInputChange('measurementId', e.target.value.toUpperCase())}
                placeholder="G-XXXXXXXXXX"
                className={validationErrors.measurementId ? 'border-red-500 focus:border-red-500' : ''}
                disabled={isSubmitting}
              />
              {validationErrors.measurementId && (
                <p className="text-red-600 text-sm flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {validationErrors.measurementId}
                </p>
              )}
              <p className="text-gray-500 text-sm">
                Found in GA4 → Admin → Data Streams → [Your Stream] → Measurement ID
              </p>
            </div>

            {/* API Secret */}
            <div className="space-y-2">
              <Label htmlFor="apiSecret" className="text-sm font-medium">
                Measurement Protocol API Secret
              </Label>
              <Input
                id="apiSecret"
                type="password"
                value={formData.apiSecret}
                onChange={(e) => handleInputChange('apiSecret', e.target.value)}
                placeholder="Enter your API secret..."
                className={validationErrors.apiSecret ? 'border-red-500 focus:border-red-500' : ''}
                disabled={isSubmitting}
              />
              {validationErrors.apiSecret && (
                <p className="text-red-600 text-sm flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {validationErrors.apiSecret}
                </p>
              )}
              <p className="text-gray-500 text-sm">
                Create in GA4 → Admin → Data Streams → [Your Stream] → Measurement Protocol API secrets
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-500" />
              <span className="text-red-700 font-medium">Error</span>
            </div>
            <p className="text-red-600 mt-1">{error}</p>
          </div>
        )}

        {/* Action Bar */}
        <div className="flex justify-between items-center bg-card p-6 rounded-lg border">
          <div>
            <h3 className="font-semibold text-foreground mb-1">
              Ready to Configure?
            </h3>
            <p className="text-sm text-muted-foreground">
              Make sure all fields are filled correctly before proceeding
            </p>
          </div>

          <div className="flex gap-3">
            <Button
              onClick={handleCancel}
              variant="outline"
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="bg-blue-600 hover:bg-blue-700 min-w-[120px]"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Configuring...
                </>
              ) : (
                'Complete Setup'
              )}
            </Button>
          </div>
        </div>

        {/* Help Section */}
        <Card className="mt-8 bg-muted">
          <CardContent className="p-6">
            <h3 className="font-medium text-foreground mb-3">
              Need Help?
            </h3>
            <div className="grid md:grid-cols-2 gap-4 text-sm text-muted-foreground">
              <div className="space-y-1">
                <p>• Make sure you have admin access to your GA4 property</p>
                <p>• The Measurement ID should start with "G-" followed by 10 characters</p>
              </div>
              <div className="space-y-1">
                <p>• API secrets are case-sensitive - copy them exactly</p>
                <p>• You can create multiple API secrets if needed</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react';

interface FacebookAdAccount {
  id: string;
  name: string;
  account_status: number;
  currency: string;
}

export default function SelectFacebookAdsAccount() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [accounts, setAccounts] = useState<FacebookAdAccount[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [orgId, setOrgId] = useState<string | null>(null);

  useEffect(() => {
    const accountsParam = searchParams.get('accounts');
    const orgParam = searchParams.get('org');

    if (!accountsParam || !orgParam) {
      setError('Missing required parameters');
      return;
    }

    try {
      const parsedAccounts = JSON.parse(decodeURIComponent(accountsParam));
      setAccounts(parsedAccounts);
      setOrgId(orgParam);

      if (parsedAccounts.length === 1) {
        setSelectedAccount(parsedAccounts[0].id);
      }
    } catch (err) {
      console.error('Failed to parse accounts:', err);
      setError('Failed to load accounts');
    }
  }, [searchParams]);

  const handleAccountSelect = (adAccountId: string) => {
    setSelectedAccount(adAccountId);
  };

  const handleConfirmSelection = async () => {
    if (!selectedAccount || !orgId) {
      setError('Please select an account');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/integrations/meta-ads/save-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adAccountId: selectedAccount, organizationId: orgId }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to save account');
      }

      router.push('/dashboard/integrations?success=facebook_ads_connected');
    } catch (err: any) {
      console.error('Failed to save account:', err);
      setError(err.message || 'Failed to save account');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    router.push('/dashboard/integrations?cancelled=facebook_ads');
  };

  const getAccountStatusBadge = (status: number) => {
    switch (status) {
      case 1:
        return <Badge variant="secondary" className="text-green-700 bg-green-100">Active</Badge>;
      case 2:
        return <Badge variant="secondary" className="text-yellow-700 bg-yellow-100">Disabled</Badge>;
      case 3:
        return <Badge variant="secondary" className="text-red-700 bg-red-100">Unsettled</Badge>;
      case 7:
        return <Badge variant="secondary" className="text-orange-700 bg-orange-100">Pending Risk Review</Badge>;
      case 9:
        return <Badge variant="secondary" className="text-purple-700 bg-purple-100">Pending Settlement</Badge>;
      case 100:
        return <Badge variant="secondary" className="text-red-700 bg-red-100">Closed</Badge>;
      default:
        return <Badge variant="secondary" className="text-gray-700 bg-gray-100">Unknown</Badge>;
    }
  };

  if (error && accounts.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <CardTitle className="text-red-600">Error Loading Accounts</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleCancel} variant="outline" className="w-full">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Integrations
            </Button>
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
            disabled={isLoading}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Integrations
          </Button>

          <div className="text-center">
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Select Facebook Ad Account
            </h1>
            <p className="text-muted-foreground mb-8">
              Choose which Facebook Ad account you want to connect for conversion tracking and campaign management
            </p>
          </div>
        </div>

        {accounts.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <AlertCircle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
              <CardTitle className="mb-2">No Facebook Ad Accounts Found</CardTitle>
              <CardDescription>
                We couldn't find any active Facebook Ad accounts associated with your Facebook account.
                Make sure you have the necessary permissions to access the ad accounts.
              </CardDescription>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="grid gap-4 mb-8">
              {accounts.map((account) => (
                <Card
                  key={account.id}
                  className={`cursor-pointer transition-all duration-200 hover:shadow-md ${selectedAccount === account.id
                      ? 'ring-2 ring-blue-500 border-blue-500 bg-accent'
                      : 'border-border hover:border-border/80'
                    } ${account.account_status !== 1 ? 'opacity-75' : ''}`}
                  onClick={() => account.account_status === 1 && handleAccountSelect(account.id)}
                >
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-foreground">
                            {account.name}
                          </h3>
                          {selectedAccount === account.id && (
                            <CheckCircle className="w-5 h-5 text-blue-500" />
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
                          <div>
                            <span className="font-medium">Ad Account ID:</span> {account.id}
                          </div>
                          <div>
                            <span className="font-medium">Currency:</span> {account.currency}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {getAccountStatusBadge(account.account_status)}
                          <Badge variant="outline" className="text-xs">
                            Facebook Ad Account
                          </Badge>
                          {account.account_status !== 1 && (
                            <Badge variant="destructive" className="text-xs">
                              Cannot Connect
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    {account.account_status !== 1 && (
                      <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                        <p className="text-xs text-yellow-800">
                          This account is not active and cannot be selected. Only active accounts can be connected.
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-red-500" />
                  <span className="text-red-700 font-medium">Error</span>
                </div>
                <p className="text-red-600 mt-1">{error}</p>
              </div>
            )}

            <div className="flex justify-between items-center bg-card p-6 rounded-lg border">
              <div>
                <h3 className="font-semibold text-foreground mb-1">
                  {selectedAccount ? 'Account Selected' : 'Select an Account'}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {selectedAccount
                    ? `You've selected ad account ${selectedAccount}`
                    : 'Choose an active Facebook Ad account to continue'}
                </p>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={handleCancel}
                  variant="outline"
                  disabled={isLoading}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleConfirmSelection}
                  disabled={!selectedAccount || isLoading}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {isLoading ? 'Connecting...' : 'Connect Account'}
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
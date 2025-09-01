// lib/mircrosoft-ads/microsoft-ads-token-manager.ts
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

interface TokenRefreshResponse {
  access_token: string;
  expires_in: number;
  scope: string;
  token_type: string;
}

export class MicrosoftAdsTokenManager {
  /**
   * Get a valid access token for an organization
   * Automatically refreshes if token is expired
   */
  static async getValidAccessToken(organizationId: string): Promise<string | null> {
    try {
      const integration = await prisma.microsoftAdsIntegration.findUnique({
        where: { organizationId },
      });

      if (!integration) {
        return null;
      }

      // Check if token is expired (with 5 minute buffer)
      const bufferTime = 5 * 60 * 1000; // 5 minutes in milliseconds
      const isExpired = integration.expiryDate && 
        (integration.expiryDate.getTime() - bufferTime) < Date.now();

      if (isExpired) {
        // Refresh the token
        const newAccessToken = await this.refreshAccessToken(organizationId);
        return newAccessToken;
      }

      return integration.accessToken;
    } catch (error) {
      console.error('Error getting valid access token:', error);
      return null;
    }
  }

  /**
   * Refresh an expired access token
   */
  static async refreshAccessToken(organizationId: string): Promise<string | null> {
    try {
      const integration = await prisma.microsoftAdsIntegration.findUnique({
        where: { organizationId },
      });

      if (!integration?.refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await fetch('https://login.microsoftonline.com/common/oauth2/v2.0/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: process.env.MICROSOFT_CLIENT_ID!,
          client_secret: process.env.MICROSOFT_CLIENT_SECRET!,
          refresh_token: integration.refreshToken,
          grant_type: 'refresh_token',
          scope: 'https://ads.microsoft.com/msads.manage',
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Token refresh failed:', errorText);
        
        // Mark integration as inactive if refresh fails
        await prisma.microsoftAdsIntegration.update({
          where: { organizationId },
          data: {
            isActive: false,
            lastError: `Token refresh failed: ${errorText}`,
            updatedAt: new Date(),
          },
        });
        
        return null;
      }

      const tokens: TokenRefreshResponse = await response.json();
      
      // Calculate new expiry date
      const expiryDate = new Date(Date.now() + tokens.expires_in * 1000);

      // Update the integration with new token
      await prisma.microsoftAdsIntegration.update({
        where: { organizationId },
        data: {
          accessToken: tokens.access_token,
          expiryDate: expiryDate,
          scope: tokens.scope,
          isActive: true,
          lastError: null,
          updatedAt: new Date(),
        },
      });

      return tokens.access_token;
    } catch (error) {
      console.error('Error refreshing access token:', error);
      
      // Log the error in the database
      await prisma.microsoftAdsIntegration.update({
        where: { organizationId },
        data: {
          isActive: false,
          lastError: error instanceof Error ? error.message : 'Unknown error',
          updatedAt: new Date(),
        },
      }).catch(console.error);

      return null;
    }
  }

  /**
   * Test if the access token is valid by making a simple API call
   */
  static async testAccessToken(accessToken: string): Promise<boolean> {
    try {
      const response = await fetch('https://clientcenter.api.bingads.microsoft.com/Api/CustomerManagement/v13/CustomerManagementService.svc/GetUser', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'DeveloperToken': process.env.MICROSOFT_DEVELOPER_TOKEN!,
        },
        body: JSON.stringify({}),
      });

      return response.ok;
    } catch (error) {
      console.error('Error testing access token:', error);
      return false;
    }
  }

  /**
   * Get Microsoft Ads customer accounts for an organization
   */
  static async getCustomerAccounts(organizationId: string): Promise<any[] | null> {
    try {
      const accessToken = await this.getValidAccessToken(organizationId);
      
      if (!accessToken) {
        return null;
      }

      const response = await fetch('https://clientcenter.api.bingads.microsoft.com/Api/CustomerManagement/v13/CustomerManagementService.svc/GetAccountsInfo', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'DeveloperToken': process.env.MICROSOFT_DEVELOPER_TOKEN!,
        },
        body: JSON.stringify({
          CustomerId: null,
          OnlyParentAccounts: false,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch customer accounts: ${response.statusText}`);
      }

      const data = await response.json();
      return data.AccountsInfo || [];
    } catch (error) {
      console.error('Error getting customer accounts:', error);
      return null;
    }
  }

  /**
   * Revoke access token and remove integration
   */
  static async revokeAccess(organizationId: string): Promise<boolean> {
    try {
      const integration = await prisma.microsoftAdsIntegration.findUnique({
        where: { organizationId },
      });

      if (!integration) {
        return true; // Already removed
      }

      // Microsoft doesn't have a direct revoke endpoint like Google
      // Just remove from database
      await prisma.microsoftAdsIntegration.delete({
        where: { organizationId },
      });

      return true;
    } catch (error) {
      console.error('Error revoking access:', error);
      return false;
    }
  }
}
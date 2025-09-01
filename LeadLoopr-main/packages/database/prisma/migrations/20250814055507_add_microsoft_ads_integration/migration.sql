/*
  Warnings:

  - You are about to drop the `MicrosoftAdsIntegration` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "MicrosoftAdsIntegration";

-- CreateTable
CREATE TABLE "microsoft_ads_integrations" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "accessToken" TEXT NOT NULL,
    "refreshToken" TEXT NOT NULL,
    "scope" TEXT,
    "expiryDate" TIMESTAMP(3),
    "accountId" TEXT,
    "customerId" TEXT,
    "conversionGoalId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "lastError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "microsoft_ads_integrations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "microsoft_ads_integrations_organizationId_key" ON "microsoft_ads_integrations"("organizationId");

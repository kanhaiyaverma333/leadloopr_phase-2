/*
  Warnings:

  - A unique constraint covering the columns `[stripeCustomerId]` on the table `Organization` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[stripeSubscriptionId]` on the table `Organization` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `updatedAt` to the `Organization` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('TRIAL', 'ACTIVE', 'PAST_DUE', 'CANCELED', 'INCOMPLETE', 'EXPIRED');

-- CreateEnum
CREATE TYPE "UsageType" AS ENUM ('LEADS_PROCESSED', 'TEAM_MEMBERS_ADDED', 'API_CALLS', 'INTEGRATIONS_USED');

-- AlterTable
ALTER TABLE "Organization" ADD COLUMN     "billingEmail" TEXT,
ADD COLUMN     "currentPeriodLeads" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "currentTeamMembers" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "isSubscriptionActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "lastBillingDate" TIMESTAMP(3),
ADD COLUMN     "maxTeamMembers" INTEGER NOT NULL DEFAULT 3,
ADD COLUMN     "monthlyLeadLimit" INTEGER NOT NULL DEFAULT 100,
ADD COLUMN     "nextBillingDate" TIMESTAMP(3),
ADD COLUMN     "stripeCustomerId" TEXT,
ADD COLUMN     "stripePriceId" TEXT,
ADD COLUMN     "stripeSubscriptionId" TEXT,
ADD COLUMN     "subscriptionPeriodEnd" TIMESTAMP(3),
ADD COLUMN     "subscriptionStatus" "SubscriptionStatus" NOT NULL DEFAULT 'TRIAL',
ADD COLUMN     "trialEndsAt" TIMESTAMP(3),
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- CreateTable
CREATE TABLE "UsageMetric" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "metricType" "UsageType" NOT NULL,
    "value" INTEGER NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UsageMetric_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StripeEvent" (
    "id" TEXT NOT NULL,
    "stripeEventId" TEXT NOT NULL,
    "organizationId" TEXT,
    "eventType" TEXT NOT NULL,
    "processed" BOOLEAN NOT NULL DEFAULT false,
    "data" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StripeEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "UsageMetric_organizationId_idx" ON "UsageMetric"("organizationId");

-- CreateIndex
CREATE INDEX "UsageMetric_periodStart_idx" ON "UsageMetric"("periodStart");

-- CreateIndex
CREATE UNIQUE INDEX "UsageMetric_organizationId_metricType_periodStart_key" ON "UsageMetric"("organizationId", "metricType", "periodStart");

-- CreateIndex
CREATE UNIQUE INDEX "StripeEvent_stripeEventId_key" ON "StripeEvent"("stripeEventId");

-- CreateIndex
CREATE INDEX "StripeEvent_organizationId_idx" ON "StripeEvent"("organizationId");

-- CreateIndex
CREATE INDEX "StripeEvent_eventType_idx" ON "StripeEvent"("eventType");

-- CreateIndex
CREATE UNIQUE INDEX "Organization_stripeCustomerId_key" ON "Organization"("stripeCustomerId");

-- CreateIndex
CREATE UNIQUE INDEX "Organization_stripeSubscriptionId_key" ON "Organization"("stripeSubscriptionId");

-- AddForeignKey
ALTER TABLE "UsageMetric" ADD CONSTRAINT "UsageMetric_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

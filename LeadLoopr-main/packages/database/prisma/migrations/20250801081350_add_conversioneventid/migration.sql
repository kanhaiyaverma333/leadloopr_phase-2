/*
  Warnings:

  - Added the required column `conversionEventId` to the `MetaAdsIntegration` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "MetaAdsIntegration" ADD COLUMN     "conversionEventId" TEXT NOT NULL;

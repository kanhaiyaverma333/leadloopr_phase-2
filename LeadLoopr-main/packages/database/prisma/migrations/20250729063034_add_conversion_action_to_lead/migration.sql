/*
  Warnings:

  - You are about to drop the column `onversionActionId` on the `Lead` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Lead" DROP COLUMN "onversionActionId",
ADD COLUMN     "conversionActionId" TEXT;

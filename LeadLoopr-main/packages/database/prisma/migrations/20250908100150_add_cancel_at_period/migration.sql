/*
  Warnings:

  - You are about to drop the column `currentPeriodLeads` on the `Organization` table. All the data in the column will be lost.
  - You are about to drop the column `currentTeamMembers` on the `Organization` table. All the data in the column will be lost.
  - You are about to drop the column `maxTeamMembers` on the `Organization` table. All the data in the column will be lost.
  - You are about to drop the column `monthlyLeadLimit` on the `Organization` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Organization" DROP COLUMN "currentPeriodLeads",
DROP COLUMN "currentTeamMembers",
DROP COLUMN "maxTeamMembers",
DROP COLUMN "monthlyLeadLimit",
ADD COLUMN     "cancelAtPeriodEnd" BOOLEAN NOT NULL DEFAULT false;

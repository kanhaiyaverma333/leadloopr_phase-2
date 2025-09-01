-- AlterTable
ALTER TABLE "Lead" ADD COLUMN     "microsoftConversionId" TEXT;

-- CreateIndex
CREATE INDEX "Lead_msclkid_idx" ON "Lead"("msclkid");

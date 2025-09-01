-- AlterTable
ALTER TABLE "Lead" ADD COLUMN     "clientIpAddress" TEXT,
ADD COLUMN     "clientUserAgent" TEXT,
ADD COLUMN     "company" TEXT,
ADD COLUMN     "metaEventId" TEXT,
ADD COLUMN     "metaPixelId" TEXT;

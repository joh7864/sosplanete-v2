-- AlterTable
ALTER TABLE "SystemConfig" ADD COLUMN     "whatsappGeneralUrl" TEXT,
ADD COLUMN     "whatsappGeneralId" TEXT;

-- AlterTable
ALTER TABLE "Team" ADD COLUMN     "whatsappInviteUrl" TEXT,
ADD COLUMN     "whatsappGroupId" TEXT;

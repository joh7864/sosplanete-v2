-- AlterTable: whatsappGroupId et whatsappInviteUrl sur la table Team
ALTER TABLE "Team" ADD COLUMN IF NOT EXISTS "whatsappGroupId" TEXT;
ALTER TABLE "Team" ADD COLUMN IF NOT EXISTS "whatsappInviteUrl" TEXT;

-- AlterTable: durationHours et expiresAt sur la table evoe_challenge
ALTER TABLE "evoe_challenge" ADD COLUMN IF NOT EXISTS "durationHours" INTEGER;
ALTER TABLE "evoe_challenge" ADD COLUMN IF NOT EXISTS "expiresAt" TIMESTAMP(3);

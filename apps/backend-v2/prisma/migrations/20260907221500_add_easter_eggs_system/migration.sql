-- CreateEnum
CREATE TYPE "EasterEggTriggerType" AS ENUM ('RIDDLE_ANSWER_INPUT', 'KONAMI_CODE', 'COMM_LINK_COMMAND', 'CLICK_REPEATED', 'SCREEN_EDGE', 'TIMELINE_WARP', 'METRIC_SEQUENCE', 'LOGO_HOLD', 'CUSTOM_ACTION');

-- CreateEnum
CREATE TYPE "EasterEggDifficulty" AS ENUM ('EASY', 'MEDIUM', 'HARD', 'LEGENDARY');

-- AlterTable
ALTER TABLE "InstanceYear" ADD COLUMN     "easterEggFrequency" INTEGER NOT NULL DEFAULT 2,
ADD COLUMN     "easterEggMaxWinningTeams" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "easterEggRequiredPlayers" INTEGER NOT NULL DEFAULT 2,
ADD COLUMN     "easterEggsEnabled" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "GameConfig" ADD COLUMN     "easterEggFrequency" INTEGER NOT NULL DEFAULT 2,
ADD COLUMN     "easterEggMaxWinningTeams" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "easterEggRequiredPlayers" INTEGER NOT NULL DEFAULT 2,
ADD COLUMN     "easterEggsEnabled" BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE "evoe_easter_egg" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "prerequisiteType" TEXT NOT NULL DEFAULT 'MISSIONS_COUNT',
    "prerequisiteConfig" JSONB DEFAULT '{"count": 3, "distinctSectors": 2}',
    "crypticMessage" TEXT NOT NULL DEFAULT '',
    "explicitHint" TEXT,
    "hintDelayMinutes" INTEGER NOT NULL DEFAULT 120,
    "mascotDurationSeconds" INTEGER NOT NULL DEFAULT 30,
    "triggerAction" TEXT,
    "senderLore" TEXT,
    "clues" JSONB,
    "imageUrl" TEXT,
    "triggerType" "EasterEggTriggerType" NOT NULL DEFAULT 'RIDDLE_ANSWER_INPUT',
    "expectedAnswer" TEXT,
    "caseSensitive" BOOLEAN NOT NULL DEFAULT false,
    "triggerConfig" JSONB,
    "complexity" "EasterEggDifficulty" NOT NULL DEFAULT 'MEDIUM',
    "rewardPointsIT" INTEGER NOT NULL DEFAULT 50,
    "orderIndex" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "evoe_easter_egg_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "evoe_easter_egg_instance" (
    "id" SERIAL NOT NULL,
    "instanceYearId" INTEGER NOT NULL,
    "easterEggId" INTEGER NOT NULL,
    "periodStartId" INTEGER NOT NULL,
    "periodEndId" INTEGER NOT NULL,
    "isClosed" BOOLEAN NOT NULL DEFAULT false,
    "forceHint" BOOLEAN NOT NULL DEFAULT false,
    "unlockedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closedAt" TIMESTAMP(3),

    CONSTRAINT "evoe_easter_egg_instance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "evoe_easter_egg_player_progress" (
    "id" SERIAL NOT NULL,
    "easterEggId" INTEGER NOT NULL,
    "childId" INTEGER NOT NULL,
    "periodId" INTEGER NOT NULL,
    "firstInteractionAt" TIMESTAMP(3),
    "discoveredAt" TIMESTAMP(3),
    "resolutionTimeSeconds" INTEGER,
    "answerSubmitted" TEXT,
    "metadata" JSONB,

    CONSTRAINT "evoe_easter_egg_player_progress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "evoe_easter_egg_team_reward" (
    "id" SERIAL NOT NULL,
    "easterEggId" INTEGER NOT NULL,
    "teamId" INTEGER NOT NULL,
    "periodId" INTEGER NOT NULL,
    "awardedPointsIT" INTEGER NOT NULL,
    "rank" INTEGER NOT NULL DEFAULT 1,
    "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "playersCount" INTEGER NOT NULL DEFAULT 0,
    "teamTotalPlayers" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "evoe_easter_egg_team_reward_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "evoe_easter_egg_code_key" ON "evoe_easter_egg"("code");

-- CreateIndex
CREATE UNIQUE INDEX "evoe_easter_egg_instance_instanceYearId_easterEggId_periodS_key" ON "evoe_easter_egg_instance"("instanceYearId", "easterEggId", "periodStartId");

-- CreateIndex
CREATE UNIQUE INDEX "evoe_easter_egg_player_progress_easterEggId_childId_periodI_key" ON "evoe_easter_egg_player_progress"("easterEggId", "childId", "periodId");

-- CreateIndex
CREATE UNIQUE INDEX "evoe_easter_egg_team_reward_easterEggId_teamId_periodId_key" ON "evoe_easter_egg_team_reward"("easterEggId", "teamId", "periodId");

-- AddForeignKey
ALTER TABLE "evoe_easter_egg_instance" ADD CONSTRAINT "evoe_easter_egg_instance_easterEggId_fkey" FOREIGN KEY ("easterEggId") REFERENCES "evoe_easter_egg"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evoe_easter_egg_instance" ADD CONSTRAINT "evoe_easter_egg_instance_instanceYearId_fkey" FOREIGN KEY ("instanceYearId") REFERENCES "InstanceYear"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evoe_easter_egg_player_progress" ADD CONSTRAINT "evoe_easter_egg_player_progress_easterEggId_fkey" FOREIGN KEY ("easterEggId") REFERENCES "evoe_easter_egg"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evoe_easter_egg_player_progress" ADD CONSTRAINT "evoe_easter_egg_player_progress_childId_fkey" FOREIGN KEY ("childId") REFERENCES "Child"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evoe_easter_egg_team_reward" ADD CONSTRAINT "evoe_easter_egg_team_reward_easterEggId_fkey" FOREIGN KEY ("easterEggId") REFERENCES "evoe_easter_egg"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evoe_easter_egg_team_reward" ADD CONSTRAINT "evoe_easter_egg_team_reward_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

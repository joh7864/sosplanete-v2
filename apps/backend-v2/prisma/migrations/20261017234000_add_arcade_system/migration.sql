-- CreateTable
CREATE TABLE IF NOT EXISTS "evoe_arcade_score" (
    "id" SERIAL NOT NULL,
    "gameKey" TEXT NOT NULL,
    "childId" INTEGER NOT NULL,
    "childPseudo" TEXT NOT NULL,
    "teamId" INTEGER NOT NULL,
    "teamName" TEXT NOT NULL,
    "instanceYearId" INTEGER NOT NULL,
    "score" INTEGER NOT NULL,
    "waveReached" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "evoe_arcade_score_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "evoe_team_unlocked_arcade_game" (
    "id" SERIAL NOT NULL,
    "teamId" INTEGER NOT NULL,
    "gameKey" TEXT NOT NULL,
    "easterEggCode" TEXT,
    "unlockedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "discoveredByChildId" INTEGER,

    CONSTRAINT "evoe_team_unlocked_arcade_game_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "evoe_arcade_score_gameKey_instanceYearId_score_idx" ON "evoe_arcade_score"("gameKey", "instanceYearId", "score" DESC);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "evoe_arcade_score_gameKey_childId_idx" ON "evoe_arcade_score"("gameKey", "childId");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "evoe_team_unlocked_arcade_game_teamId_gameKey_key" ON "evoe_team_unlocked_arcade_game"("teamId", "gameKey");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "evoe_team_unlocked_arcade_game_teamId_idx" ON "evoe_team_unlocked_arcade_game"("teamId");

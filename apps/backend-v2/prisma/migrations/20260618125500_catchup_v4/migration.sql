-- 1. Création de l'ENUM ChallengeStatus s'il n'existe pas
DO $$ 
BEGIN
    IF to_regtype('"ChallengeStatus"') IS NULL THEN
        CREATE TYPE "ChallengeStatus" AS ENUM ('PENDING', 'ACCEPTED', 'DECLINED', 'SUCCESS', 'FAILED');
    END IF;
END $$;

-- 2. Création de la table evoe_team_technology
CREATE TABLE IF NOT EXISTS "evoe_team_technology" (
    "id" SERIAL NOT NULL,
    "teamId" INTEGER NOT NULL,
    "maxLevel" INTEGER NOT NULL DEFAULT 1,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "evoe_team_technology_pkey" PRIMARY KEY ("id")
);

-- Index unique pour teamId
CREATE UNIQUE INDEX IF NOT EXISTS "evoe_team_technology_teamId_key" ON "evoe_team_technology"("teamId");

-- Clé étrangère pour evoe_team_technology
ALTER TABLE "evoe_team_technology" 
    DROP CONSTRAINT IF EXISTS "evoe_team_technology_teamId_fkey",
    ADD CONSTRAINT "evoe_team_technology_teamId_fkey" 
    FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- 3. Création de la table evoe_challenge
CREATE TABLE IF NOT EXISTS "evoe_challenge" (
    "id" SERIAL NOT NULL,
    "challengerTeamId" INTEGER NOT NULL,
    "targetTeamId" INTEGER NOT NULL,
    "localActionId" INTEGER NOT NULL,
    "periodId" INTEGER NOT NULL,
    "status" "ChallengeStatus" NOT NULL DEFAULT 'PENDING',
    "pledge" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "evoe_challenge_pkey" PRIMARY KEY ("id")
);

-- Clés étrangères pour evoe_challenge
ALTER TABLE "evoe_challenge" 
    DROP CONSTRAINT IF EXISTS "evoe_challenge_challengerTeamId_fkey",
    ADD CONSTRAINT "evoe_challenge_challengerTeamId_fkey" 
    FOREIGN KEY ("challengerTeamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "evoe_challenge" 
    DROP CONSTRAINT IF EXISTS "evoe_challenge_targetTeamId_fkey",
    ADD CONSTRAINT "evoe_challenge_targetTeamId_fkey" 
    FOREIGN KEY ("targetTeamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "evoe_challenge" 
    DROP CONSTRAINT IF EXISTS "evoe_challenge_localActionId_fkey",
    ADD CONSTRAINT "evoe_challenge_localActionId_fkey" 
    FOREIGN KEY ("localActionId") REFERENCES "LocalAction"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "evoe_challenge" 
    DROP CONSTRAINT IF EXISTS "evoe_challenge_periodId_fkey",
    ADD CONSTRAINT "evoe_challenge_periodId_fkey" 
    FOREIGN KEY ("periodId") REFERENCES "Period"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE "evoe_team_technology" (
    "id" SERIAL NOT NULL,
    "teamId" INTEGER NOT NULL,
    "maxLevel" INTEGER NOT NULL DEFAULT 1,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "evoe_team_technology_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "evoe_team_technology_teamId_key" ON "evoe_team_technology"("teamId");

-- AddForeignKey
ALTER TABLE "evoe_team_technology" ADD CONSTRAINT "evoe_team_technology_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

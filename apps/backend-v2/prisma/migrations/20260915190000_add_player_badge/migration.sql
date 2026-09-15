-- CreateTable
CREATE TABLE IF NOT EXISTS "evoe_player_badge" (
    "id" SERIAL NOT NULL,
    "childId" INTEGER NOT NULL,
    "badgeType" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "evoe_player_badge_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "evoe_player_badge_childId_idx" ON "evoe_player_badge"("childId");

-- AddForeignKey with idempotency guard
DO $$ BEGIN
    ALTER TABLE "evoe_player_badge" ADD CONSTRAINT "evoe_player_badge_childId_fkey" FOREIGN KEY ("childId") REFERENCES "Child"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

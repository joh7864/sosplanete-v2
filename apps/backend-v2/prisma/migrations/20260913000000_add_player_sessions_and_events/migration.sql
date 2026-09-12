-- CreateEnum with idempotency guard
DO $$ BEGIN
    CREATE TYPE "SessionStatus" AS ENUM ('ACTIVE', 'CLOSED', 'EXPIRED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- CreateEnum with idempotency guard
DO $$ BEGIN
    CREATE TYPE "EventType" AS ENUM ('LOGIN', 'LOGOUT', 'PAGE_VIEW', 'MISSION_DONE', 'MISSION_CANCELLED', 'CHALLENGE_INTERACTION', 'EASTER_EGG_INTERACTION', 'HEARTBEAT');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- CreateTable
CREATE TABLE IF NOT EXISTS "evoe_player_session" (
    "id" TEXT NOT NULL,
    "childId" INTEGER NOT NULL,
    "childPseudo" TEXT NOT NULL,
    "instanceYearId" INTEGER,
    "instanceId" INTEGER NOT NULL,
    "schoolYear" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastActiveAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),
    "durationSeconds" INTEGER NOT NULL DEFAULT 0,
    "deviceType" TEXT,
    "browser" TEXT,
    "os" TEXT,
    "status" "SessionStatus" NOT NULL DEFAULT 'ACTIVE',

    CONSTRAINT "evoe_player_session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "evoe_session_event" (
    "id" SERIAL NOT NULL,
    "sessionId" TEXT NOT NULL,
    "childId" INTEGER NOT NULL,
    "childPseudo" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "eventType" "EventType" NOT NULL,
    "target" TEXT NOT NULL,
    "label" TEXT,
    "timeSpentSeconds" INTEGER NOT NULL DEFAULT 0,
    "metadata" JSONB,

    CONSTRAINT "evoe_session_event_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "evoe_player_session_instanceId_schoolYear_idx" ON "evoe_player_session"("instanceId", "schoolYear");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "evoe_player_session_childId_startedAt_idx" ON "evoe_player_session"("childId", "startedAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "evoe_player_session_childPseudo_idx" ON "evoe_player_session"("childPseudo");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "evoe_player_session_startedAt_idx" ON "evoe_player_session"("startedAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "evoe_session_event_sessionId_timestamp_idx" ON "evoe_session_event"("sessionId", "timestamp");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "evoe_session_event_childId_timestamp_idx" ON "evoe_session_event"("childId", "timestamp");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "evoe_session_event_childPseudo_idx" ON "evoe_session_event"("childPseudo");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "evoe_session_event_eventType_idx" ON "evoe_session_event"("eventType");

-- AddForeignKey with idempotency guard
DO $$ BEGIN
    ALTER TABLE "evoe_player_session" ADD CONSTRAINT "evoe_player_session_childId_fkey" FOREIGN KEY ("childId") REFERENCES "Child"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- AddForeignKey with idempotency guard
DO $$ BEGIN
    ALTER TABLE "evoe_session_event" ADD CONSTRAINT "evoe_session_event_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "evoe_player_session"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

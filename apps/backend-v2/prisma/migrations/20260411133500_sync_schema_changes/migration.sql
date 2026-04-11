-- AlterTable
ALTER TABLE "Group" ADD COLUMN "color" TEXT;

-- AlterTable
ALTER TABLE "Instance" ADD COLUMN "isOpen" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "LocalAction" ADD COLUMN "image" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "LocalAction_instanceId_actionRefId_key" ON "LocalAction"("instanceId", "actionRefId");

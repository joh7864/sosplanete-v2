-- CreateEnum
CREATE TYPE "Role" AS ENUM ('AS', 'AM');

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT,
    "avatar" TEXT,
    "lastSeenAt" TIMESTAMP(3),
    "role" "Role" NOT NULL DEFAULT 'AM',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActionRef" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "referenceName" TEXT NOT NULL,
    "defaultCo2" DOUBLE PRECISION,
    "defaultWater" DOUBLE PRECISION,
    "defaultWaste" DOUBLE PRECISION,
    "co2Year" DOUBLE PRECISION,
    "impactLabel" TEXT,
    "impactTotal" DOUBLE PRECISION,
    "weightedStars" INTEGER,
    "image" TEXT,
    "year" INTEGER NOT NULL DEFAULT 2025,
    "category" TEXT,

    CONSTRAINT "ActionRef_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnnualImpactData" (
    "id" SERIAL NOT NULL,
    "year" INTEGER NOT NULL,
    "waterImpact" DOUBLE PRECISION NOT NULL,
    "co2Impact" DOUBLE PRECISION NOT NULL,
    "wasteImpact" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "AnnualImpactData_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Instance" (
    "id" SERIAL NOT NULL,
    "schoolName" TEXT NOT NULL,
    "hostUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "adminId" INTEGER,

    CONSTRAINT "Instance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Team" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT,
    "icon" TEXT,
    "instanceId" INTEGER NOT NULL,

    CONSTRAINT "Team_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Group" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "teamId" INTEGER NOT NULL,

    CONSTRAINT "Group_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Child" (
    "id" SERIAL NOT NULL,
    "pseudo" TEXT NOT NULL,
    "password" TEXT,
    "groupId" INTEGER NOT NULL,

    CONSTRAINT "Child_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LocalAction" (
    "id" SERIAL NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT,
    "actionRefId" INTEGER NOT NULL,
    "instanceId" INTEGER NOT NULL,
    "specificCo2" DOUBLE PRECISION,
    "specificWater" DOUBLE PRECISION,
    "specificWaste" DOUBLE PRECISION,

    CONSTRAINT "LocalAction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Period" (
    "id" SERIAL NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "instanceId" INTEGER NOT NULL,

    CONSTRAINT "Period_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActionDone" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "childId" INTEGER NOT NULL,
    "localActionId" INTEGER NOT NULL,
    "periodId" INTEGER NOT NULL,
    "savedCo2" DOUBLE PRECISION NOT NULL,
    "savedWater" DOUBLE PRECISION NOT NULL,
    "savedWaste" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "ActionDone_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnimalRelease" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "unlockOrder" INTEGER NOT NULL,
    "imageUrl" TEXT,

    CONSTRAINT "AnimalRelease_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "ActionRef_code_key" ON "ActionRef"("code");

-- CreateIndex
CREATE UNIQUE INDEX "AnnualImpactData_year_key" ON "AnnualImpactData"("year");

-- CreateIndex
CREATE UNIQUE INDEX "Instance_hostUrl_key" ON "Instance"("hostUrl");

-- CreateIndex
CREATE UNIQUE INDEX "Child_pseudo_groupId_key" ON "Child"("pseudo", "groupId");

-- CreateIndex
CREATE UNIQUE INDEX "AnimalRelease_unlockOrder_key" ON "AnimalRelease"("unlockOrder");

-- AddForeignKey
ALTER TABLE "Instance" ADD CONSTRAINT "Instance_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Team" ADD CONSTRAINT "Team_instanceId_fkey" FOREIGN KEY ("instanceId") REFERENCES "Instance"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Group" ADD CONSTRAINT "Group_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Child" ADD CONSTRAINT "Child_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LocalAction" ADD CONSTRAINT "LocalAction_actionRefId_fkey" FOREIGN KEY ("actionRefId") REFERENCES "ActionRef"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LocalAction" ADD CONSTRAINT "LocalAction_instanceId_fkey" FOREIGN KEY ("instanceId") REFERENCES "Instance"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Period" ADD CONSTRAINT "Period_instanceId_fkey" FOREIGN KEY ("instanceId") REFERENCES "Instance"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActionDone" ADD CONSTRAINT "ActionDone_childId_fkey" FOREIGN KEY ("childId") REFERENCES "Child"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActionDone" ADD CONSTRAINT "ActionDone_localActionId_fkey" FOREIGN KEY ("localActionId") REFERENCES "LocalAction"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActionDone" ADD CONSTRAINT "ActionDone_periodId_fkey" FOREIGN KEY ("periodId") REFERENCES "Period"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

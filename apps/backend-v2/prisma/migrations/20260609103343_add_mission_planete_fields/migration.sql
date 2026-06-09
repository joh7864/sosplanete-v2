-- AlterTable
ALTER TABLE "Child" ADD COLUMN     "isDelegate" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "InstanceYear" ADD COLUMN     "allowAllDelegate" BOOLEAN NOT NULL DEFAULT false;

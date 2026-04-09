-- AlterTable
ALTER TABLE "group_members" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "groups" ALTER COLUMN "updatedAt" DROP DEFAULT;

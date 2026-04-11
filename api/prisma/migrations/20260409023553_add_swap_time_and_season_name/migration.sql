-- AlterTable
ALTER TABLE "seasons" ADD COLUMN     "name" TEXT;

-- AlterTable
ALTER TABLE "settings" ADD COLUMN     "teamSwapEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "teamSwapTimeMin" INTEGER NOT NULL DEFAULT 2;

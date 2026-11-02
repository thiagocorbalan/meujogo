-- CreateEnum
CREATE TYPE "GoalSource" AS ENUM ('LIVE', 'LATE');

-- DropForeignKey
ALTER TABLE "goals" DROP CONSTRAINT "goals_playerId_fkey";

-- AlterTable
ALTER TABLE "goals" ADD COLUMN     "source" "GoalSource" NOT NULL DEFAULT 'LIVE',
ALTER COLUMN "playerId" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "goals_matchId_idx" ON "goals"("matchId");

-- CreateIndex
CREATE INDEX "goals_playerId_idx" ON "goals"("playerId");

-- AddForeignKey
ALTER TABLE "goals" ADD CONSTRAINT "goals_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "players"("id") ON DELETE SET NULL ON UPDATE CASCADE;

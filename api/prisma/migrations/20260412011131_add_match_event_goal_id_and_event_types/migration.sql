-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "MatchEventType" ADD VALUE 'GOAL_UNDONE';
ALTER TYPE "MatchEventType" ADD VALUE 'LATE_GOAL_ADDED';
ALTER TYPE "MatchEventType" ADD VALUE 'LATE_GOAL_REMOVED';
ALTER TYPE "MatchEventType" ADD VALUE 'PLAYER_SUBSTITUTED';
ALTER TYPE "MatchEventType" ADD VALUE 'SUBSTITUTION_REVERTED';

-- AlterTable
ALTER TABLE "match_events" ADD COLUMN     "goalId" INTEGER;

-- CreateIndex
CREATE INDEX "match_events_matchId_type_idx" ON "match_events"("matchId", "type");

-- CreateIndex
CREATE INDEX "match_events_goalId_idx" ON "match_events"("goalId");

-- AddForeignKey
ALTER TABLE "match_events" ADD CONSTRAINT "match_events_goalId_fkey" FOREIGN KEY ("goalId") REFERENCES "goals"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateEnum
CREATE TYPE "SubstitutionType" AS ENUM ('TEMPORARIA', 'PERMANENTE');

-- CreateEnum
CREATE TYPE "SubstitutionReason" AS ENUM ('LESAO', 'CANSACO', 'SEM_MOTIVO');

-- CreateTable
CREATE TABLE "substitutions" (
    "id" SERIAL NOT NULL,
    "sessionId" INTEGER NOT NULL,
    "matchId" INTEGER,
    "teamId" INTEGER NOT NULL,
    "sourceTeamId" INTEGER,
    "playerOutId" INTEGER NOT NULL,
    "playerInId" INTEGER NOT NULL,
    "type" "SubstitutionType" NOT NULL,
    "reason" "SubstitutionReason" NOT NULL,
    "minute" INTEGER,
    "isReverted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revertedAt" TIMESTAMP(3),

    CONSTRAINT "substitutions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "substitutions_sessionId_idx" ON "substitutions"("sessionId");

-- CreateIndex
CREATE INDEX "substitutions_matchId_idx" ON "substitutions"("matchId");

-- AddForeignKey
ALTER TABLE "substitutions" ADD CONSTRAINT "substitutions_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "sessions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "substitutions" ADD CONSTRAINT "substitutions_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "matches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "substitutions" ADD CONSTRAINT "substitutions_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "teams"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "substitutions" ADD CONSTRAINT "substitutions_sourceTeamId_fkey" FOREIGN KEY ("sourceTeamId") REFERENCES "teams"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "substitutions" ADD CONSTRAINT "substitutions_playerOutId_fkey" FOREIGN KEY ("playerOutId") REFERENCES "players"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "substitutions" ADD CONSTRAINT "substitutions_playerInId_fkey" FOREIGN KEY ("playerInId") REFERENCES "players"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

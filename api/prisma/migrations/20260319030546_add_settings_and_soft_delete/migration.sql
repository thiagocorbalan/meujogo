-- CreateEnum
CREATE TYPE "DrawMode" AS ENUM ('ALEATORIO', 'EQUILIBRADO');

-- AlterTable
ALTER TABLE "players" ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ALTER COLUMN "elo" SET DEFAULT 1200;

-- CreateTable
CREATE TABLE "settings" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "maxTeams" INTEGER NOT NULL DEFAULT 4,
    "playersPerTeam" INTEGER NOT NULL DEFAULT 5,
    "sessionDurationMin" INTEGER NOT NULL DEFAULT 60,
    "matchDurationMin" INTEGER NOT NULL DEFAULT 10,
    "drawMode" "DrawMode" NOT NULL DEFAULT 'ALEATORIO',
    "defaultElo" DOUBLE PRECISION NOT NULL DEFAULT 1200,
    "kFactor" DOUBLE PRECISION NOT NULL DEFAULT 32,
    "maxConsecutiveGames" INTEGER NOT NULL DEFAULT 2,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vests" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "settingsId" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "vests_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "vests" ADD CONSTRAINT "vests_settingsId_fkey" FOREIGN KEY ("settingsId") REFERENCES "settings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

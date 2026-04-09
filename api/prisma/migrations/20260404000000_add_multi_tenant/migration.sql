-- Step 1: Create enum and new tables
CREATE TYPE "GroupRole" AS ENUM ('DONO', 'ADMIN', 'JOGADOR');

CREATE TABLE "groups" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "dayOfWeek" INTEGER,
    "defaultTime" TEXT,
    "address" TEXT,
    "inviteCode" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "groups_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "groups_slug_key" ON "groups"("slug");
CREATE UNIQUE INDEX "groups_inviteCode_key" ON "groups"("inviteCode");

CREATE TABLE "group_members" (
    "id" SERIAL NOT NULL,
    "groupId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "playerId" INTEGER,
    "role" "GroupRole" NOT NULL DEFAULT 'JOGADOR',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "group_members_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "group_members_playerId_key" ON "group_members"("playerId");
CREATE UNIQUE INDEX "group_members_groupId_userId_key" ON "group_members"("groupId", "userId");

-- Step 2: Add nullable FK columns to existing tables
ALTER TABLE "players" ADD COLUMN "groupId" INTEGER;
ALTER TABLE "players" ADD COLUMN "userId" INTEGER;
ALTER TABLE "sessions" ADD COLUMN "groupId" INTEGER;
ALTER TABLE "seasons" ADD COLUMN "groupId" INTEGER;
ALTER TABLE "settings" ADD COLUMN "groupId" INTEGER;
ALTER TABLE "settings" ADD COLUMN "rules" TEXT;
ALTER TABLE "settings" ADD COLUMN "paymentInfo" TEXT;

-- Fix settings id sequence (was hardcoded to 1)
CREATE SEQUENCE IF NOT EXISTS settings_id_seq;
SELECT setval('settings_id_seq', COALESCE((SELECT MAX(id) FROM "settings"), 0) + 1, false);
ALTER TABLE "settings" ALTER COLUMN "id" SET DEFAULT nextval('settings_id_seq');
ALTER SEQUENCE settings_id_seq OWNED BY "settings"."id";

-- Remove default from vests settingsId (was @default(1))
ALTER TABLE "vests" ALTER COLUMN "settingsId" DROP DEFAULT;

-- Step 3: Data migration — create default group and link existing data
INSERT INTO "groups" ("name", "slug", "inviteCode", "updatedAt")
VALUES ('Meu Grupo', 'meu-grupo', substring(gen_random_uuid()::text, 1, 8), CURRENT_TIMESTAMP);

-- Link all existing data to the default group (id=1)
UPDATE "players" SET "groupId" = 1;
UPDATE "sessions" SET "groupId" = 1;
UPDATE "seasons" SET "groupId" = 1;
UPDATE "settings" SET "groupId" = 1;

-- Create group memberships from existing users
INSERT INTO "group_members" ("groupId", "userId", "role", "updatedAt")
SELECT 1, "id",
    CASE "role"
        WHEN 'ADMIN' THEN 'DONO'::"GroupRole"
        WHEN 'MODERADOR' THEN 'ADMIN'::"GroupRole"
        ELSE 'JOGADOR'::"GroupRole"
    END,
    CURRENT_TIMESTAMP
FROM "users";

-- Step 4: Add foreign key constraints
ALTER TABLE "group_members" ADD CONSTRAINT "group_members_groupId_fkey"
    FOREIGN KEY ("groupId") REFERENCES "groups"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "group_members" ADD CONSTRAINT "group_members_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "group_members" ADD CONSTRAINT "group_members_playerId_fkey"
    FOREIGN KEY ("playerId") REFERENCES "players"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "players" ADD CONSTRAINT "players_groupId_fkey"
    FOREIGN KEY ("groupId") REFERENCES "groups"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "players" ADD CONSTRAINT "players_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "seasons" ADD CONSTRAINT "seasons_groupId_fkey"
    FOREIGN KEY ("groupId") REFERENCES "groups"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "sessions" ADD CONSTRAINT "sessions_groupId_fkey"
    FOREIGN KEY ("groupId") REFERENCES "groups"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "settings" ADD CONSTRAINT "settings_groupId_fkey"
    FOREIGN KEY ("groupId") REFERENCES "groups"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Step 5: Add unique constraint on settings.groupId
CREATE UNIQUE INDEX "settings_groupId_key" ON "settings"("groupId");

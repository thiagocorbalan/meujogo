-- AlterTable
ALTER TABLE "users" ADD COLUMN "password" TEXT,
ADD COLUMN "refreshToken" TEXT,
ADD COLUMN "resetToken" TEXT,
ADD COLUMN "resetTokenExpiry" TIMESTAMP(3),
ADD COLUMN "googleId" TEXT,
ADD COLUMN "appleId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "users_googleId_key" ON "users"("googleId");

-- CreateIndex
CREATE UNIQUE INDEX "users_appleId_key" ON "users"("appleId");

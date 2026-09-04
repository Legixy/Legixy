-- CreateEnum
CREATE TYPE "ReminderChannel" AS ENUM ('EMAIL');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "ReminderStatus" ADD VALUE 'UNDELIVERABLE';
ALTER TYPE "ReminderStatus" ADD VALUE 'FAILED';

-- AlterTable
ALTER TABLE "license_reminders" ADD COLUMN     "attemptCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "channel" "ReminderChannel",
ADD COLUMN     "lastError" TEXT,
ADD COLUMN     "lockedBy" TEXT,
ADD COLUMN     "lockedUntil" TIMESTAMP(3),
ADD COLUMN     "sentAt" TIMESTAMP(3);


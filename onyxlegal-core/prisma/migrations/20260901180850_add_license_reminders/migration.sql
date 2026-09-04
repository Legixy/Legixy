-- CreateEnum
CREATE TYPE "ReminderStatus" AS ENUM ('PENDING', 'SENT', 'CANCELLED', 'SKIPPED');

-- CreateTable
CREATE TABLE "license_reminders" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "licenseId" TEXT NOT NULL,
    "offsetDays" INTEGER NOT NULL,
    "dueOn" DATE NOT NULL,
    "status" "ReminderStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "license_reminders_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "license_reminders_tenantId_licenseId_idx" ON "license_reminders"("tenantId", "licenseId");

-- CreateIndex
CREATE INDEX "license_reminders_status_dueOn_idx" ON "license_reminders"("status", "dueOn");

-- CreateIndex
CREATE UNIQUE INDEX "license_reminders_licenseId_offsetDays_dueOn_key" ON "license_reminders"("licenseId", "offsetDays", "dueOn");

-- AddForeignKey
ALTER TABLE "license_reminders" ADD CONSTRAINT "license_reminders_licenseId_fkey" FOREIGN KEY ("licenseId") REFERENCES "licenses"("id") ON DELETE CASCADE ON UPDATE CASCADE;


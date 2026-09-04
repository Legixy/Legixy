-- CreateTable
CREATE TABLE "reminder_reads" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "reminderId" TEXT NOT NULL,
    "readAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reminder_reads_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "reminder_reads_userId_idx" ON "reminder_reads"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "reminder_reads_userId_reminderId_key" ON "reminder_reads"("userId", "reminderId");

-- AddForeignKey
ALTER TABLE "reminder_reads" ADD CONSTRAINT "reminder_reads_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reminder_reads" ADD CONSTRAINT "reminder_reads_reminderId_fkey" FOREIGN KEY ("reminderId") REFERENCES "license_reminders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

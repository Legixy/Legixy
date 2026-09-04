-- AlterTable
ALTER TABLE "license_documents" ADD COLUMN     "purgedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "license_documents_deletedAt_purgedAt_idx" ON "license_documents"("deletedAt", "purgedAt");

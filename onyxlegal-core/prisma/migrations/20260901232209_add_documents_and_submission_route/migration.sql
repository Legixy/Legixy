-- CreateEnum
CREATE TYPE "SubmissionRoute" AS ENUM ('PREPARE_ONLY', 'API_ELIGIBLE', 'UNKNOWN');

-- AlterTable
ALTER TABLE "authorities" ADD COLUMN     "submissionRoute" "SubmissionRoute" NOT NULL DEFAULT 'PREPARE_ONLY';

-- CreateTable
CREATE TABLE "license_documents" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "licenseId" TEXT NOT NULL,
    "documentCode" TEXT,
    "filename" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "storageKey" TEXT NOT NULL,
    "issuedOn" DATE,
    "expiresOn" DATE,
    "uploadedById" TEXT,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "license_documents_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "license_documents_storageKey_key" ON "license_documents"("storageKey");

-- CreateIndex
CREATE INDEX "license_documents_tenantId_licenseId_idx" ON "license_documents"("tenantId", "licenseId");

-- CreateIndex
CREATE INDEX "license_documents_licenseId_documentCode_idx" ON "license_documents"("licenseId", "documentCode");

-- AddForeignKey
ALTER TABLE "license_documents" ADD CONSTRAINT "license_documents_licenseId_fkey" FOREIGN KEY ("licenseId") REFERENCES "licenses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "license_documents" ADD CONSTRAINT "license_documents_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;


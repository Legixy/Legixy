-- CreateEnum
CREATE TYPE "RenewalStatus" AS ENUM ('PREPARING', 'READY', 'AWAITING_AUTHORITY', 'COMPLETED', 'CLOSED');

-- CreateTable
CREATE TABLE "license_renewals" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "licenseId" TEXT NOT NULL,
    "status" "RenewalStatus" NOT NULL DEFAULT 'PREPARING',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "startedById" TEXT,
    "previousExpiry" DATE,
    "newExpiry" DATE,
    "newLicenseNumber" TEXT,
    "submittedAt" TIMESTAMP(3),
    "submittedById" TEXT,
    "completedAt" TIMESTAMP(3),
    "completedById" TEXT,
    "outcome" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "license_renewals_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "license_renewals_tenantId_status_idx" ON "license_renewals"("tenantId", "status");

-- CreateIndex
CREATE INDEX "license_renewals_licenseId_status_idx" ON "license_renewals"("licenseId", "status");

-- AddForeignKey
ALTER TABLE "license_renewals" ADD CONSTRAINT "license_renewals_licenseId_fkey" FOREIGN KEY ("licenseId") REFERENCES "licenses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "license_renewals" ADD CONSTRAINT "license_renewals_startedById_fkey" FOREIGN KEY ("startedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "license_renewals" ADD CONSTRAINT "license_renewals_submittedById_fkey" FOREIGN KEY ("submittedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "license_renewals" ADD CONSTRAINT "license_renewals_completedById_fkey" FOREIGN KEY ("completedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

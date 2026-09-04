-- CreateEnum
CREATE TYPE "SiteStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "LicenseLifecycle" AS ENUM ('ACTIVE', 'ARCHIVED');

-- AlterTable
ALTER TABLE "tenants" ADD COLUMN     "timeZone" TEXT NOT NULL DEFAULT 'Asia/Riyadh';

-- CreateTable
CREATE TABLE "sites" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "city" TEXT,
    "address" TEXT,
    "status" "SiteStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sites_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "licenses" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "siteId" TEXT,
    "ownerUserId" TEXT,
    "name" TEXT NOT NULL,
    "licenseType" TEXT,
    "authority" TEXT,
    "licenseNumber" TEXT,
    "issueDate" DATE,
    "expiryDate" DATE,
    "lifecycle" "LicenseLifecycle" NOT NULL DEFAULT 'ACTIVE',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "licenses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "compliance_audit_log" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "actorUserId" TEXT,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "changes" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "compliance_audit_log_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "sites_tenantId_status_idx" ON "sites"("tenantId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "sites_tenantId_name_key" ON "sites"("tenantId", "name");

-- CreateIndex
CREATE INDEX "licenses_tenantId_expiryDate_idx" ON "licenses"("tenantId", "expiryDate");

-- CreateIndex
CREATE INDEX "licenses_tenantId_siteId_idx" ON "licenses"("tenantId", "siteId");

-- CreateIndex
CREATE INDEX "licenses_tenantId_lifecycle_idx" ON "licenses"("tenantId", "lifecycle");

-- CreateIndex
CREATE INDEX "licenses_tenantId_ownerUserId_idx" ON "licenses"("tenantId", "ownerUserId");

-- CreateIndex
CREATE INDEX "licenses_tenantId_licenseNumber_idx" ON "licenses"("tenantId", "licenseNumber");

-- CreateIndex
CREATE INDEX "compliance_audit_log_tenantId_createdAt_idx" ON "compliance_audit_log"("tenantId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "compliance_audit_log_tenantId_entityType_entityId_idx" ON "compliance_audit_log"("tenantId", "entityType", "entityId");

-- AddForeignKey
ALTER TABLE "sites" ADD CONSTRAINT "sites_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "licenses" ADD CONSTRAINT "licenses_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "licenses" ADD CONSTRAINT "licenses_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "sites"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "licenses" ADD CONSTRAINT "licenses_ownerUserId_fkey" FOREIGN KEY ("ownerUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "compliance_audit_log" ADD CONSTRAINT "compliance_audit_log_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;


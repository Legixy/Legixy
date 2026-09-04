-- CreateEnum
CREATE TYPE "LicenseScope" AS ENUM ('ENTITY', 'SITE');

-- AlterTable
ALTER TABLE "licenses" ADD COLUMN     "hijriExpiry" TEXT,
ADD COLUMN     "licenseTypeId" TEXT;

-- CreateTable
CREATE TABLE "authorities" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameAr" TEXT NOT NULL,
    "portalUrl" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "authorities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "license_types" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameAr" TEXT NOT NULL,
    "authorityId" TEXT NOT NULL,
    "scope" "LicenseScope" NOT NULL,
    "defaultCycleMonths" INTEGER,
    "requiredDocuments" JSONB NOT NULL DEFAULT '[]',
    "typicalFee" DECIMAL(10,2),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "license_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tenant_license_requirements" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "licenseTypeId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tenant_license_requirements_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "authorities_name_key" ON "authorities"("name");

-- CreateIndex
CREATE UNIQUE INDEX "license_types_name_key" ON "license_types"("name");

-- CreateIndex
CREATE INDEX "license_types_scope_isActive_idx" ON "license_types"("scope", "isActive");

-- CreateIndex
CREATE INDEX "tenant_license_requirements_tenantId_idx" ON "tenant_license_requirements"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "tenant_license_requirements_tenantId_licenseTypeId_key" ON "tenant_license_requirements"("tenantId", "licenseTypeId");

-- CreateIndex
CREATE INDEX "licenses_tenantId_licenseTypeId_idx" ON "licenses"("tenantId", "licenseTypeId");

-- AddForeignKey
ALTER TABLE "licenses" ADD CONSTRAINT "licenses_licenseTypeId_fkey" FOREIGN KEY ("licenseTypeId") REFERENCES "license_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "license_types" ADD CONSTRAINT "license_types_authorityId_fkey" FOREIGN KEY ("authorityId") REFERENCES "authorities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tenant_license_requirements" ADD CONSTRAINT "tenant_license_requirements_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tenant_license_requirements" ADD CONSTRAINT "tenant_license_requirements_licenseTypeId_fkey" FOREIGN KEY ("licenseTypeId") REFERENCES "license_types"("id") ON DELETE CASCADE ON UPDATE CASCADE;


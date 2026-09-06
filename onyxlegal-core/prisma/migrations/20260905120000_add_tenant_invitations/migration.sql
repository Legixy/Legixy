-- CreateTable
CREATE TABLE "tenant_invitations" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "invitedByUserId" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "acceptedAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tenant_invitations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tenant_invitations_tokenHash_key" ON "tenant_invitations"("tokenHash");

-- CreateIndex
CREATE INDEX "tenant_invitations_tenantId_createdAt_idx" ON "tenant_invitations"("tenantId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "tenant_invitations_tenantId_email_idx" ON "tenant_invitations"("tenantId", "email");

-- AddForeignKey
ALTER TABLE "tenant_invitations" ADD CONSTRAINT "tenant_invitations_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;


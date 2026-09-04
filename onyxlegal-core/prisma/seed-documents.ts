/**
 * Demo documents + one API_ELIGIBLE licence.
 *
 * Separate from seed-compliance.ts because documents must go through
 * DocumentsService: they are sniffed, sanitised, encrypted and audited on the
 * way in. Writing rows directly would bypass all of that and produce demo data
 * that does not resemble what the product actually stores.
 *
 * The PDFs are minimal valid stubs generated here — no real document, and
 * nothing resembling a real identifier, is committed to this repository.
 *
 * Produces all three checklist states on purpose:
 *   · PRESENT  — an in-date supporting document
 *   · EXPIRED  — a document past its own expiresOn, on a still-current licence
 *   · MISSING  — a requirement with nothing uploaded
 *
 * Run: npx ts-node -r tsconfig-paths/register prisma/seed-documents.ts
 */

import 'dotenv/config';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../src/database/prisma.service';
import { ComplianceAuditService } from '../src/modules/compliance/audit/compliance-audit.service';
import { DocumentsService } from '../src/modules/compliance/documents/documents.service';
import { LocalDocumentStorage } from '../src/modules/compliance/documents/document-storage';
import { RemindersService } from '../src/modules/compliance/reminders/reminders.service';
import { addDays, todayIn } from '../src/modules/compliance/domain/plain-date';

/** A minimal but structurally valid PDF, generated — never a real document. */
function stubPdf(label: string): Buffer {
  return Buffer.from(
    `%PDF-1.7\n1 0 obj<</Type/Catalog>>endobj\n% DEMO ONLY - ${label}\n%%EOF\n`,
    'utf8',
  );
}

async function main() {
  const config = {
    get: (key: string, fallback?: string) => process.env[key] ?? fallback,
  } as unknown as ConfigService;

  const prisma = new PrismaService(config);
  await prisma.onModuleInit();

  const audit = new ComplianceAuditService(prisma);
  const documents = new DocumentsService(
    prisma,
    new LocalDocumentStorage(),
    audit,
  );
  const reminders = new RemindersService(prisma);

  const tenant = await prisma.tenant.findFirst({
    where: { users: { some: { email: 'demo@onyxlegal.test' } } },
    select: { id: true, timeZone: true },
  });
  if (!tenant) {
    console.error('Demo tenant not found. Run seed-compliance.ts first.');
    return;
  }
  const today = todayIn(tenant.timeZone);

  const actor = await prisma.user.findFirst({
    where: { tenantId: tenant.id, email: 'demo@onyxlegal.test' },
    select: { id: true },
  });
  if (!actor) {
    // uploadedById is a real foreign key. Inventing an id would fail the
    // constraint; falling back to null would misattribute the upload.
    console.error('Demo user not found. Run seed-compliance.ts first.');
    return;
  }
  const ahmed = await prisma.user.findFirst({
    where: { tenantId: tenant.id, email: 'ahmed@onyxlegal.test' },
    select: { id: true },
  });

  // ── An API_ELIGIBLE licence, so the two route wordings can be compared ──
  const muqeem = await prisma.authority.findUnique({
    where: { name: 'Muqeem' },
    select: { id: true },
  });
  if (muqeem) {
    const type = await prisma.licenseType.upsert({
      where: { name: 'Muqeem Establishment Registration' },
      update: {},
      create: {
        name: 'Muqeem Establishment Registration',
        nameAr: 'تسجيل منشأة مقيم',
        authorityId: muqeem.id,
        scope: 'ENTITY',
        defaultCycleMonths: 12,
        // Null, not 0: we have not verified Muqeem's fee, and "SAR 0" would
        // assert it is free. "Not recorded" is the honest rendering.
        typicalFee: null,
        requiredDocuments: [
          { code: 'cr_copy', label: 'CR copy', labelAr: 'نسخة السجل التجاري' },
          {
            code: 'authorised_person',
            label: 'Authorised person letter',
            labelAr: 'خطاب تفويض',
          },
        ],
      },
    });

    const existing = await prisma.license.findFirst({
      where: { tenantId: tenant.id, licenseNumber: 'DEMO-MUQ-9001' },
      select: { id: true },
    });
    if (!existing) {
      const licence = await prisma.license.create({
        data: {
          tenantId: tenant.id,
          licenseTypeId: type.id,
          siteId: null, // ENTITY scope
          ownerUserId: ahmed?.id ?? null,
          name: 'Muqeem Establishment Registration',
          authority: 'Muqeem',
          licenseNumber: 'DEMO-MUQ-9001',
          issueDate: new Date(`${addDays(today, -320)}T00:00:00.000Z`),
          expiryDate: new Date(`${addDays(today, 40)}T00:00:00.000Z`),
        },
      });
      await reminders.reconcile(licence.id);
      console.log('  created API_ELIGIBLE licence (Muqeem)');
    }
  }

  // ── Documents ───────────────────────────────────────────────────────────
  const targets = await prisma.license.findMany({
    where: { tenantId: tenant.id, lifecycle: 'ACTIVE' },
    select: { id: true, name: true, licenseNumber: true },
    orderBy: { licenseNumber: 'asc' },
  });

  const alreadyHas = new Set(
    (
      await prisma.licenseDocument.findMany({
        where: { tenantId: tenant.id },
        select: { licenseId: true },
      })
    ).map((row) => row.licenseId),
  );

  let uploaded = 0;
  const upload = async (
    licenseId: string,
    code: string,
    label: string,
    expiresOn: string | null,
  ) => {
    await documents.upload(tenant.id, actor.id, {
      licenseId,
      documentCode: code,
      expiresOn,
      originalFilename: `${code}-demo.pdf`,
      data: stubPdf(label),
    });
    uploaded += 1;
  };

  for (const [index, licence] of targets.entries()) {
    if (alreadyHas.has(licence.id)) continue;

    // Rotate through the three states so the demo shows all of them.
    if (index % 3 === 0) {
      // Complete-ish: two in-date documents.
      await upload(licence.id, 'lease', 'lease', addDays(today, 400));
      await upload(licence.id, 'cr_copy', 'cr copy', null);
    } else if (index % 3 === 1) {
      // One EXPIRED supporting document on a licence that is itself fine.
      await upload(licence.id, 'lease', 'lease', addDays(today, -12));
    }
    // index % 3 === 2 → nothing uploaded, so everything reads MISSING.
  }

  console.log(`  documents uploaded: ${uploaded}`);
  console.log(
    '\nChecklist states present in demo data: PRESENT, EXPIRED, MISSING.',
  );
  await prisma.onModuleDestroy();
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

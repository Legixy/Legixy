/**
 * Documents and renewal preparation — integration tests against a real
 * PostgreSQL database and a real (temporary) encrypted filesystem store.
 *
 * The isolation guarantee is a `where` clause evaluated by Postgres and the
 * encryption is real AES-GCM; mocking either would prove nothing.
 *
 * SAFETY: refuses to run against a database whose name does not end in `_test`.
 */

import { ConfigService } from '@nestjs/config';
import {
  BadRequestException,
  NotFoundException,
  PayloadTooLargeException,
} from '@nestjs/common';
import * as dotenv from 'dotenv';
import { mkdtempSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { readFile, rm } from 'fs/promises';
import { join } from 'path';
import { PrismaService } from '../../../database/prisma.service';
import { ComplianceAuditService } from '../audit/compliance-audit.service';
import { LicensesService } from '../licenses/licenses.service';
import { SitesService } from '../sites/sites.service';
import { RemindersService } from '../reminders/reminders.service';
import { DocumentsService } from './documents.service';
import { LocalDocumentStorage } from './document-storage';
import {
  DEFAULT_RETENTION_DAYS,
  DocumentRetentionService,
} from './document-retention.service';
import { RenewalService } from '../renewal/renewal.service';
import { addDays, todayIn } from '../domain/plain-date';
import { MAX_DOCUMENT_BYTES } from '../domain/file-safety';

dotenv.config();

const TEST_DATABASE_URL = process.env.TEST_DATABASE_URL ?? '';
if (!TEST_DATABASE_URL) throw new Error('TEST_DATABASE_URL is not set.');
if (!/_test(\?|$)/.test(new URL(TEST_DATABASE_URL).pathname + '?')) {
  throw new Error('Refusing to run: database name must end in "_test".');
}

const PDF = () => Buffer.concat([Buffer.from('%PDF-1.7'), Buffer.alloc(64, 7)]);

describe('Documents & renewal (integration)', () => {
  let prisma: PrismaService;
  let sites: SitesService;
  let licenses: LicensesService;
  let documents: DocumentsService;
  let renewal: RenewalService;
  let storageRoot: string;

  let tenantA: string;
  let tenantB: string;
  let userA: string;
  let userB: string;
  let storage: LocalDocumentStorage;
  let retention: DocumentRetentionService;
  let siteA: string;
  let typeId: string;
  let licenceA: string;
  const suffix = Date.now();
  const today = todayIn('Asia/Riyadh');

  beforeAll(async () => {
    storageRoot = mkdtempSync(join(tmpdir(), 'onyx-docs-'));
    process.env.DOCUMENT_STORAGE_PATH = storageRoot;
    process.env.DOCUMENT_ENCRYPTION_KEY = 'test-key-that-is-long-enough-1234';

    const config = {
      get: (key: string, fallback?: string) =>
        key === 'DATABASE_URL' ? TEST_DATABASE_URL : fallback,
    } as unknown as ConfigService;

    prisma = new PrismaService(config);
    await prisma.onModuleInit();

    const audit = new ComplianceAuditService(prisma);
    sites = new SitesService(prisma, audit);
    licenses = new LicensesService(prisma, audit, new RemindersService(prisma));
    storage = new LocalDocumentStorage();
    documents = new DocumentsService(prisma, storage, audit);
    retention = new DocumentRetentionService(prisma, storage, audit);
    renewal = new RenewalService(prisma);

    const makeTenant = async (label: string) => {
      const tenant = await prisma.tenant.create({
        data: { name: `${label}-${suffix}`, timeZone: 'Asia/Riyadh' },
      });
      const user = await prisma.user.create({
        data: {
          tenantId: tenant.id,
          email: `${label}-${suffix}@example.test`,
          role: 'OWNER',
        },
      });
      return { tenantId: tenant.id, userId: user.id };
    };

    const a = await makeTenant('docs-a');
    const b = await makeTenant('docs-b');
    tenantA = a.tenantId;
    userA = a.userId;
    tenantB = b.tenantId;
    userB = b.userId;
    siteA = (await sites.create(tenantA, userA, { name: 'Docs Site' })).id;

    const authority = await prisma.authority.upsert({
      where: { name: `Docs Authority ${suffix}` },
      update: {},
      create: {
        name: `Docs Authority ${suffix}`,
        nameAr: 'جهة',
        portalUrl: 'https://example.test',
        submissionRoute: 'PREPARE_ONLY',
      },
    });
    typeId = (
      await prisma.licenseType.create({
        data: {
          name: `Docs Type ${suffix}`,
          nameAr: 'نوع',
          authorityId: authority.id,
          scope: 'SITE',
          defaultCycleMonths: 12,
          typicalFee: 2000,
          requiredDocuments: [
            { code: 'lease', label: 'Lease contract', labelAr: 'عقد' },
            { code: 'cd_cert', label: 'Civil Defence cert', labelAr: 'شهادة' },
          ],
        },
      })
    ).id;

    licenceA = (
      await licenses.create(tenantA, userA, {
        name: 'Docs Licence',
        siteId: siteA,
        licenseTypeId: typeId,
        ownerUserId: userA,
        expiryDate: addDays(today, 45),
      })
    ).id;
  });

  afterAll(async () => {
    if (prisma) {
      await prisma.tenant
        .deleteMany({ where: { id: { in: [tenantA, tenantB] } } })
        .catch(() => undefined);
      await prisma.onModuleDestroy();
    }
    if (storageRoot) rmSync(storageRoot, { recursive: true, force: true });
  });

  // ── Upload / retrieve / soft-delete ────────────────────────────────────
  describe('lifecycle', () => {
    it('uploads, retrieves the bytes intact, and soft-deletes', async () => {
      const payload = PDF();
      const uploaded = await documents.upload(tenantA, userA, {
        licenseId: licenceA,
        documentCode: 'lease',
        originalFilename: 'lease-2026.pdf',
        data: payload,
      });

      expect(uploaded.mimeType).toBe('application/pdf');
      expect(uploaded.sizeBytes).toBe(payload.length);

      // Round-trips through real AES-GCM encryption on disk.
      const fetched = await documents.download(tenantA, userA, uploaded.id);
      expect(fetched.data.equals(payload)).toBe(true);
      expect(fetched.filename).toBe('lease-2026.pdf');

      const removed = await documents.remove(tenantA, userA, uploaded.id);
      expect(removed.deletedAt).not.toBeNull();

      // Gone from listings, and no longer downloadable...
      const listed = await documents.findForLicense(tenantA, licenceA);
      expect(listed.some((d) => d.id === uploaded.id)).toBe(false);
      await expect(
        documents.download(tenantA, userA, uploaded.id),
      ).rejects.toThrow(NotFoundException);

      // ...but the row survives: a compliance document must be recoverable.
      const row = await prisma.licenseDocument.findUnique({
        where: { id: uploaded.id },
      });
      expect(row).not.toBeNull();
      expect(row?.deletedAt).not.toBeNull();
    });

    it('stores bytes ENCRYPTED, not as plaintext on disk', async () => {
      const marker = Buffer.concat([
        Buffer.from('%PDF-1.7'),
        Buffer.from('IQAMA-2412345678-SECRET'),
      ]);
      const uploaded = await documents.upload(tenantA, userA, {
        licenseId: licenceA,
        originalFilename: 'sensitive.pdf',
        data: marker,
      });

      const row = await prisma.licenseDocument.findUnique({
        where: { id: uploaded.id },
        select: { storageKey: true },
      });
      const onDisk = await readFile(join(storageRoot, row!.storageKey));

      // The identifier must not be readable by anyone with filesystem access.
      expect(onDisk.includes('IQAMA-2412345678-SECRET')).toBe(false);
      expect(onDisk.subarray(0, 8).toString()).not.toBe('%PDF-1.7');
    });
  });

  // ── Validation ─────────────────────────────────────────────────────────
  describe('validation', () => {
    it('rejects a disallowed type even when the extension looks fine', async () => {
      const elf = Buffer.from([0x7f, 0x45, 0x4c, 0x46, 0x02, 0x01, 0x01]);
      await expect(
        documents.upload(tenantA, userA, {
          licenseId: licenceA,
          originalFilename: 'harmless.pdf',
          data: elf,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects an oversized file', async () => {
      const tooBig = Buffer.concat([
        Buffer.from('%PDF-1.7'),
        Buffer.alloc(MAX_DOCUMENT_BYTES + 1),
      ]);
      await expect(
        documents.upload(tenantA, userA, {
          licenseId: licenceA,
          originalFilename: 'huge.pdf',
          data: tooBig,
        }),
      ).rejects.toThrow(PayloadTooLargeException);
    });

    it('rejects an empty file', async () => {
      await expect(
        documents.upload(tenantA, userA, {
          licenseId: licenceA,
          originalFilename: 'empty.pdf',
          data: Buffer.alloc(0),
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('sanitises a traversal filename before storing it', async () => {
      const uploaded = await documents.upload(tenantA, userA, {
        licenseId: licenceA,
        originalFilename: '../../../etc/passwd.pdf',
        data: PDF(),
      });
      expect(uploaded.filename).toBe('passwd.pdf');

      // And the storage key owes nothing to the supplied name.
      const row = await prisma.licenseDocument.findUnique({
        where: { id: uploaded.id },
        select: { storageKey: true },
      });
      expect(row?.storageKey).toContain(`tenants/${tenantA}/`);
      expect(row?.storageKey).not.toContain('passwd');
      expect(row?.storageKey).not.toContain('..');
    });
  });

  // ── Tenant isolation ───────────────────────────────────────────────────
  describe('tenant isolation', () => {
    let documentOfA: string;
    let storageKeyOfA: string;

    beforeAll(async () => {
      const uploaded = await documents.upload(tenantA, userA, {
        licenseId: licenceA,
        documentCode: 'cd_cert',
        originalFilename: 'confidential.pdf',
        data: PDF(),
      });
      documentOfA = uploaded.id;
      storageKeyOfA = (await prisma.licenseDocument.findUnique({
        where: { id: documentOfA },
        select: { storageKey: true },
      }))!.storageKey;
    });

    it('tenant B cannot download tenant A’s document BY ID', async () => {
      await expect(
        documents.download(tenantB, userB, documentOfA),
      ).rejects.toThrow(NotFoundException);
    });

    it('tenant B cannot soft-delete tenant A’s document', async () => {
      await expect(
        documents.remove(tenantB, userB, documentOfA),
      ).rejects.toThrow(NotFoundException);

      const row = await prisma.licenseDocument.findUnique({
        where: { id: documentOfA },
      });
      expect(row?.deletedAt).toBeNull();
    });

    it('tenant B cannot reach it BY STORAGE KEY either', async () => {
      // Even holding the opaque key, there is no tenant-B row for it, so no
      // API path resolves it.
      const visible = await prisma.licenseDocument.findFirst({
        where: { storageKey: storageKeyOfA, tenantId: tenantB },
      });
      expect(visible).toBeNull();
    });

    it('tenant B’s document listing excludes tenant A’s documents', async () => {
      const listed = await documents.findForLicense(tenantB, licenceA);
      expect(listed).toHaveLength(0);
    });

    it('renewal preparation is denied for another tenant’s licence', async () => {
      await expect(renewal.prepare(tenantB, licenceA)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ── Audit ──────────────────────────────────────────────────────────────
  describe('audit trail', () => {
    it('records upload AND download, scoped to the tenant', async () => {
      const uploaded = await documents.upload(tenantA, userA, {
        licenseId: licenceA,
        originalFilename: 'audited.pdf',
        data: PDF(),
      });
      await documents.download(tenantA, userA, uploaded.id);

      const entries = await prisma.complianceAuditLog.findMany({
        where: { tenantId: tenantA, entityId: uploaded.id },
      });
      const actions = entries.map((e) => e.action);

      // "Who looked at the GOSI certificate" is exactly what a data-protection
      // review asks, so reads are audited as well as writes.
      expect(actions).toContain('document.uploaded');
      expect(actions).toContain('document.downloaded');
      expect(entries.every((e) => e.entityType === 'document')).toBe(true);
      expect(entries.every((e) => e.tenantId === tenantA)).toBe(true);
    });

    it('never records file contents in the audit log', async () => {
      const secret = Buffer.concat([
        Buffer.from('%PDF-1.7'),
        Buffer.from('NATIONAL-ID-1010234567'),
      ]);
      const uploaded = await documents.upload(tenantA, userA, {
        licenseId: licenceA,
        originalFilename: 'secret.pdf',
        data: secret,
      });

      const entry = await prisma.complianceAuditLog.findFirst({
        where: { entityId: uploaded.id, action: 'document.uploaded' },
      });
      expect(JSON.stringify(entry?.changes)).not.toContain('NATIONAL-ID');
    });
  });

  // ── Checklist & renewal preparation ────────────────────────────────────
  describe('renewal preparation', () => {
    let checklistLicence: string;

    beforeAll(async () => {
      checklistLicence = (
        await licenses.create(tenantA, userA, {
          name: 'Checklist Licence',
          siteId: siteA,
          licenseTypeId: typeId,
          ownerUserId: userA,
          expiryDate: addDays(today, 30),
        })
      ).id;
    });

    it('shows MISSING for every requirement before anything is uploaded', async () => {
      const prep = await renewal.prepare(tenantA, checklistLicence);
      expect(prep.checklist).toHaveLength(2);
      expect(prep.checklist.every((i) => i.state === 'MISSING')).toBe(true);
    });

    it('shows PRESENT once an in-date document is uploaded', async () => {
      await documents.upload(tenantA, userA, {
        licenseId: checklistLicence,
        documentCode: 'lease',
        expiresOn: addDays(today, 400),
        originalFilename: 'lease.pdf',
        data: PDF(),
      });

      const prep = await renewal.prepare(tenantA, checklistLicence);
      expect(prep.checklist.find((i) => i.code === 'lease')?.state).toBe(
        'PRESENT',
      );
      expect(prep.checklist.find((i) => i.code === 'cd_cert')?.state).toBe(
        'MISSING',
      );
    });

    it('shows EXPIRED for a document past its own expiresOn', async () => {
      await documents.upload(tenantA, userA, {
        licenseId: checklistLicence,
        documentCode: 'cd_cert',
        expiresOn: addDays(today, -5),
        originalFilename: 'old-cert.pdf',
        data: PDF(),
      });

      const prep = await renewal.prepare(tenantA, checklistLicence);
      expect(prep.checklist.find((i) => i.code === 'cd_cert')?.state).toBe(
        'EXPIRED',
      );
    });

    it('DOCUMENT EXPIRY IS INDEPENDENT OF LICENCE EXPIRY', async () => {
      // A current licence carrying an expired supporting document.
      const currentLicence = await licenses.create(tenantA, userA, {
        name: 'Current with stale doc',
        siteId: siteA,
        licenseTypeId: typeId,
        ownerUserId: userA,
        expiryDate: addDays(today, 300), // licence is healthy
      });
      await documents.upload(tenantA, userA, {
        licenseId: currentLicence.id,
        documentCode: 'lease',
        expiresOn: addDays(today, -10), // document is not
        originalFilename: 'stale.pdf',
        data: PDF(),
      });

      const prep = await renewal.prepare(tenantA, currentLicence.id);
      expect(prep.daysUntilExpiry).toBe(300);
      expect(prep.checklist.find((i) => i.code === 'lease')?.state).toBe(
        'EXPIRED',
      );

      // And the reverse: an expiring licence with a long-lived document.
      const expiringLicence = await licenses.create(tenantA, userA, {
        name: 'Expiring with fresh doc',
        siteId: siteA,
        licenseTypeId: typeId,
        ownerUserId: userA,
        expiryDate: addDays(today, 3),
      });
      await documents.upload(tenantA, userA, {
        licenseId: expiringLicence.id,
        documentCode: 'lease',
        expiresOn: addDays(today, 900),
        originalFilename: 'fresh.pdf',
        data: PDF(),
      });

      const prep2 = await renewal.prepare(tenantA, expiringLicence.id);
      expect(prep2.daysUntilExpiry).toBe(3);
      expect(prep2.checklist.find((i) => i.code === 'lease')?.state).toBe(
        'PRESENT',
      );
    });

    it('carries the fee, authority, portal and proposed new expiry', async () => {
      const prep = await renewal.prepare(tenantA, checklistLicence);
      expect(prep.typicalFee).toBe('2000');
      expect(prep.authority?.name).toContain('Docs Authority');
      expect(prep.authority?.portalUrl).toBe('https://example.test');
      // 12-month cycle from the licence's own expiry.
      expect(prep.proposedExpiry).toBe(
        (() => {
          const [y, m, d] = addDays(today, 30).split('-').map(Number);
          return `${y + 1}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        })(),
      );
      expect(prep.guidance.humanSubmits).toBe(true);
    });

    it('an ARCHIVED licence keeps its documents but produces no preparation', async () => {
      const archivable = await licenses.create(tenantA, userA, {
        name: 'To archive with docs',
        siteId: siteA,
        licenseTypeId: typeId,
        ownerUserId: userA,
        expiryDate: addDays(today, 20),
      });
      const uploaded = await documents.upload(tenantA, userA, {
        licenseId: archivable.id,
        documentCode: 'lease',
        originalFilename: 'kept.pdf',
        data: PDF(),
      });

      await licenses.archive(tenantA, userA, archivable.id);

      // Evidence remains retrievable...
      const fetched = await documents.download(tenantA, userA, uploaded.id);
      expect(fetched.filename).toBe('kept.pdf');

      // ...but there is nothing to prepare for a licence nobody is tracking.
      const prep = await renewal.prepare(tenantA, archivable.id);
      expect(prep.inRenewalWindow).toBe(false);
    });

    it('is out of window for a licence far from expiry', async () => {
      const distant = await licenses.create(tenantA, userA, {
        name: 'Far away',
        siteId: siteA,
        licenseTypeId: typeId,
        ownerUserId: userA,
        expiryDate: addDays(today, 300),
      });
      expect((await renewal.prepare(tenantA, distant.id)).inRenewalWindow).toBe(
        false,
      );
    });
  });

  describe('retention — soft-deleted bytes do not live forever', () => {
    const DAY = 24 * 60 * 60 * 1000;
    const pdf = () => Buffer.from('%PDF-1.7 retention subject');

    const uploadThenRemove = async (removedDaysAgo: number) => {
      const doc = await documents.upload(tenantA, userA, {
        licenseId: licenceA,
        originalFilename: 'retained.pdf',
        data: pdf(),
      });
      await documents.remove(tenantA, userA, doc.id);
      // Backdate the removal rather than wait 90 days.
      await prisma.licenseDocument.update({
        where: { id: doc.id },
        data: { deletedAt: new Date(Date.now() - removedDaysAgo * DAY) },
      });
      const row = await prisma.licenseDocument.findUnique({
        where: { id: doc.id },
        select: { storageKey: true },
      });
      return { id: doc.id, storageKey: row!.storageKey };
    };

    const onDisk = async (storageKey: string) => {
      try {
        await readFile(join(storageRoot, storageKey));
        return true;
      } catch {
        return false;
      }
    };

    it('purges bytes for a document removed longer ago than the window', async () => {
      const doc = await uploadThenRemove(DEFAULT_RETENTION_DAYS + 1);
      expect(await onDisk(doc.storageKey)).toBe(true);

      const outcome = await retention.purgeExpired();
      expect(outcome.purged).toBeGreaterThanOrEqual(1);
      expect(await onDisk(doc.storageKey)).toBe(false);
    });

    it('KEEPS the row as an audit tombstone after purging the bytes', async () => {
      // Destroying the row too would erase the evidence that the document ever
      // existed, which is the opposite of what a compliance audit needs.
      const doc = await uploadThenRemove(DEFAULT_RETENTION_DAYS + 5);
      await retention.purgeExpired();

      const row = await prisma.licenseDocument.findUnique({
        where: { id: doc.id },
      });
      expect(row).not.toBeNull();
      expect(row!.purgedAt).not.toBeNull();
      expect(row!.filename).toBe('retained.pdf');
    });

    it('writes the purge to the compliance audit log', async () => {
      const doc = await uploadThenRemove(DEFAULT_RETENTION_DAYS + 2);
      await retention.purgeExpired();

      const entry = await prisma.complianceAuditLog.findFirst({
        where: { entityId: doc.id, action: 'document.purged' },
      });
      expect(entry).not.toBeNull();
      expect(entry!.tenantId).toBe(tenantA);
      // No human did this, so no human is named.
      expect(entry!.actorUserId).toBeNull();
    });

    it('never records the filename or the bytes in the audit entry', async () => {
      const doc = await uploadThenRemove(DEFAULT_RETENTION_DAYS + 3);
      await retention.purgeExpired();

      const entry = await prisma.complianceAuditLog.findFirst({
        where: { entityId: doc.id, action: 'document.purged' },
      });
      const serialised = JSON.stringify(entry!.changes);
      expect(serialised).not.toContain('retained.pdf');
      expect(serialised).not.toContain('%PDF');
      expect(serialised).not.toContain('tenants/');
    });

    it('does NOT purge a document still inside the window', async () => {
      const doc = await uploadThenRemove(DEFAULT_RETENTION_DAYS - 1);

      await retention.purgeExpired();

      expect(await onDisk(doc.storageKey)).toBe(true);
      const row = await prisma.licenseDocument.findUnique({
        where: { id: doc.id },
        select: { purgedAt: true },
      });
      expect(row!.purgedAt).toBeNull();
    });

    it('does NOT purge a document that was never removed', async () => {
      const live = await documents.upload(tenantA, userA, {
        licenseId: licenceA,
        originalFilename: 'live.pdf',
        data: pdf(),
      });
      const row = await prisma.licenseDocument.findUnique({
        where: { id: live.id },
        select: { storageKey: true },
      });

      await retention.purgeExpired();

      expect(await onDisk(row!.storageKey)).toBe(true);
    });

    it('is idempotent — a second sweep purges nothing again', async () => {
      await uploadThenRemove(DEFAULT_RETENTION_DAYS + 10);
      const first = await retention.purgeExpired();
      const second = await retention.purgeExpired();

      expect(first.purged).toBeGreaterThanOrEqual(1);
      expect(second.purged).toBe(0);
      expect(second.failed).toBe(0);
    });

    it('treats an already-missing file as purged, not as a failure', async () => {
      // The goal is "the bytes are gone". If they already are, that is success.
      const doc = await uploadThenRemove(DEFAULT_RETENTION_DAYS + 4);
      await rm(join(storageRoot, doc.storageKey), { force: true });

      const outcome = await retention.purgeExpired();

      expect(outcome.failed).toBe(0);
      const row = await prisma.licenseDocument.findUnique({
        where: { id: doc.id },
        select: { purgedAt: true },
      });
      expect(row!.purgedAt).not.toBeNull();
    });
  });

  describe('archived licences take no new documents', () => {
    let archivedLicence: string;

    beforeAll(async () => {
      archivedLicence = (
        await licenses.create(tenantA, userA, {
          name: 'Archived Licence',
          siteId: siteA,
          licenseTypeId: typeId,
          ownerUserId: userA,
          expiryDate: addDays(today, 60),
        })
      ).id;
    });

    it('REJECTS an upload to an archived licence', async () => {
      const doc = await documents.upload(tenantA, userA, {
        licenseId: archivedLicence,
        originalFilename: 'before-archive.pdf',
        data: Buffer.from('%PDF-1.7 pre'),
      });
      expect(doc.id).toBeTruthy();

      await licenses.archive(tenantA, userA, archivedLicence);

      // The UI hides the control; the server must agree, or the restriction is
      // decoration that devtools removes.
      await expect(
        documents.upload(tenantA, userA, {
          licenseId: archivedLicence,
          originalFilename: 'after-archive.pdf',
          data: Buffer.from('%PDF-1.7 post'),
        }),
      ).rejects.toThrow(/archived/i);
    });

    it('keeps existing documents listed and downloadable once archived', async () => {
      // Archiving takes the licence out of scope. It does not destroy the
      // evidence, and a regulator may still ask for it.
      const listed = await documents.findForLicense(tenantA, archivedLicence);
      expect(listed.length).toBeGreaterThanOrEqual(1);

      const file = await documents.download(tenantA, userA, listed[0].id);
      expect(file.data.toString()).toContain('%PDF');
      expect(file.filename).toBe('before-archive.pdf');
    });
  });

  describe('encryption key identity', () => {
    it('records the active key id on upload', async () => {
      const doc = await documents.upload(tenantA, userA, {
        licenseId: licenceA,
        originalFilename: 'keyed.pdf',
        data: Buffer.from('%PDF-1.7 keyed'),
      });

      const row = await prisma.licenseDocument.findUnique({
        where: { id: doc.id },
        select: { encryptionKeyId: true },
      });
      expect(row!.encryptionKeyId).toBe(storage.keyId());
      expect(row!.encryptionKeyId).toMatch(/^[0-9a-f]{12}$/);
    });

    it('the key id is a fingerprint, never the key itself', () => {
      // It is stored in the database and written to logs, so it must not be
      // reversible into the key or contain any part of it.
      const key = process.env.DOCUMENT_ENCRYPTION_KEY!;
      const id = storage.keyId();
      expect(id).not.toContain(key);
      expect(key).not.toContain(id);
      expect(id.length).toBe(12);
    });

    it('a document under the CURRENT key remains readable', async () => {
      const doc = await documents.upload(tenantA, userA, {
        licenseId: licenceA,
        originalFilename: 'readable.pdf',
        data: Buffer.from('%PDF-1.7 still readable'),
      });

      const file = await documents.download(tenantA, userA, doc.id);
      expect(file.data.toString()).toContain('still readable');
    });

    it('REFUSES a document sealed under a different key, with an explanation', async () => {
      // This is what happens to every existing document the day a real key is
      // introduced. Without the id it fails as an opaque authentication error
      // from inside the cipher; with it, the reason is knowable.
      const doc = await documents.upload(tenantA, userA, {
        licenseId: licenceA,
        originalFilename: 'stale-key.pdf',
        data: Buffer.from('%PDF-1.7 old key'),
      });
      await prisma.licenseDocument.update({
        where: { id: doc.id },
        data: { encryptionKeyId: 'deadbeef1234' },
      });

      await expect(documents.download(tenantA, userA, doc.id)).rejects.toThrow(
        /previous key/i,
      );
    });

    it('a purged document 404s like any other removed one, revealing nothing', async () => {
      const doc = await documents.upload(tenantA, userA, {
        licenseId: licenceA,
        originalFilename: 'gone.pdf',
        data: Buffer.from('%PDF-1.7 gone'),
      });
      await documents.remove(tenantA, userA, doc.id);
      await prisma.licenseDocument.update({
        where: { id: doc.id },
        data: { purgedAt: new Date() },
      });

      // Same error as a document that never existed. A distinct "purged"
      // message would confirm the id was once real.
      await expect(documents.download(tenantA, userA, doc.id)).rejects.toThrow(
        /not found/i,
      );
    });
  });
});

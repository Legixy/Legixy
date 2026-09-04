import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
  PayloadTooLargeException,
  ServiceUnavailableException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PrismaService } from '../../../database/prisma.service';
import { ComplianceAuditService } from '../audit/compliance-audit.service';
import {
  buildStorageKey,
  MAX_DOCUMENT_BYTES,
  sanitiseFilename,
  sniffMimeType,
} from '../domain/file-safety';
import { fromPrismaDate, toPrismaDate } from '../domain/plain-date';
import { DocumentStorage } from './document-storage';

export interface UploadDocumentInput {
  licenseId: string;
  documentCode?: string | null;
  issuedOn?: string | null;
  expiresOn?: string | null;
  originalFilename: string;
  data: Buffer;
}

/**
 * Licence documents.
 *
 * TENANT ISOLATION
 * ----------------
 * Every read resolves the document by `{ id, tenantId }` together — never by id
 * alone. A document is therefore unreachable from another tenant by id, by
 * storage key, or by guessing a URL: the query simply returns nothing and the
 * caller gets a 404, which also avoids confirming that the id exists elsewhere.
 *
 * AUDIT
 * -----
 * Every upload, download and removal writes to ComplianceAuditLog. Reads are
 * audited as well as writes, because "who looked at the GOSI certificate" is
 * exactly the question a data-protection review asks.
 */
@Injectable()
export class DocumentsService {
  private readonly logger = new Logger(DocumentsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: DocumentStorage,
    private readonly audit: ComplianceAuditService,
  ) {}

  async upload(
    tenantId: string,
    actorUserId: string,
    input: UploadDocumentInput,
  ) {
    // Refuse before touching the licence or the bytes: if storage has no real
    // key, nothing may be written at all, and saying so first is clearest.
    const refusal = this.storage.refusalReason();
    if (refusal) throw new ServiceUnavailableException(refusal);

    const license = await this.prisma.license.findFirst({
      where: { id: input.licenseId, tenantId },
      select: { id: true, lifecycle: true },
    });
    if (!license) throw new NotFoundException('Licence not found');

    // Archiving means the licence is out of scope, so it takes no new
    // paperwork. Existing documents stay readable and downloadable.
    if (license.lifecycle === 'ARCHIVED') {
      throw new ConflictException(
        'This licence is archived, so it cannot take new documents. ' +
          'Its existing documents are still available.',
      );
    }

    if (input.data.length === 0) {
      throw new BadRequestException('The uploaded file is empty.');
    }
    if (input.data.length > MAX_DOCUMENT_BYTES) {
      throw new PayloadTooLargeException(
        `Documents must be ${Math.floor(MAX_DOCUMENT_BYTES / (1024 * 1024))}MB or smaller.`,
      );
    }

    // The client's Content-Type is not consulted. Only the bytes decide.
    const mimeType = sniffMimeType(input.data);
    if (!mimeType) {
      throw new BadRequestException(
        'Unsupported file type. Upload a PDF, JPEG, PNG or WebP.',
      );
    }

    const filename = sanitiseFilename(input.originalFilename);
    const storageKey = buildStorageKey(tenantId, input.licenseId, randomUUID());

    await this.storage.put(storageKey, input.data);

    const document = await this.prisma.licenseDocument.create({
      data: {
        tenantId,
        licenseId: input.licenseId,
        documentCode: input.documentCode || null,
        filename,
        mimeType,
        sizeBytes: input.data.length,
        storageKey,
        // Recorded so a later key change can identify what this was sealed
        // with, instead of every old document failing indistinguishably.
        encryptionKeyId: this.storage.keyId(),
        issuedOn: input.issuedOn ? toPrismaDate(input.issuedOn) : null,
        expiresOn: input.expiresOn ? toPrismaDate(input.expiresOn) : null,
        uploadedById: actorUserId,
      },
    });

    await this.audit.record({
      tenantId,
      actorUserId,
      action: 'document.uploaded',
      entityType: 'document',
      entityId: document.id,
      // Metadata only. The audit log never records file contents.
      changes: {
        licenseId: { from: null, to: input.licenseId },
        documentCode: { from: null, to: document.documentCode },
      },
    });

    this.logger.log(
      `Document uploaded for licence ${input.licenseId} (${document.sizeBytes} bytes)`,
    );
    return this.toSummary(document);
  }

  /** Documents for one licence. Excludes soft-deleted rows. */
  async findForLicense(tenantId: string, licenseId: string) {
    const documents = await this.prisma.licenseDocument.findMany({
      where: { tenantId, licenseId, deletedAt: null },
      orderBy: { uploadedAt: 'desc' },
      include: {
        uploadedBy: { select: { id: true, name: true, email: true } },
      },
    });
    return documents.map((document) => this.toSummary(document));
  }

  /**
   * Fetch the bytes for download.
   *
   * Streams through the authenticated API rather than handing out a signed URL:
   * a signed URL is a bearer capability that leaks through history, referrers
   * and logs, and cannot be revoked before it expires. Routing through here
   * keeps every read tenant-checked and audited.
   */
  async download(tenantId: string, actorUserId: string, documentId: string) {
    // `deletedAt: null` also covers every purged document: retention only
    // ever purges rows that were already soft-deleted, so a purged file is
    // unreachable here and returns the same 404 as any removed one. That is
    // deliberate — a distinct "purged" error would confirm the document once
    // existed to anyone probing ids.
    const document = await this.prisma.licenseDocument.findFirst({
      where: { id: documentId, tenantId, deletedAt: null },
    });
    if (!document) throw new NotFoundException('Document not found');

    // Checked BEFORE attempting to decrypt, so a key change produces an
    // explanation rather than an authentication error from inside the cipher.
    const activeKeyId = this.storage.keyId();
    if (document.encryptionKeyId && document.encryptionKeyId !== activeKeyId) {
      this.logger.error(
        `Document ${document.id} was encrypted with key ${document.encryptionKeyId}, ` +
          `but the active key is ${activeKeyId}. It cannot be opened.`,
      );
      throw new UnprocessableEntityException(
        'This document was encrypted with a previous key and cannot be ' +
          'opened. Contact your administrator.',
      );
    }

    const data = await this.storage.get(document.storageKey);

    await this.audit.record({
      tenantId,
      actorUserId,
      action: 'document.downloaded',
      entityType: 'document',
      entityId: document.id,
    });

    return {
      data,
      filename: document.filename,
      mimeType: document.mimeType,
    };
  }

  /**
   * Soft-delete.
   *
   * The bytes are retained deliberately: a compliance document removed by
   * mistake must be recoverable, and destroying evidence is the wrong default
   * for a regulated business. A retention policy that eventually purges them is
   * a deployment decision, named in the slice report.
   */
  async remove(tenantId: string, actorUserId: string, documentId: string) {
    const document = await this.prisma.licenseDocument.findFirst({
      where: { id: documentId, tenantId, deletedAt: null },
    });
    if (!document) throw new NotFoundException('Document not found');

    const removed = await this.prisma.licenseDocument.update({
      where: { id: documentId },
      data: { deletedAt: new Date() },
    });

    await this.audit.record({
      tenantId,
      actorUserId,
      action: 'document.removed',
      entityType: 'document',
      entityId: documentId,
    });

    return this.toSummary(removed);
  }

  /** Metadata shape returned to clients. Never includes the storage key. */
  private toSummary(document: {
    id: string;
    licenseId: string;
    documentCode: string | null;
    filename: string;
    mimeType: string;
    sizeBytes: number;
    issuedOn: Date | null;
    expiresOn: Date | null;
    uploadedAt: Date;
    deletedAt: Date | null;
    uploadedBy?: { id: string; name: string | null; email: string } | null;
  }) {
    return {
      id: document.id,
      licenseId: document.licenseId,
      documentCode: document.documentCode,
      filename: document.filename,
      mimeType: document.mimeType,
      sizeBytes: document.sizeBytes,
      issuedOn: document.issuedOn ? fromPrismaDate(document.issuedOn) : null,
      expiresOn: document.expiresOn ? fromPrismaDate(document.expiresOn) : null,
      uploadedAt: document.uploadedAt,
      deletedAt: document.deletedAt,
      uploadedBy: document.uploadedBy ?? null,
    };
  }
}

import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { ComplianceAuditService } from '../audit/compliance-audit.service';
import { DocumentStorage } from './document-storage';

/**
 * How long a soft-deleted document's bytes are kept before being destroyed.
 *
 * WHY 90 DAYS
 * -----------
 * Two duties pull in opposite directions.
 *
 * Removing a compliance document by mistake must be recoverable — that is why
 * removal is a soft delete at all, and why the confirmation copy promises the
 * file is "not destroyed". A window measured in days would make that promise
 * hollow the moment someone noticed a week later.
 *
 * Against that, these files carry national ID numbers, iqama numbers and GOSI
 * records. Under Saudi PDPL personal data may not be kept longer than the
 * purpose requires, and "forever, because nothing ever deletes it" is not a
 * retention policy — it is the absence of one.
 *
 * 90 days is one business quarter: long enough that a mistake surfaces in a
 * review cycle and can still be undone, short enough that removed personal
 * data does not accumulate indefinitely. It is deliberately a constant rather
 * than a per-tenant setting — a retention policy nobody can quietly extend is
 * worth more than a configurable one.
 *
 * Overridable by DOCUMENT_RETENTION_DAYS for a deployment with a different
 * legal position, which is a decision someone must make explicitly.
 */
export const DEFAULT_RETENTION_DAYS = 90;

export function retentionDays(): number {
  const configured = Number(process.env.DOCUMENT_RETENTION_DAYS);
  return Number.isFinite(configured) && configured > 0
    ? configured
    : DEFAULT_RETENTION_DAYS;
}

export interface PurgeOutcome {
  purged: number;
  failed: number;
}

/**
 * Destroys the bytes of documents removed longer ago than the retention window.
 *
 * WHAT SURVIVES
 * -------------
 * The row does. `purgedAt` is stamped and the record stays as a tombstone, so
 * the audit trail can still answer "what was attached to this licence, who
 * uploaded it, and when did it go". Destroying the row as well would erase the
 * evidence that the document ever existed, which is the opposite of what a
 * compliance audit needs.
 *
 * Only the encrypted file is destroyed, and that is irreversible.
 */
@Injectable()
export class DocumentRetentionService {
  private readonly logger = new Logger(DocumentRetentionService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: DocumentStorage,
    private readonly audit: ComplianceAuditService,
  ) {}

  /**
   * One retention sweep.
   *
   * `now` is injectable so a test can place a document either side of the
   * window without waiting 90 days or mutating the system clock.
   */
  async purgeExpired(now: Date = new Date()): Promise<PurgeOutcome> {
    const cutoff = new Date(
      now.getTime() - retentionDays() * 24 * 60 * 60 * 1000,
    );

    const expired = await this.prisma.licenseDocument.findMany({
      where: {
        deletedAt: { not: null, lt: cutoff },
        // Skip anything already purged, so the sweep is idempotent.
        purgedAt: null,
      },
      select: {
        id: true,
        tenantId: true,
        licenseId: true,
        storageKey: true,
        documentCode: true,
      },
    });

    let purged = 0;
    let failed = 0;

    for (const document of expired) {
      try {
        await this.storage.delete(document.storageKey);
      } catch (error) {
        // A missing file is not a failure — the goal is "bytes are gone", and
        // they are. Anything else leaves the row alone so the next sweep
        // retries rather than claiming a purge that did not happen.
        const code = (error as NodeJS.ErrnoException)?.code;
        if (code !== 'ENOENT') {
          failed += 1;
          this.logger.error(
            `Retention purge failed for document ${document.id}: ${code ?? 'unknown error'}`,
          );
          continue;
        }
      }

      await this.prisma.licenseDocument.update({
        where: { id: document.id },
        data: { purgedAt: now },
      });

      await this.audit.record({
        tenantId: document.tenantId,
        // No human did this. A null actor is the truth, and inventing one
        // would corrupt the only record of who touched what.
        actorUserId: null,
        action: 'document.purged',
        entityType: 'document',
        entityId: document.id,
        changes: {
          // Metadata only — never the filename, never the contents.
          retentionDays: { from: null, to: retentionDays() },
          licenseId: { from: null, to: document.licenseId },
        },
      });

      purged += 1;
    }

    if (purged > 0 || failed > 0) {
      this.logger.log(
        `Retention sweep: purged=${purged} failed=${failed} ` +
          `(window ${retentionDays()} days)`,
      );
    }

    return { purged, failed };
  }
}

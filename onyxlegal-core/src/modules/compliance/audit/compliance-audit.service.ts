import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';

/**
 * Minimal audit trail for the compliance domain.
 *
 * The repository has no general-purpose audit framework, and inventing one
 * here would be out of scope. This records the handful of changes that
 * materially alter compliance state — expiry date, owner, licence number,
 * authority, and site assignment — and nothing else.
 *
 * Deliberately fire-and-forget: an audit write must never fail a business
 * operation. Failures are logged, not thrown.
 */

export type ComplianceEntityType =
  | 'license'
  | 'site'
  | 'document'
  | 'reminder'
  | 'renewal'
  /**
   * Tenant-level settings — currently only the reminder copy address.
   *
   * Where reminders go is a compliance-relevant change: it decides who is
   * told before a licence lapses, so it belongs in the same log as the
   * licence changes themselves rather than in a general settings history.
   */
  | 'tenant';

/** Changed fields only, as { field: { from, to } }. Never full row dumps. */
export type FieldChanges = Record<string, { from: unknown; to: unknown }>;

export interface AuditEntry {
  tenantId: string;
  actorUserId?: string | null;
  action: string;
  entityType: ComplianceEntityType;
  entityId: string;
  changes?: FieldChanges | null;
}

/**
 * Fields whose modification changes what the business owes a regulator,
 * or who is accountable for it. Only these are diffed into the audit log.
 */
export const AUDITED_LICENSE_FIELDS = [
  'expiryDate',
  'issueDate',
  'ownerUserId',
  'licenseNumber',
  'authority',
  'siteId',
  'name',
  'lifecycle',
] as const;

@Injectable()
export class ComplianceAuditService {
  private readonly logger = new Logger(ComplianceAuditService.name);

  constructor(private readonly prisma: PrismaService) {}

  async record(entry: AuditEntry): Promise<void> {
    try {
      await this.prisma.complianceAuditLog.create({
        data: {
          tenantId: entry.tenantId,
          actorUserId: entry.actorUserId ?? null,
          action: entry.action,
          entityType: entry.entityType,
          entityId: entry.entityId,
          changes: entry.changes ? (entry.changes as object) : undefined,
        },
      });
    } catch (error) {
      // Never let audit failure roll back a legitimate business change.
      this.logger.error(
        `Failed to write audit entry "${entry.action}" for ${entry.entityType} ${entry.entityId}: ` +
          `${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * Diff two snapshots across an allow-list of fields.
   * Returns null when nothing meaningful changed, so callers can skip the write.
   *
   * Dates are compared by calendar value, not object identity — two `Date`
   * instances for the same day would otherwise register as a change on
   * every save.
   */
  diff(
    before: Record<string, unknown>,
    after: Record<string, unknown>,
    fields: readonly string[],
  ): FieldChanges | null {
    const changes: FieldChanges = {};

    for (const field of fields) {
      const from = normalise(before[field]);
      const to = normalise(after[field]);
      if (from !== to) {
        changes[field] = { from, to };
      }
    }

    return Object.keys(changes).length > 0 ? changes : null;
  }
}

/** Reduce a value to a stable primitive for comparison and JSON storage. */
function normalise(value: unknown): string | number | boolean | null {
  if (value === null || value === undefined) return null;
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  if (
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean'
  ) {
    return value;
  }
  return JSON.stringify(value) ?? null;
}

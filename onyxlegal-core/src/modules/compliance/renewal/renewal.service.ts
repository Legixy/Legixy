import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { WARNING_WINDOW_DAYS } from '../domain/compliance.constants';
import { assessExpiry } from '../domain/license-status';
import { fromPrismaDate, PlainDate, todayIn } from '../domain/plain-date';
import {
  buildChecklist,
  ChecklistItem,
  isInRenewalWindow,
  proposedRenewalExpiry,
  RequiredDocument,
  routeGuidance,
  RouteGuidance,
  SubmissionRouteValue,
} from '../domain/renewal';

export interface RenewalPreparation {
  licenseId: string;
  licenseName: string;
  siteName: string | null;
  expiryDate: PlainDate | null;
  daysUntilExpiry: number | null;
  /** False when the licence is not yet close enough to expiry to prepare. */
  inRenewalWindow: boolean;
  authority: {
    name: string;
    nameAr: string;
    portalUrl: string | null;
    submissionRoute: SubmissionRouteValue;
  } | null;
  guidance: RouteGuidance;
  typicalFee: string | null;
  proposedExpiry: PlainDate | null;
  checklist: ChecklistItem[];
}

/**
 * Renewal preparation — derived, read-only.
 *
 * Assembles what a person needs to renew a licence: what documents are in
 * hand, what they will pay, who they file with, and what the new expiry would
 * be. It does NOT track a renewal in progress — there is no workflow entity in
 * this schema, and inventing one here would pre-empt a Slice 7 decision.
 *
 * Everything is computed on read. Nothing about a renewal is persisted.
 */
@Injectable()
export class RenewalService {
  constructor(private readonly prisma: PrismaService) {}

  async prepare(
    tenantId: string,
    licenseId: string,
  ): Promise<RenewalPreparation> {
    const license = await this.prisma.license.findFirst({
      where: { id: licenseId, tenantId },
      include: {
        site: { select: { name: true } },
        type: {
          select: {
            defaultCycleMonths: true,
            typicalFee: true,
            requiredDocuments: true,
            authority: {
              select: {
                name: true,
                nameAr: true,
                portalUrl: true,
                submissionRoute: true,
              },
            },
          },
        },
        documents: {
          where: { deletedAt: null },
          select: {
            id: true,
            documentCode: true,
            filename: true,
            expiresOn: true,
          },
        },
      },
    });

    if (!license) throw new NotFoundException('Licence not found');

    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { timeZone: true },
    });
    const today = todayIn(tenant?.timeZone ?? 'Asia/Riyadh');

    const expiryDate = license.expiryDate
      ? fromPrismaDate(license.expiryDate)
      : null;

    const required = (license.type?.requiredDocuments ??
      []) as unknown as RequiredDocument[];

    const checklist = buildChecklist(
      Array.isArray(required) ? required : [],
      license.documents.map((document) => ({
        id: document.id,
        documentCode: document.documentCode,
        filename: document.filename,
        expiresOn: document.expiresOn
          ? fromPrismaDate(document.expiresOn)
          : null,
      })),
      today,
    );

    const route = (license.type?.authority?.submissionRoute ??
      'PREPARE_ONLY') as SubmissionRouteValue;

    return {
      licenseId: license.id,
      licenseName: license.name,
      siteName: license.site?.name ?? null,
      expiryDate,
      daysUntilExpiry: assessExpiry(expiryDate, today).daysUntilExpiry,
      // An ARCHIVED licence is one the business stopped tracking, so there is
      // nothing to prepare — its documents stay retrievable, but no renewal.
      inRenewalWindow:
        license.lifecycle === 'ACTIVE' &&
        isInRenewalWindow(expiryDate, today, WARNING_WINDOW_DAYS),
      authority: license.type?.authority
        ? {
            name: license.type.authority.name,
            nameAr: license.type.authority.nameAr,
            portalUrl: license.type.authority.portalUrl,
            submissionRoute: route,
          }
        : null,
      guidance: routeGuidance(route),
      typicalFee: license.type?.typicalFee?.toString() ?? null,
      proposedExpiry: proposedRenewalExpiry(
        expiryDate,
        license.type?.defaultCycleMonths ?? null,
      ),
      checklist,
    };
  }
}

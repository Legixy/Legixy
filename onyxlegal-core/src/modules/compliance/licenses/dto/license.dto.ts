import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { LicenseLifecycle } from 'generated/prisma/client';
import { IsPlainDate } from '../../validation/is-plain-date.decorator';
import { LICENSE_EXPIRY_STATUSES } from '../../domain/license-status';

/**
 * Licence DTOs.
 *
 * `tenantId` never appears here — it comes from the authenticated JWT.
 * With the global ValidationPipe's `forbidNonWhitelisted: true`, a request
 * body containing `tenantId` is rejected with a 400 rather than silently
 * ignored, which makes the tenant-spoofing attempt visible.
 */

export class CreateLicenseDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  name: string;

  /**
   * Omit or pass null for a COMPANY-LEVEL licence.
   * The service verifies the site belongs to the caller's tenant.
   */
  @IsString()
  @IsOptional()
  siteId?: string | null;

  @IsString()
  @IsOptional()
  ownerUserId?: string | null;

  /** Catalogue type. Determines whether a siteId is required or forbidden. */
  @IsString()
  @IsOptional()
  licenseTypeId?: string | null;

  /** Printed Hijri date, display only. Never used for scheduling. */
  @IsString()
  @IsOptional()
  @MaxLength(40)
  hijriExpiry?: string | null;

  @IsString()
  @IsOptional()
  @MaxLength(120)
  licenseType?: string;

  @IsString()
  @IsOptional()
  @MaxLength(200)
  authority?: string;

  @IsString()
  @IsOptional()
  @MaxLength(120)
  licenseNumber?: string;

  @IsPlainDate()
  @IsOptional()
  issueDate?: string;

  /** Omit for a licence that genuinely never expires. */
  @IsPlainDate()
  @IsOptional()
  expiryDate?: string;

  @IsString()
  @IsOptional()
  @MaxLength(5000)
  notes?: string;
}

export class UpdateLicenseDto {
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  @MaxLength(200)
  name?: string;

  @IsString()
  @IsOptional()
  siteId?: string | null;

  @IsString()
  @IsOptional()
  ownerUserId?: string | null;

  /** Catalogue type. Determines whether a siteId is required or forbidden. */
  @IsString()
  @IsOptional()
  licenseTypeId?: string | null;

  /** Printed Hijri date, display only. Never used for scheduling. */
  @IsString()
  @IsOptional()
  @MaxLength(40)
  hijriExpiry?: string | null;

  @IsString()
  @IsOptional()
  @MaxLength(120)
  licenseType?: string;

  @IsString()
  @IsOptional()
  @MaxLength(200)
  authority?: string;

  @IsString()
  @IsOptional()
  @MaxLength(120)
  licenseNumber?: string;

  @IsPlainDate()
  @IsOptional()
  issueDate?: string | null;

  @IsPlainDate()
  @IsOptional()
  expiryDate?: string | null;

  @IsString()
  @IsOptional()
  @MaxLength(5000)
  notes?: string;
}

export class ListLicensesQueryDto {
  /** Site id, or the literal "none" for company-level licences only. */
  @IsString()
  @IsOptional()
  siteId?: string;

  @IsString()
  @IsOptional()
  ownerUserId?: string;

  @IsEnum(LicenseLifecycle)
  @IsOptional()
  lifecycle?: LicenseLifecycle;

  @IsEnum(LICENSE_EXPIRY_STATUSES as unknown as object, {
    message: `expiryStatus must be one of: ${LICENSE_EXPIRY_STATUSES.join(', ')}`,
  })
  @IsOptional()
  expiryStatus?: (typeof LICENSE_EXPIRY_STATUSES)[number];

  @IsBoolean()
  @IsOptional()
  @Type(() => Boolean)
  needsAttention?: boolean;

  @IsString()
  @IsOptional()
  @MaxLength(200)
  search?: string;

  @IsInt()
  @Type(() => Number)
  @Min(1)
  @IsOptional()
  page?: number = 1;

  @IsInt()
  @Type(() => Number)
  @Min(1)
  @Max(100)
  @IsOptional()
  limit?: number = 25;
}

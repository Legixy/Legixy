import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { IsInt, Max, Min } from 'class-validator';
import { SiteStatus } from 'generated/prisma/client';

/**
 * Site DTOs.
 *
 * `tenantId` is deliberately absent from every DTO in this domain. It is
 * resolved server-side from the authenticated JWT and passed into the
 * service as its first argument. The global ValidationPipe runs with
 * `forbidNonWhitelisted: true`, so a client that tries to smuggle a
 * `tenantId` in the body receives a 400 rather than having it ignored.
 */

export class CreateSiteDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  name: string;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  code?: string;

  @IsString()
  @IsOptional()
  @MaxLength(120)
  city?: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  address?: string;

  @IsEnum(SiteStatus)
  @IsOptional()
  status?: SiteStatus;
}

export class UpdateSiteDto {
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  @MaxLength(200)
  name?: string;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  code?: string;

  @IsString()
  @IsOptional()
  @MaxLength(120)
  city?: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  address?: string;

  @IsEnum(SiteStatus)
  @IsOptional()
  status?: SiteStatus;
}

export class ListSitesQueryDto {
  @IsEnum(SiteStatus)
  @IsOptional()
  status?: SiteStatus;

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

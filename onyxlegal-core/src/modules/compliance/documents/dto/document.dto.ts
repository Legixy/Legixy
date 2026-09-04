import { IsOptional, IsString, MaxLength } from 'class-validator';
import { IsPlainDate } from '../../validation/is-plain-date.decorator';

/**
 * Metadata accompanying an upload.
 *
 * `tenantId` is absent by design — the server resolves it from the auth cookie,
 * and the global ValidationPipe's `forbidNonWhitelisted` rejects any attempt to
 * supply one rather than ignoring it.
 *
 * The file itself arrives as multipart and is validated by content, not by any
 * field declared here.
 */
export class UploadDocumentDto {
  /** Matches a `code` in the licence type's requiredDocuments. */
  @IsString()
  @IsOptional()
  @MaxLength(80)
  documentCode?: string;

  @IsPlainDate()
  @IsOptional()
  issuedOn?: string;

  /** Document expiry — independent of the licence's own expiry date. */
  @IsPlainDate()
  @IsOptional()
  expiresOn?: string;
}

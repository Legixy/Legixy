import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Post,
  Query,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../../auth/jwt.strategy';
import {
  ImportFormat,
  ImportReadError,
  MAX_IMPORT_BYTES,
} from './domain/read-workbook';
import { ImportService, Resolutions } from './import.service';
import { buildTemplateCsv, buildTemplateXlsx } from './template';
import { ImportField } from './domain/fields';

interface PreviewBody {
  headers: string[];
  rows: string[][];
  mapping: Record<number, ImportField | null>;
  resolutions?: Resolutions;
}

interface CommitBody extends PreviewBody {
  filename: string;
}

/**
 * Licence import.
 *
 * The tenant comes from the JWT on every route. No route accepts a tenant
 * identifier, so a file cannot be imported into someone else's organisation.
 *
 * Stateless between steps: the parsed rows travel with each request rather
 * than being held server-side. That avoids a table whose only purpose is to
 * remember a half-finished wizard, and it means an abandoned import leaves
 * nothing behind.
 */
@Controller('compliance/import')
export class ImportController {
  constructor(private readonly imports: ImportService) {}

  /** The template a client fills in. */
  @Get('template')
  async template(
    @Query('format') format: string,
    @Res() res: Response,
  ): Promise<void> {
    const wanted: ImportFormat = format === 'csv' ? 'csv' : 'xlsx';

    if (wanted === 'csv') {
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader(
        'Content-Disposition',
        'attachment; filename="legixy-licence-import-template.csv"',
      );
      // A BOM so Excel opens UTF-8 correctly rather than mangling Arabic.
      // Written as an escape: a literal BOM here is invisible in review.
      res.send(`\ufeff${buildTemplateCsv()}`);
      return;
    }

    const buffer = await buildTemplateXlsx();
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader(
      'Content-Disposition',
      'attachment; filename="legixy-licence-import-template.xlsx"',
    );
    res.setHeader('Content-Length', buffer.length);
    res.send(buffer);
  }

  /** Upload a file and get back its headers plus a proposed mapping. */
  @Post('parse')
  @UseInterceptors(
    FileInterceptor('file', { limits: { fileSize: MAX_IMPORT_BYTES } }),
  )
  async parse(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('No file provided.');

    const name = (file.originalname || '').toLowerCase();
    const format: ImportFormat = name.endsWith('.csv') ? 'csv' : 'xlsx';

    try {
      return await this.imports.parse(file.buffer, format);
    } catch (error) {
      if (error instanceof ImportReadError) {
        throw new BadRequestException(error.message);
      }
      throw error;
    }
  }

  /** Everything that would happen, computed without writing anything. */
  @Post('preview')
  preview(@CurrentUser() user: AuthenticatedUser, @Body() body: PreviewBody) {
    return this.imports.preview(user.tenantId, body);
  }

  /** Writes the valid rows. All of them, or none. */
  @Post('commit')
  commit(@CurrentUser() user: AuthenticatedUser, @Body() body: CommitBody) {
    return this.imports.commit(user.tenantId, user.id, body);
  }
}

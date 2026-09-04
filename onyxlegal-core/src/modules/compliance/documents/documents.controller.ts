import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../../auth/jwt.strategy';
import { MAX_DOCUMENT_BYTES } from '../domain/file-safety';
import { DocumentsService } from './documents.service';
import { UploadDocumentDto } from './dto/document.dto';

/**
 * Licence documents.
 *
 * Tenant comes from the JWT on every route; no route accepts a tenant
 * identifier. A document belonging to another tenant returns 404, never the
 * file and never a 403 — a 403 would confirm the id exists.
 */
@Controller('licenses/:licenseId/documents')
export class DocumentsController {
  constructor(private readonly documents: DocumentsService) {}

  @Get()
  findAll(
    @CurrentUser() user: AuthenticatedUser,
    @Param('licenseId') licenseId: string,
  ) {
    return this.documents.findForLicense(user.tenantId, licenseId);
  }

  @Post()
  // A hard byte limit at the transport layer as well as in the service, so an
  // oversized body is rejected before it is buffered in full.
  @UseInterceptors(
    FileInterceptor('file', { limits: { fileSize: MAX_DOCUMENT_BYTES } }),
  )
  upload(
    @CurrentUser() user: AuthenticatedUser,
    @Param('licenseId') licenseId: string,
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: UploadDocumentDto,
  ) {
    if (!file) throw new BadRequestException('No file provided.');

    return this.documents.upload(user.tenantId, user.id, {
      licenseId,
      documentCode: dto.documentCode ?? null,
      issuedOn: dto.issuedOn ?? null,
      expiresOn: dto.expiresOn ?? null,
      originalFilename: file.originalname,
      data: file.buffer,
    });
  }

  @Get(':documentId/download')
  async download(
    @CurrentUser() user: AuthenticatedUser,
    @Param('documentId') documentId: string,
    @Res() res: Response,
  ): Promise<void> {
    const file = await this.documents.download(
      user.tenantId,
      user.id,
      documentId,
    );

    res.setHeader('Content-Type', file.mimeType);
    // Quote and strip the filename so it cannot break the header.
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${file.filename.replace(/"/g, '')}"`,
    );
    res.setHeader('Content-Length', file.data.length);
    // Compliance documents must never sit in a shared cache.
    res.setHeader('Cache-Control', 'private, no-store');
    res.send(file.data);
  }

  @Delete(':documentId')
  remove(
    @CurrentUser() user: AuthenticatedUser,
    @Param('documentId') documentId: string,
  ) {
    return this.documents.remove(user.tenantId, user.id, documentId);
  }
}

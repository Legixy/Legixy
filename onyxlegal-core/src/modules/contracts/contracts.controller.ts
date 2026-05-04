import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  HttpCode,
  Param,
  Body,
  Query,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ContractsService } from './contracts.service';
import {
  CreateContractDto,
  UpdateContractDto,
  UpdateStatusDto,
  ListContractsQueryDto,
  RenegotiateDto,
} from './dto/contract.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../auth/jwt.strategy';

const ALLOWED_MIMETYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

@Controller('contracts')
export class ContractsController {
  constructor(private readonly contractsService: ContractsService) {}

  @Post()
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateContractDto,
  ) {
    return this.contractsService.create(user.tenantId, user.id, dto);
  }

  /**
   * POST /contracts/upload
   * Upload a PDF or DOCX file — extracts text and creates a contract.
   */
  @Post('upload')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 10 * 1024 * 1024 } }))
  uploadFile(
    @CurrentUser() user: AuthenticatedUser,
    @UploadedFile() file: Express.Multer.File,
    @Body('title') title?: string,
  ) {
    if (!file) throw new BadRequestException('No file provided.');
    if (!ALLOWED_MIMETYPES.includes(file.mimetype)) {
      throw new BadRequestException(
        'Unsupported file type. Upload a PDF or DOCX.',
      );
    }
    return this.contractsService.createFromFile(user.tenantId, user.id, file, title);
  }

  @Get()
  findAll(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: ListContractsQueryDto,
  ) {
    return this.contractsService.findAll(user.tenantId, query);
  }

  @Get('stats')
  getStats(@CurrentUser() user: AuthenticatedUser) {
    return this.contractsService.getDashboardStats(user.tenantId);
  }

  @Get(':id')
  findOne(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    return this.contractsService.findOne(user.tenantId, id);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateContractDto,
  ) {
    return this.contractsService.update(user.tenantId, id, user.id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  remove(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    return this.contractsService.remove(user.tenantId, id);
  }

  @Patch(':id/status')
  updateStatus(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateStatusDto,
  ) {
    return this.contractsService.updateStatus(user.tenantId, id, dto);
  }

  @Post(':contractId/clauses/:clauseId/accept-fix')
  acceptFix(
    @CurrentUser() user: AuthenticatedUser,
    @Param('contractId') contractId: string,
    @Param('clauseId') clauseId: string,
  ) {
    return this.contractsService.acceptClauseFix(
      user.tenantId,
      contractId,
      clauseId,
    );
  }

  @Get(':id/versions')
  getVersions(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    return this.contractsService.getVersions(user.tenantId, id);
  }

  @Post(':id/restore-version')
  restoreVersion(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() body: { versionId?: string; versionNumber?: number },
  ) {
    return this.contractsService.restoreVersion(user.tenantId, user.id, id, body.versionId, body.versionNumber);
  }

  @Post(':id/renegotiate')
  renegotiateClause(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: RenegotiateDto,
  ) {
    return this.contractsService.renegotiateClause(
      user.tenantId,
      user.id,
      id,
      dto.clauseTitle,
      dto.notes,
    );
  }
}

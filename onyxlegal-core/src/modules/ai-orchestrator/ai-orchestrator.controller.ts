import { Controller, Post, Get, Param } from '@nestjs/common';
import { AiOrchestratorService } from './ai-orchestrator.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../auth/jwt.strategy';

@Controller('ai')
export class AiOrchestratorController {
  constructor(private readonly aiService: AiOrchestratorService) {}

  /**
   * POST /api/v1/ai/analyze/:contractId
   * Trigger AI analysis on a contract.
   */
  @Post('analyze/:contractId')
  triggerAnalysis(
    @CurrentUser() user: AuthenticatedUser,
    @Param('contractId') contractId: string,
  ) {
    return this.aiService.triggerAnalysis(user.tenantId, contractId);
  }

  /**
   * GET /api/v1/ai/analysis/:contractId
   * Get analysis results for a contract.
   */
  @Get('analysis/:contractId')
  getResults(
    @CurrentUser() user: AuthenticatedUser,
    @Param('contractId') contractId: string,
  ) {
    return this.aiService.getAnalysisResults(user.tenantId, contractId);
  }

  /**
   * GET /api/v1/ai/suggestions/:contractId
   * Get AI auto-fix suggestions.
   */
  @Get('suggestions/:contractId')
  getSuggestions(
    @CurrentUser() user: AuthenticatedUser,
    @Param('contractId') contractId: string,
  ) {
    return this.aiService.getSuggestions(user.tenantId, contractId);
  }
}

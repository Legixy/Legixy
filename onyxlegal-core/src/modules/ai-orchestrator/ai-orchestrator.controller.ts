import { Controller, Post, Get, Param, Body } from '@nestjs/common';
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
   * POST /api/v1/ai/analyze-direct
   * Direct synchronous analysis (no queue)
   */
  @Post('analyze-direct')
  async analyzeDirect(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: { contractText: string; contractId?: string },
  ) {
    return this.aiService.analyzeContractDirect(
      body.contractId || 'unknown',
      body.contractText,
    );
  }

  /**
   * POST /api/v1/ai/generate-fix
   * Generate improved clause
   */
  @Post('generate-fix')
  async generateFix(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: { clause: string; issue: string },
  ) {
    return this.aiService.generateClauseFixDirect(body.clause, body.issue);
  }

  /**
   * POST /api/v1/ai/check-compliance
   * Check contract compliance
   */
  @Post('check-compliance')
  async checkCompliance(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: { contractText: string; contractId?: string },
  ) {
    return this.aiService.checkComplianceDirect(
      body.contractText,
      body.contractId,
    );
  }

  /**
   * GET /api/v1/ai/tokens
   * Get token usage statistics
   */
  @Get('tokens')
  getTokenStats(@CurrentUser() user: AuthenticatedUser) {
    return this.aiService.getTokenStats();
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

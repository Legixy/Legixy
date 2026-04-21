import { RiskLevel } from '@prisma/client';
export interface SimpleRisk {
    level: RiskLevel;
    emoji: string;
    headline: string;
    explanation: string;
    businessImpact: string;
    recommendedAction: string;
    severity: 'ignore' | 'fix' | 'fixAsap' | 'dealbreaker';
}
export interface RiskSummary {
    totalRisks: number;
    critical: number;
    high: number;
    medium: number;
    low: number;
    safe: number;
    overallSeverity: 'clean' | 'minor' | 'significant' | 'severe' | 'critical';
    topThreats: SimpleRisk[];
    fixableSoonCount: number;
    needsLawyerReviewCount: number;
}
export declare class RiskFormatterService {
    private logger;
    formatRisk(riskLevel: RiskLevel, title: string, legalReason: string, suggestedFix: string, estimatedImpact?: number): SimpleRisk;
    summarizeRisks(risks: Array<{
        level: RiskLevel;
        title: string;
        reason: string;
        suggestion: string;
        impact?: number;
    }>): RiskSummary;
    private translateToSimple;
    private formatAction;
    private getEmoji;
    private mapToSeverity;
    private riskLevelToNumber;
    private calculateOverallSeverity;
    private extractDuration;
    private extractJurisdiction;
    private simplifyHeadline;
}

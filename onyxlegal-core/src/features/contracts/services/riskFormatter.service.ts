import { Injectable, Logger } from '@nestjs/common';
import { RiskLevel } from '@prisma/client';

/**
 * RISK FORMATTER SERVICE
 *
 * Converts legal/technical risk language into simple, actionable explanations
 * for founders and non-legal users.
 *
 * Philosophy:
 * - Legal jargon → Plain English
 * - Technical details → Business impact
 * - Passive voice → Active statements
 * - Focus on "what you lose" not "what is allowed"
 */

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

@Injectable()
export class RiskFormatterService {
  private logger = new Logger(RiskFormatterService.name);

  /**
   * Convert a technical risk title and reason into simple language
   *
   * Example:
   * Input: "Uncapped Liability Exposure"
   * Output: {
   *   headline: "You could lose unlimited money",
   *   explanation: "If something goes wrong, you're responsible for all damages...",
   *   businessImpact: "Worst case: Your company's entire value is at risk",
   *   recommendedAction: "Add a liability cap ($X) to this clause"
   * }
   */
  formatRisk(
    riskLevel: RiskLevel,
    title: string,
    legalReason: string,
    suggestedFix: string,
    estimatedImpact?: number,
  ): SimpleRisk {
    const formatted = this.translateToSimple(title, legalReason, estimatedImpact);

    return {
      level: riskLevel,
      emoji: this.getEmoji(riskLevel),
      headline: formatted.headline,
      explanation: formatted.explanation,
      businessImpact: formatted.businessImpact,
      recommendedAction: this.formatAction(suggestedFix, riskLevel),
      severity: this.mapToSeverity(riskLevel),
    };
  }

  /**
   * Create a summary of all risks in a contract
   * Used for dashboard overview
   */
  summarizeRisks(
    risks: Array<{
      level: RiskLevel;
      title: string;
      reason: string;
      suggestion: string;
      impact?: number;
    }>,
  ): RiskSummary {
    const counts = {
      SAFE: 0,
      LOW: 0,
      MEDIUM: 0,
      HIGH: 0,
      CRITICAL: 0,
    };

    // Count by severity
    risks.forEach((risk) => {
      counts[risk.level]++;
    });

    // Calculate overall severity
    const overallSeverity = this.calculateOverallSeverity(counts);

    // Get top 3 threats (highest priority)
    const topThreats = risks
      .sort((a, b) => this.riskLevelToNumber(b.level) - this.riskLevelToNumber(a.level))
      .slice(0, 3)
      .map((risk) =>
        this.formatRisk(risk.level, risk.title, risk.reason, risk.suggestion, risk.impact),
      );

    const fixableSoonCount = risks.filter((r) => r.level === 'MEDIUM' || r.level === 'HIGH').length;
    const needsLawyerReviewCount = risks.filter((r) => r.level === 'CRITICAL').length;

    return {
      totalRisks: risks.length,
      critical: counts.CRITICAL,
      high: counts.HIGH,
      medium: counts.MEDIUM,
      low: counts.LOW,
      safe: counts.SAFE,
      overallSeverity,
      topThreats,
      fixableSoonCount,
      needsLawyerReviewCount,
    };
  }

  /**
   * Translate legal/technical language to simple terms
   * Maps common contract risks to plain English explanations
   */
  private translateToSimple(
    title: string,
    legalReason: string,
    estimatedImpact?: number,
  ): {
    headline: string;
    explanation: string;
    businessImpact: string;
  } {
    const lowerTitle = title.toLowerCase();
    const lowerReason = legalReason.toLowerCase();

    // LIABILITY CLAUSES
    if (lowerTitle.includes('uncapped') || lowerTitle.includes('unlimited liability')) {
      return {
        headline: 'You could lose unlimited money',
        explanation:
          'This clause does not cap how much money you owe if something goes wrong. The other party could sue for any amount.',
        businessImpact: `Worst case: You lose ₹${estimatedImpact ? estimatedImpact.toLocaleString() : 'unlimited'} (potentially your entire company).`,
      };
    }

    if (lowerTitle.includes('indemnification') || lowerTitle.includes('indemnify')) {
      return {
        headline: 'You agree to cover their legal costs',
        explanation:
          'You must pay for their legal defense and damages if something goes wrong, even if it was partially their fault.',
        businessImpact: `You're paying twice: once for your own lawyer, and again for theirs. Could cost ₹${estimatedImpact ? estimatedImpact.toLocaleString() : '500K+'}.`,
      };
    }

    // PAYMENT/FINANCIAL CLAUSES
    if (lowerTitle.includes('auto-renewal') || lowerTitle.includes('auto renewal')) {
      return {
        headline: 'Contract automatically renews and keeps charging you',
        explanation:
          'Unless you remember to cancel before the renewal date, the contract automatically extends and charges you again.',
        businessImpact: `Easy to forget. You could get charged ₹${estimatedImpact ? estimatedImpact.toLocaleString() : '50K+'} you didn't expect.`,
      };
    }

    if (lowerTitle.includes('termination') && lowerTitle.includes('penalty')) {
      return {
        headline: 'Expensive to end this contract',
        explanation:
          'If you want to exit early, you must pay a significant penalty. This locks you in for the full term.',
        businessImpact: `To leave: Pay ₹${estimatedImpact ? estimatedImpact.toLocaleString() : '100K+'}. You're stuck.`,
      };
    }

    // IP/OWNERSHIP CLAUSES
    if (lowerTitle.includes('intellectual property') || lowerTitle.includes('ip ownership')) {
      return {
        headline: 'You lose ownership of your own work',
        explanation:
          'Any work you create (code, design, documentation) automatically belongs to the other party, not you.',
        businessImpact: `Your IP is gone. If the deal ends, you cannot reuse your own work.`,
      };
    }

    if (lowerTitle.includes('non-compete')) {
      return {
        headline: 'You cannot work with competitors for years',
        explanation:
          'After this contract ends, you agree not to work with similar companies for a specific period.',
        businessImpact: `Limits your future business opportunities for ${this.extractDuration(legalReason) || '2-3 years'}.`,
      };
    }

    // DATA/PRIVACY CLAUSES
    if (lowerTitle.includes('data') || lowerTitle.includes('privacy')) {
      return {
        headline: 'Your customer data could be used against you',
        explanation:
          'The other party can use customer/business data you share with them in ways that may not be in your interest.',
        businessImpact: 'Data could be sold, shared, or used to compete against you.',
      };
    }

    // CONFIDENTIALITY CLAUSES
    if (lowerTitle.includes('confidentiality') || lowerTitle.includes('nda')) {
      return {
        headline: 'Strict restrictions on what you can share',
        explanation:
          'You cannot tell anyone (even your lawyer or accountant) about this deal without risking legal consequences.',
        businessImpact: 'Makes hiring, fundraising, or getting advice difficult.',
      };
    }

    // GOVERNING LAW CLAUSES
    if (lowerTitle.includes('governing law') || lowerTitle.includes('jurisdiction')) {
      return {
        headline: 'Disputes handled in their country, not yours',
        explanation:
          "If there's a dispute, you must fight in their country's courts, using their laws. You cannot sue in India.",
        businessImpact: `Expensive to defend. Flying lawyers to ${this.extractJurisdiction(legalReason) || 'a foreign country'} costs ₹10L+.`,
      };
    }

    // WARRANTY CLAUSES
    if (lowerTitle.includes('warranty') || lowerTitle.includes('guarantee')) {
      return {
        headline: 'You guarantee something you cannot control',
        explanation:
          'You promise that something will always work perfectly. If it breaks for any reason, you must fix it or pay damages.',
        businessImpact: `Open-ended liability. You could be sued years later.`,
      };
    }

    // DISPUTE RESOLUTION
    if (lowerTitle.includes('dispute') && lowerTitle.includes('arbitration')) {
      return {
        headline: 'Disputes go to secret arbitration, not court',
        explanation:
          'Instead of suing in court, disputes go to a private arbitrator. You cannot appeal their decision.',
        businessImpact: `Fast but final. No appeal = you lose once and you're done (good or bad).`,
      };
    }

    // DEFAULT/CATCH-ALL
    return {
      headline: this.simplifyHeadline(title),
      explanation: legalReason || 'This contract clause poses a risk to your business.',
      businessImpact: estimatedImpact
        ? `Financial risk: ₹${estimatedImpact.toLocaleString()}`
        : 'Assess impact based on context.',
    };
  }

  /**
   * Convert suggested fix (usually technical/legal) to actionable step
   */
  private formatAction(suggestedFix: string, riskLevel: RiskLevel): string {
    if (!suggestedFix) {
      return 'Review and discuss with legal counsel.';
    }

    // If AI provides a specific change, make it actionable
    const action = suggestedFix.replace(/^(add|remove|change|modify|replace)/i, (match) => {
      return match.charAt(0).toUpperCase() + match.slice(1).toLowerCase();
    });

    if (riskLevel === 'CRITICAL') {
      return `⚠️ URGENT: ${action}`;
    }

    if (riskLevel === 'HIGH') {
      return `🔴 Fix ASAP: ${action}`;
    }

    if (riskLevel === 'MEDIUM') {
      return `🟡 Consider: ${action}`;
    }

    return `✅ Optional: ${action}`;
  }

  /**
   * Get emoji indicator for risk level
   */
  private getEmoji(level: RiskLevel): string {
    const emojiMap: Record<RiskLevel, string> = {
      SAFE: '✅',
      LOW: '🟢',
      MEDIUM: '🟡',
      HIGH: '🔴',
      CRITICAL: '🚨',
    };
    return emojiMap[level] || '❓';
  }

  /**
   * Map risk level to user-friendly severity label
   */
  private mapToSeverity(level: RiskLevel): 'ignore' | 'fix' | 'fixAsap' | 'dealbreaker' {
    switch (level) {
      case 'SAFE':
        return 'ignore';
      case 'LOW':
        return 'ignore';
      case 'MEDIUM':
        return 'fix';
      case 'HIGH':
        return 'fixAsap';
      case 'CRITICAL':
        return 'dealbreaker';
      default:
        return 'ignore';
    }
  }

  /**
   * Convert risk level to numeric for sorting
   */
  private riskLevelToNumber(level: RiskLevel): number {
    const map: Record<RiskLevel, number> = {
      SAFE: 0,
      LOW: 1,
      MEDIUM: 2,
      HIGH: 3,
      CRITICAL: 4,
    };
    return map[level] || 0;
  }

  /**
   * Calculate overall contract risk severity
   */
  private calculateOverallSeverity(counts: Record<RiskLevel, number>): 'clean' | 'minor' | 'significant' | 'severe' | 'critical' {
    if (counts.CRITICAL > 0) return 'critical';
    if (counts.HIGH >= 2) return 'severe';
    if (counts.HIGH > 0) return 'significant';
    if (counts.MEDIUM >= 2) return 'significant';
    if (counts.MEDIUM > 0) return 'minor';
    return 'clean';
  }

  /**
   * Extract duration from legal text (e.g., "3 years" from clause)
   */
  private extractDuration(text: string): string | null {
    const match = text.match(/(\d+)\s*(year|month|week)s?/i);
    return match ? `${match[1]} ${match[2]}s` : null;
  }

  /**
   * Extract jurisdiction from legal text
   */
  private extractJurisdiction(text: string): string | null {
    const jurisdictions = ['US', 'UK', 'California', 'Delaware', 'Singapore', 'UAE'];
    for (const juris of jurisdictions) {
      if (text.includes(juris)) {
        return juris;
      }
    }
    return null;
  }

  /**
   * Simplify legal title to plain English
   */
  private simplifyHeadline(title: string): string {
    return title
      .replace(/Clause/i, '')
      .replace(/Section/i, '')
      .replace(/Provision/i, '')
      .trim()
      .split(' ')
      .map((word, index) => (index === 0 ? word.charAt(0).toUpperCase() + word.slice(1) : word))
      .join(' ');
  }
}

"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var RiskFormatterService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.RiskFormatterService = void 0;
const common_1 = require("@nestjs/common");
let RiskFormatterService = RiskFormatterService_1 = class RiskFormatterService {
    logger = new common_1.Logger(RiskFormatterService_1.name);
    formatRisk(riskLevel, title, legalReason, suggestedFix, estimatedImpact) {
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
    summarizeRisks(risks) {
        const counts = {
            SAFE: 0,
            LOW: 0,
            MEDIUM: 0,
            HIGH: 0,
            CRITICAL: 0,
        };
        risks.forEach((risk) => {
            counts[risk.level]++;
        });
        const overallSeverity = this.calculateOverallSeverity(counts);
        const topThreats = risks
            .sort((a, b) => this.riskLevelToNumber(b.level) - this.riskLevelToNumber(a.level))
            .slice(0, 3)
            .map((risk) => this.formatRisk(risk.level, risk.title, risk.reason, risk.suggestion, risk.impact));
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
    translateToSimple(title, legalReason, estimatedImpact) {
        const lowerTitle = title.toLowerCase();
        const lowerReason = legalReason.toLowerCase();
        if (lowerTitle.includes('uncapped') || lowerTitle.includes('unlimited liability')) {
            return {
                headline: 'You could lose unlimited money',
                explanation: 'This clause does not cap how much money you owe if something goes wrong. The other party could sue for any amount.',
                businessImpact: `Worst case: You lose ₹${estimatedImpact ? estimatedImpact.toLocaleString() : 'unlimited'} (potentially your entire company).`,
            };
        }
        if (lowerTitle.includes('indemnification') || lowerTitle.includes('indemnify')) {
            return {
                headline: 'You agree to cover their legal costs',
                explanation: 'You must pay for their legal defense and damages if something goes wrong, even if it was partially their fault.',
                businessImpact: `You're paying twice: once for your own lawyer, and again for theirs. Could cost ₹${estimatedImpact ? estimatedImpact.toLocaleString() : '500K+'}.`,
            };
        }
        if (lowerTitle.includes('auto-renewal') || lowerTitle.includes('auto renewal')) {
            return {
                headline: 'Contract automatically renews and keeps charging you',
                explanation: 'Unless you remember to cancel before the renewal date, the contract automatically extends and charges you again.',
                businessImpact: `Easy to forget. You could get charged ₹${estimatedImpact ? estimatedImpact.toLocaleString() : '50K+'} you didn't expect.`,
            };
        }
        if (lowerTitle.includes('termination') && lowerTitle.includes('penalty')) {
            return {
                headline: 'Expensive to end this contract',
                explanation: 'If you want to exit early, you must pay a significant penalty. This locks you in for the full term.',
                businessImpact: `To leave: Pay ₹${estimatedImpact ? estimatedImpact.toLocaleString() : '100K+'}. You're stuck.`,
            };
        }
        if (lowerTitle.includes('intellectual property') || lowerTitle.includes('ip ownership')) {
            return {
                headline: 'You lose ownership of your own work',
                explanation: 'Any work you create (code, design, documentation) automatically belongs to the other party, not you.',
                businessImpact: `Your IP is gone. If the deal ends, you cannot reuse your own work.`,
            };
        }
        if (lowerTitle.includes('non-compete')) {
            return {
                headline: 'You cannot work with competitors for years',
                explanation: 'After this contract ends, you agree not to work with similar companies for a specific period.',
                businessImpact: `Limits your future business opportunities for ${this.extractDuration(legalReason) || '2-3 years'}.`,
            };
        }
        if (lowerTitle.includes('data') || lowerTitle.includes('privacy')) {
            return {
                headline: 'Your customer data could be used against you',
                explanation: 'The other party can use customer/business data you share with them in ways that may not be in your interest.',
                businessImpact: 'Data could be sold, shared, or used to compete against you.',
            };
        }
        if (lowerTitle.includes('confidentiality') || lowerTitle.includes('nda')) {
            return {
                headline: 'Strict restrictions on what you can share',
                explanation: 'You cannot tell anyone (even your lawyer or accountant) about this deal without risking legal consequences.',
                businessImpact: 'Makes hiring, fundraising, or getting advice difficult.',
            };
        }
        if (lowerTitle.includes('governing law') || lowerTitle.includes('jurisdiction')) {
            return {
                headline: 'Disputes handled in their country, not yours',
                explanation: "If there's a dispute, you must fight in their country's courts, using their laws. You cannot sue in India.",
                businessImpact: `Expensive to defend. Flying lawyers to ${this.extractJurisdiction(legalReason) || 'a foreign country'} costs ₹10L+.`,
            };
        }
        if (lowerTitle.includes('warranty') || lowerTitle.includes('guarantee')) {
            return {
                headline: 'You guarantee something you cannot control',
                explanation: 'You promise that something will always work perfectly. If it breaks for any reason, you must fix it or pay damages.',
                businessImpact: `Open-ended liability. You could be sued years later.`,
            };
        }
        if (lowerTitle.includes('dispute') && lowerTitle.includes('arbitration')) {
            return {
                headline: 'Disputes go to secret arbitration, not court',
                explanation: 'Instead of suing in court, disputes go to a private arbitrator. You cannot appeal their decision.',
                businessImpact: `Fast but final. No appeal = you lose once and you're done (good or bad).`,
            };
        }
        return {
            headline: this.simplifyHeadline(title),
            explanation: legalReason || 'This contract clause poses a risk to your business.',
            businessImpact: estimatedImpact
                ? `Financial risk: ₹${estimatedImpact.toLocaleString()}`
                : 'Assess impact based on context.',
        };
    }
    formatAction(suggestedFix, riskLevel) {
        if (!suggestedFix) {
            return 'Review and discuss with legal counsel.';
        }
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
    getEmoji(level) {
        const emojiMap = {
            SAFE: '✅',
            LOW: '🟢',
            MEDIUM: '🟡',
            HIGH: '🔴',
            CRITICAL: '🚨',
        };
        return emojiMap[level] || '❓';
    }
    mapToSeverity(level) {
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
    riskLevelToNumber(level) {
        const map = {
            SAFE: 0,
            LOW: 1,
            MEDIUM: 2,
            HIGH: 3,
            CRITICAL: 4,
        };
        return map[level] || 0;
    }
    calculateOverallSeverity(counts) {
        if (counts.CRITICAL > 0)
            return 'critical';
        if (counts.HIGH >= 2)
            return 'severe';
        if (counts.HIGH > 0)
            return 'significant';
        if (counts.MEDIUM >= 2)
            return 'significant';
        if (counts.MEDIUM > 0)
            return 'minor';
        return 'clean';
    }
    extractDuration(text) {
        const match = text.match(/(\d+)\s*(year|month|week)s?/i);
        return match ? `${match[1]} ${match[2]}s` : null;
    }
    extractJurisdiction(text) {
        const jurisdictions = ['US', 'UK', 'California', 'Delaware', 'Singapore', 'UAE'];
        for (const juris of jurisdictions) {
            if (text.includes(juris)) {
                return juris;
            }
        }
        return null;
    }
    simplifyHeadline(title) {
        return title
            .replace(/Clause/i, '')
            .replace(/Section/i, '')
            .replace(/Provision/i, '')
            .trim()
            .split(' ')
            .map((word, index) => (index === 0 ? word.charAt(0).toUpperCase() + word.slice(1) : word))
            .join(' ');
    }
};
exports.RiskFormatterService = RiskFormatterService;
exports.RiskFormatterService = RiskFormatterService = RiskFormatterService_1 = __decorate([
    (0, common_1.Injectable)()
], RiskFormatterService);
//# sourceMappingURL=riskFormatter.service.js.map
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TemplateCategory = exports.NotificationType = exports.AnalysisType = exports.AnalysisStatus = exports.ClauseType = exports.RiskLevel = exports.ContractStatus = exports.Plan = exports.UserRole = void 0;
exports.UserRole = {
    OWNER: 'OWNER',
    ADMIN: 'ADMIN',
    MEMBER: 'MEMBER',
    VIEWER: 'VIEWER'
};
exports.Plan = {
    FREE: 'FREE',
    STARTER: 'STARTER',
    GROWTH: 'GROWTH',
    BUSINESS: 'BUSINESS'
};
exports.ContractStatus = {
    DRAFT: 'DRAFT',
    IN_REVIEW: 'IN_REVIEW',
    SENT: 'SENT',
    SIGNED: 'SIGNED',
    ACTIVE: 'ACTIVE',
    EXPIRED: 'EXPIRED',
    TERMINATED: 'TERMINATED'
};
exports.RiskLevel = {
    SAFE: 'SAFE',
    LOW: 'LOW',
    MEDIUM: 'MEDIUM',
    HIGH: 'HIGH',
    CRITICAL: 'CRITICAL'
};
exports.ClauseType = {
    PAYMENT_TERMS: 'PAYMENT_TERMS',
    LIABILITY: 'LIABILITY',
    INDEMNIFICATION: 'INDEMNIFICATION',
    IP_OWNERSHIP: 'IP_OWNERSHIP',
    CONFIDENTIALITY: 'CONFIDENTIALITY',
    TERMINATION: 'TERMINATION',
    NON_COMPETE: 'NON_COMPETE',
    NON_SOLICITATION: 'NON_SOLICITATION',
    GOVERNING_LAW: 'GOVERNING_LAW',
    DISPUTE_RESOLUTION: 'DISPUTE_RESOLUTION',
    DATA_PROTECTION: 'DATA_PROTECTION',
    FORCE_MAJEURE: 'FORCE_MAJEURE',
    AUTO_RENEWAL: 'AUTO_RENEWAL',
    WARRANTY: 'WARRANTY',
    OTHER: 'OTHER'
};
exports.AnalysisStatus = {
    QUEUED: 'QUEUED',
    PROCESSING: 'PROCESSING',
    COMPLETED: 'COMPLETED',
    FAILED: 'FAILED'
};
exports.AnalysisType = {
    QUICK_SCAN: 'QUICK_SCAN',
    RISK_DETECTION: 'RISK_DETECTION',
    DEEP_ANALYSIS: 'DEEP_ANALYSIS',
    FIX_GENERATION: 'FIX_GENERATION'
};
exports.NotificationType = {
    RISK_ALERT: 'RISK_ALERT',
    SIGNATURE_PENDING: 'SIGNATURE_PENDING',
    CONTRACT_EXPIRING: 'CONTRACT_EXPIRING',
    AI_FIX_READY: 'AI_FIX_READY',
    ANALYSIS_COMPLETE: 'ANALYSIS_COMPLETE',
    SYSTEM: 'SYSTEM'
};
exports.TemplateCategory = {
    NDA: 'NDA',
    VENDOR_AGREEMENT: 'VENDOR_AGREEMENT',
    EMPLOYMENT_OFFER: 'EMPLOYMENT_OFFER',
    SERVICE_AGREEMENT: 'SERVICE_AGREEMENT',
    CONSULTING: 'CONSULTING',
    FREELANCER: 'FREELANCER',
    PARTNERSHIP: 'PARTNERSHIP',
    CUSTOM: 'CUSTOM'
};
//# sourceMappingURL=enums.js.map
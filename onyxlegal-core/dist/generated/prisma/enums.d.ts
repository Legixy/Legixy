export declare const UserRole: {
    readonly OWNER: "OWNER";
    readonly ADMIN: "ADMIN";
    readonly MEMBER: "MEMBER";
    readonly VIEWER: "VIEWER";
};
export type UserRole = (typeof UserRole)[keyof typeof UserRole];
export declare const Plan: {
    readonly FREE: "FREE";
    readonly STARTER: "STARTER";
    readonly GROWTH: "GROWTH";
    readonly BUSINESS: "BUSINESS";
};
export type Plan = (typeof Plan)[keyof typeof Plan];
export declare const ContractStatus: {
    readonly DRAFT: "DRAFT";
    readonly IN_REVIEW: "IN_REVIEW";
    readonly SENT: "SENT";
    readonly SIGNED: "SIGNED";
    readonly ACTIVE: "ACTIVE";
    readonly EXPIRED: "EXPIRED";
    readonly TERMINATED: "TERMINATED";
};
export type ContractStatus = (typeof ContractStatus)[keyof typeof ContractStatus];
export declare const RiskLevel: {
    readonly SAFE: "SAFE";
    readonly LOW: "LOW";
    readonly MEDIUM: "MEDIUM";
    readonly HIGH: "HIGH";
    readonly CRITICAL: "CRITICAL";
};
export type RiskLevel = (typeof RiskLevel)[keyof typeof RiskLevel];
export declare const ClauseType: {
    readonly PAYMENT_TERMS: "PAYMENT_TERMS";
    readonly LIABILITY: "LIABILITY";
    readonly INDEMNIFICATION: "INDEMNIFICATION";
    readonly IP_OWNERSHIP: "IP_OWNERSHIP";
    readonly CONFIDENTIALITY: "CONFIDENTIALITY";
    readonly TERMINATION: "TERMINATION";
    readonly NON_COMPETE: "NON_COMPETE";
    readonly NON_SOLICITATION: "NON_SOLICITATION";
    readonly GOVERNING_LAW: "GOVERNING_LAW";
    readonly DISPUTE_RESOLUTION: "DISPUTE_RESOLUTION";
    readonly DATA_PROTECTION: "DATA_PROTECTION";
    readonly FORCE_MAJEURE: "FORCE_MAJEURE";
    readonly AUTO_RENEWAL: "AUTO_RENEWAL";
    readonly WARRANTY: "WARRANTY";
    readonly OTHER: "OTHER";
};
export type ClauseType = (typeof ClauseType)[keyof typeof ClauseType];
export declare const AnalysisStatus: {
    readonly QUEUED: "QUEUED";
    readonly PROCESSING: "PROCESSING";
    readonly COMPLETED: "COMPLETED";
    readonly FAILED: "FAILED";
};
export type AnalysisStatus = (typeof AnalysisStatus)[keyof typeof AnalysisStatus];
export declare const AnalysisType: {
    readonly QUICK_SCAN: "QUICK_SCAN";
    readonly RISK_DETECTION: "RISK_DETECTION";
    readonly DEEP_ANALYSIS: "DEEP_ANALYSIS";
    readonly FIX_GENERATION: "FIX_GENERATION";
};
export type AnalysisType = (typeof AnalysisType)[keyof typeof AnalysisType];
export declare const NotificationType: {
    readonly RISK_ALERT: "RISK_ALERT";
    readonly SIGNATURE_PENDING: "SIGNATURE_PENDING";
    readonly CONTRACT_EXPIRING: "CONTRACT_EXPIRING";
    readonly AI_FIX_READY: "AI_FIX_READY";
    readonly ANALYSIS_COMPLETE: "ANALYSIS_COMPLETE";
    readonly SYSTEM: "SYSTEM";
};
export type NotificationType = (typeof NotificationType)[keyof typeof NotificationType];
export declare const TemplateCategory: {
    readonly NDA: "NDA";
    readonly VENDOR_AGREEMENT: "VENDOR_AGREEMENT";
    readonly EMPLOYMENT_OFFER: "EMPLOYMENT_OFFER";
    readonly SERVICE_AGREEMENT: "SERVICE_AGREEMENT";
    readonly CONSULTING: "CONSULTING";
    readonly FREELANCER: "FREELANCER";
    readonly PARTNERSHIP: "PARTNERSHIP";
    readonly CUSTOM: "CUSTOM";
};
export type TemplateCategory = (typeof TemplateCategory)[keyof typeof TemplateCategory];

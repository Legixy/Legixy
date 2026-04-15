"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FALLBACK_VALUES = exports.ComplianceCheckSchema = exports.ComplianceIssueSchema = exports.ClauseFixSchema = exports.ContractAnalysisSchema = exports.RiskItemSchema = void 0;
exports.validateContractAnalysis = validateContractAnalysis;
exports.validateClauseFix = validateClauseFix;
exports.validateComplianceCheck = validateComplianceCheck;
const zod_1 = require("zod");
exports.RiskItemSchema = zod_1.z.object({
    clause: zod_1.z.string().min(1, 'Clause is required'),
    issue: zod_1.z.string().min(1, 'Issue is required'),
    severity: zod_1.z.enum(['low', 'medium', 'high', 'critical']),
    recommendation: zod_1.z.string().min(1, 'Recommendation is required'),
    confidence: zod_1.z
        .number()
        .min(0)
        .max(100)
        .transform((n) => Math.round(n)),
});
exports.ContractAnalysisSchema = zod_1.z.object({
    risks: zod_1.z
        .array(exports.RiskItemSchema)
        .default([])
        .refine((risks) => risks.length <= 50, {
        message: 'Maximum 50 risks allowed per analysis',
    }),
    overallScore: zod_1.z
        .number()
        .min(0)
        .max(100)
        .transform((n) => Math.round(n)),
    summary: zod_1.z.string().min(0).max(500).optional(),
});
exports.ClauseFixSchema = zod_1.z.object({
    original: zod_1.z.string().min(1, 'Original clause is required'),
    improved: zod_1.z.string().min(1, 'Improved clause is required'),
    explanation: zod_1.z.string().min(1, 'Explanation is required'),
    confidence: zod_1.z
        .number()
        .min(0)
        .max(100)
        .transform((n) => Math.round(n)),
});
exports.ComplianceIssueSchema = zod_1.z.object({
    category: zod_1.z.enum([
        'GST',
        'Labor',
        'DataProtection',
        'Unfair',
        'Tax',
        'Other',
    ]),
    severity: zod_1.z.enum(['low', 'medium', 'high', 'critical']),
    issue: zod_1.z.string().min(1),
    solution: zod_1.z.string().min(1),
});
exports.ComplianceCheckSchema = zod_1.z.object({
    compliant: zod_1.z.boolean(),
    issues: zod_1.z.array(exports.ComplianceIssueSchema).default([]),
    overallRisk: zod_1.z.enum(['low', 'medium', 'high', 'critical']),
});
exports.FALLBACK_VALUES = {
    contractAnalysis: () => ({
        risks: [],
        overallScore: 50,
        summary: 'Unable to analyze contract. Please review manually.',
    }),
    clauseFix: () => ({
        original: '',
        improved: '',
        explanation: 'Unable to generate improvement. Please consult a lawyer.',
        confidence: 0,
    }),
    complianceCheck: () => ({
        compliant: false,
        issues: [],
        overallRisk: 'medium',
    }),
};
function validateContractAnalysis(jsonString) {
    try {
        let cleanJson = jsonString.trim();
        if (cleanJson.startsWith('```')) {
            cleanJson = cleanJson
                .replace(/^```(?:json)?\n?/, '')
                .replace(/\n?```$/, '');
        }
        cleanJson = cleanJson.trim();
        const parsed = JSON.parse(cleanJson);
        return exports.ContractAnalysisSchema.parse(parsed);
    }
    catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        throw new Error(`Invalid contract analysis JSON: ${errorMsg}`);
    }
}
function validateClauseFix(jsonString) {
    try {
        let cleanJson = jsonString.trim();
        if (cleanJson.startsWith('```')) {
            cleanJson = cleanJson
                .replace(/^```(?:json)?\n?/, '')
                .replace(/\n?```$/, '');
        }
        cleanJson = cleanJson.trim();
        const parsed = JSON.parse(cleanJson);
        return exports.ClauseFixSchema.parse(parsed);
    }
    catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        throw new Error(`Invalid clause fix JSON: ${errorMsg}`);
    }
}
function validateComplianceCheck(jsonString) {
    try {
        let cleanJson = jsonString.trim();
        if (cleanJson.startsWith('```')) {
            cleanJson = cleanJson
                .replace(/^```(?:json)?\n?/, '')
                .replace(/\n?```$/, '');
        }
        cleanJson = cleanJson.trim();
        const parsed = JSON.parse(cleanJson);
        return exports.ComplianceCheckSchema.parse(parsed);
    }
    catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        throw new Error(`Invalid compliance check JSON: ${errorMsg}`);
    }
}
//# sourceMappingURL=outputSchemas.js.map
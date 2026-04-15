import { z } from 'zod';
export declare const RiskItemSchema: z.ZodObject<{
    clause: z.ZodString;
    issue: z.ZodString;
    severity: z.ZodEnum<{
        low: "low";
        medium: "medium";
        high: "high";
        critical: "critical";
    }>;
    recommendation: z.ZodString;
    confidence: z.ZodPipe<z.ZodNumber, z.ZodTransform<number, number>>;
}, z.core.$strip>;
export type RiskItem = z.infer<typeof RiskItemSchema>;
export declare const ContractAnalysisSchema: z.ZodObject<{
    risks: z.ZodDefault<z.ZodArray<z.ZodObject<{
        clause: z.ZodString;
        issue: z.ZodString;
        severity: z.ZodEnum<{
            low: "low";
            medium: "medium";
            high: "high";
            critical: "critical";
        }>;
        recommendation: z.ZodString;
        confidence: z.ZodPipe<z.ZodNumber, z.ZodTransform<number, number>>;
    }, z.core.$strip>>>;
    overallScore: z.ZodPipe<z.ZodNumber, z.ZodTransform<number, number>>;
    summary: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export type ContractAnalysis = z.infer<typeof ContractAnalysisSchema>;
export declare const ClauseFixSchema: z.ZodObject<{
    original: z.ZodString;
    improved: z.ZodString;
    explanation: z.ZodString;
    confidence: z.ZodPipe<z.ZodNumber, z.ZodTransform<number, number>>;
}, z.core.$strip>;
export type ClauseFix = z.infer<typeof ClauseFixSchema>;
export declare const ComplianceIssueSchema: z.ZodObject<{
    category: z.ZodEnum<{
        GST: "GST";
        Labor: "Labor";
        DataProtection: "DataProtection";
        Unfair: "Unfair";
        Tax: "Tax";
        Other: "Other";
    }>;
    severity: z.ZodEnum<{
        low: "low";
        medium: "medium";
        high: "high";
        critical: "critical";
    }>;
    issue: z.ZodString;
    solution: z.ZodString;
}, z.core.$strip>;
export declare const ComplianceCheckSchema: z.ZodObject<{
    compliant: z.ZodBoolean;
    issues: z.ZodDefault<z.ZodArray<z.ZodObject<{
        category: z.ZodEnum<{
            GST: "GST";
            Labor: "Labor";
            DataProtection: "DataProtection";
            Unfair: "Unfair";
            Tax: "Tax";
            Other: "Other";
        }>;
        severity: z.ZodEnum<{
            low: "low";
            medium: "medium";
            high: "high";
            critical: "critical";
        }>;
        issue: z.ZodString;
        solution: z.ZodString;
    }, z.core.$strip>>>;
    overallRisk: z.ZodEnum<{
        low: "low";
        medium: "medium";
        high: "high";
        critical: "critical";
    }>;
}, z.core.$strip>;
export type ComplianceCheck = z.infer<typeof ComplianceCheckSchema>;
export declare const FALLBACK_VALUES: {
    contractAnalysis: () => ContractAnalysis;
    clauseFix: () => ClauseFix;
    complianceCheck: () => ComplianceCheck;
};
export declare function validateContractAnalysis(jsonString: string): ContractAnalysis;
export declare function validateClauseFix(jsonString: string): ClauseFix;
export declare function validateComplianceCheck(jsonString: string): ComplianceCheck;

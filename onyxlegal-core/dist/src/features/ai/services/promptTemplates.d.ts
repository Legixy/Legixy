export declare const SYSTEM_PROMPTS: {
    contractAnalysis: string;
    clauseFix: string;
    complianceCheck: string;
};
export declare const USER_PROMPTS: {
    contractAnalysis: (contractText: string) => string;
    clauseFix: (clause: string, issue: string) => string;
    complianceCheck: (contractText: string) => string;
    summarizeRisks: (risksJson: string) => string;
};
export declare const LLM_SETTINGS: {
    structural: {
        temperature: number;
        maxTokens: number;
        model: "gpt-4o-mini";
    };
    complex: {
        temperature: number;
        maxTokens: number;
        model: "gpt-4o";
    };
    analysis: {
        temperature: number;
        maxTokens: number;
        model: "gpt-4o-mini";
    };
};
export declare const CHUNK_SETTINGS: {
    maxTokensPerChunk: number;
    overlapTokens: number;
    maxChunks: number;
};

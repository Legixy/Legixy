"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.defineExtension = exports.JsonNullValueFilter = exports.NullsOrder = exports.QueryMode = exports.JsonNullValueInput = exports.SortOrder = exports.NotificationScalarFieldEnum = exports.RiskFindingScalarFieldEnum = exports.AIAnalysisScalarFieldEnum = exports.ClauseScalarFieldEnum = exports.ContractVersionScalarFieldEnum = exports.ContractScalarFieldEnum = exports.TemplateScalarFieldEnum = exports.UserScalarFieldEnum = exports.TenantScalarFieldEnum = exports.TransactionIsolationLevel = exports.ModelName = exports.AnyNull = exports.JsonNull = exports.DbNull = exports.NullTypes = exports.prismaVersion = exports.getExtensionContext = exports.Decimal = exports.Sql = exports.raw = exports.join = exports.empty = exports.sql = exports.PrismaClientValidationError = exports.PrismaClientInitializationError = exports.PrismaClientRustPanicError = exports.PrismaClientUnknownRequestError = exports.PrismaClientKnownRequestError = void 0;
const runtime = require("@prisma/client/runtime/client");
exports.PrismaClientKnownRequestError = runtime.PrismaClientKnownRequestError;
exports.PrismaClientUnknownRequestError = runtime.PrismaClientUnknownRequestError;
exports.PrismaClientRustPanicError = runtime.PrismaClientRustPanicError;
exports.PrismaClientInitializationError = runtime.PrismaClientInitializationError;
exports.PrismaClientValidationError = runtime.PrismaClientValidationError;
exports.sql = runtime.sqltag;
exports.empty = runtime.empty;
exports.join = runtime.join;
exports.raw = runtime.raw;
exports.Sql = runtime.Sql;
exports.Decimal = runtime.Decimal;
exports.getExtensionContext = runtime.Extensions.getExtensionContext;
exports.prismaVersion = {
    client: "7.6.0",
    engine: "75cbdc1eb7150937890ad5465d861175c6624711"
};
exports.NullTypes = {
    DbNull: runtime.NullTypes.DbNull,
    JsonNull: runtime.NullTypes.JsonNull,
    AnyNull: runtime.NullTypes.AnyNull,
};
exports.DbNull = runtime.DbNull;
exports.JsonNull = runtime.JsonNull;
exports.AnyNull = runtime.AnyNull;
exports.ModelName = {
    Tenant: 'Tenant',
    User: 'User',
    Template: 'Template',
    Contract: 'Contract',
    ContractVersion: 'ContractVersion',
    Clause: 'Clause',
    AIAnalysis: 'AIAnalysis',
    RiskFinding: 'RiskFinding',
    Notification: 'Notification'
};
exports.TransactionIsolationLevel = runtime.makeStrictEnum({
    ReadUncommitted: 'ReadUncommitted',
    ReadCommitted: 'ReadCommitted',
    RepeatableRead: 'RepeatableRead',
    Serializable: 'Serializable'
});
exports.TenantScalarFieldEnum = {
    id: 'id',
    name: 'name',
    plan: 'plan',
    domain: 'domain',
    aiTokensUsed: 'aiTokensUsed',
    aiTokenLimit: 'aiTokenLimit',
    billingCycleStart: 'billingCycleStart',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
};
exports.UserScalarFieldEnum = {
    id: 'id',
    supabaseId: 'supabaseId',
    tenantId: 'tenantId',
    email: 'email',
    name: 'name',
    avatarUrl: 'avatarUrl',
    role: 'role',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
};
exports.TemplateScalarFieldEnum = {
    id: 'id',
    tenantId: 'tenantId',
    category: 'category',
    name: 'name',
    description: 'description',
    riskScore: 'riskScore',
    clauseBlocks: 'clauseBlocks',
    isSystem: 'isSystem',
    usageCount: 'usageCount',
    socialProof: 'socialProof',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
};
exports.ContractScalarFieldEnum = {
    id: 'id',
    tenantId: 'tenantId',
    templateId: 'templateId',
    createdById: 'createdById',
    title: 'title',
    status: 'status',
    riskScore: 'riskScore',
    parties: 'parties',
    content: 'content',
    contractValue: 'contractValue',
    currency: 'currency',
    monthlyImpact: 'monthlyImpact',
    effectiveDate: 'effectiveDate',
    expirationDate: 'expirationDate',
    signedAt: 'signedAt',
    lastReviewedAt: 'lastReviewedAt',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
};
exports.ContractVersionScalarFieldEnum = {
    id: 'id',
    contractId: 'contractId',
    version: 'version',
    content: 'content',
    changeNote: 'changeNote',
    changedBy: 'changedBy',
    createdAt: 'createdAt'
};
exports.ClauseScalarFieldEnum = {
    id: 'id',
    contractId: 'contractId',
    type: 'type',
    section: 'section',
    originalText: 'originalText',
    suggestedText: 'suggestedText',
    riskLevel: 'riskLevel',
    riskReason: 'riskReason',
    estimatedImpact: 'estimatedImpact',
    impactPeriod: 'impactPeriod',
    isAccepted: 'isAccepted',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
};
exports.AIAnalysisScalarFieldEnum = {
    id: 'id',
    contractId: 'contractId',
    type: 'type',
    status: 'status',
    tokensUsed: 'tokensUsed',
    modelUsed: 'modelUsed',
    processingMs: 'processingMs',
    errorMessage: 'errorMessage',
    retryCount: 'retryCount',
    startedAt: 'startedAt',
    completedAt: 'completedAt',
    createdAt: 'createdAt'
};
exports.RiskFindingScalarFieldEnum = {
    id: 'id',
    analysisId: 'analysisId',
    severity: 'severity',
    title: 'title',
    clause: 'clause',
    impact: 'impact',
    suggestion: 'suggestion',
    legalRef: 'legalRef',
    estimatedRisk: 'estimatedRisk',
    createdAt: 'createdAt'
};
exports.NotificationScalarFieldEnum = {
    id: 'id',
    userId: 'userId',
    type: 'type',
    title: 'title',
    body: 'body',
    read: 'read',
    actionUrl: 'actionUrl',
    createdAt: 'createdAt'
};
exports.SortOrder = {
    asc: 'asc',
    desc: 'desc'
};
exports.JsonNullValueInput = {
    JsonNull: exports.JsonNull
};
exports.QueryMode = {
    default: 'default',
    insensitive: 'insensitive'
};
exports.NullsOrder = {
    first: 'first',
    last: 'last'
};
exports.JsonNullValueFilter = {
    DbNull: exports.DbNull,
    JsonNull: exports.JsonNull,
    AnyNull: exports.AnyNull
};
exports.defineExtension = runtime.Extensions.defineExtension;
//# sourceMappingURL=prismaNamespace.js.map
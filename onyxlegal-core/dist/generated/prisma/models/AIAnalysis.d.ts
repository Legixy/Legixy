import type * as runtime from "@prisma/client/runtime/client";
import type * as $Enums from "../enums";
import type * as Prisma from "../internal/prismaNamespace";
export type AIAnalysisModel = runtime.Types.Result.DefaultSelection<Prisma.$AIAnalysisPayload>;
export type AggregateAIAnalysis = {
    _count: AIAnalysisCountAggregateOutputType | null;
    _avg: AIAnalysisAvgAggregateOutputType | null;
    _sum: AIAnalysisSumAggregateOutputType | null;
    _min: AIAnalysisMinAggregateOutputType | null;
    _max: AIAnalysisMaxAggregateOutputType | null;
};
export type AIAnalysisAvgAggregateOutputType = {
    tokensUsed: number | null;
    processingMs: number | null;
    retryCount: number | null;
};
export type AIAnalysisSumAggregateOutputType = {
    tokensUsed: number | null;
    processingMs: number | null;
    retryCount: number | null;
};
export type AIAnalysisMinAggregateOutputType = {
    id: string | null;
    contractId: string | null;
    type: $Enums.AnalysisType | null;
    status: $Enums.AnalysisStatus | null;
    tokensUsed: number | null;
    modelUsed: string | null;
    processingMs: number | null;
    errorMessage: string | null;
    retryCount: number | null;
    startedAt: Date | null;
    completedAt: Date | null;
    createdAt: Date | null;
};
export type AIAnalysisMaxAggregateOutputType = {
    id: string | null;
    contractId: string | null;
    type: $Enums.AnalysisType | null;
    status: $Enums.AnalysisStatus | null;
    tokensUsed: number | null;
    modelUsed: string | null;
    processingMs: number | null;
    errorMessage: string | null;
    retryCount: number | null;
    startedAt: Date | null;
    completedAt: Date | null;
    createdAt: Date | null;
};
export type AIAnalysisCountAggregateOutputType = {
    id: number;
    contractId: number;
    type: number;
    status: number;
    tokensUsed: number;
    modelUsed: number;
    processingMs: number;
    errorMessage: number;
    retryCount: number;
    startedAt: number;
    completedAt: number;
    createdAt: number;
    _all: number;
};
export type AIAnalysisAvgAggregateInputType = {
    tokensUsed?: true;
    processingMs?: true;
    retryCount?: true;
};
export type AIAnalysisSumAggregateInputType = {
    tokensUsed?: true;
    processingMs?: true;
    retryCount?: true;
};
export type AIAnalysisMinAggregateInputType = {
    id?: true;
    contractId?: true;
    type?: true;
    status?: true;
    tokensUsed?: true;
    modelUsed?: true;
    processingMs?: true;
    errorMessage?: true;
    retryCount?: true;
    startedAt?: true;
    completedAt?: true;
    createdAt?: true;
};
export type AIAnalysisMaxAggregateInputType = {
    id?: true;
    contractId?: true;
    type?: true;
    status?: true;
    tokensUsed?: true;
    modelUsed?: true;
    processingMs?: true;
    errorMessage?: true;
    retryCount?: true;
    startedAt?: true;
    completedAt?: true;
    createdAt?: true;
};
export type AIAnalysisCountAggregateInputType = {
    id?: true;
    contractId?: true;
    type?: true;
    status?: true;
    tokensUsed?: true;
    modelUsed?: true;
    processingMs?: true;
    errorMessage?: true;
    retryCount?: true;
    startedAt?: true;
    completedAt?: true;
    createdAt?: true;
    _all?: true;
};
export type AIAnalysisAggregateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.AIAnalysisWhereInput;
    orderBy?: Prisma.AIAnalysisOrderByWithRelationInput | Prisma.AIAnalysisOrderByWithRelationInput[];
    cursor?: Prisma.AIAnalysisWhereUniqueInput;
    take?: number;
    skip?: number;
    _count?: true | AIAnalysisCountAggregateInputType;
    _avg?: AIAnalysisAvgAggregateInputType;
    _sum?: AIAnalysisSumAggregateInputType;
    _min?: AIAnalysisMinAggregateInputType;
    _max?: AIAnalysisMaxAggregateInputType;
};
export type GetAIAnalysisAggregateType<T extends AIAnalysisAggregateArgs> = {
    [P in keyof T & keyof AggregateAIAnalysis]: P extends '_count' | 'count' ? T[P] extends true ? number : Prisma.GetScalarType<T[P], AggregateAIAnalysis[P]> : Prisma.GetScalarType<T[P], AggregateAIAnalysis[P]>;
};
export type AIAnalysisGroupByArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.AIAnalysisWhereInput;
    orderBy?: Prisma.AIAnalysisOrderByWithAggregationInput | Prisma.AIAnalysisOrderByWithAggregationInput[];
    by: Prisma.AIAnalysisScalarFieldEnum[] | Prisma.AIAnalysisScalarFieldEnum;
    having?: Prisma.AIAnalysisScalarWhereWithAggregatesInput;
    take?: number;
    skip?: number;
    _count?: AIAnalysisCountAggregateInputType | true;
    _avg?: AIAnalysisAvgAggregateInputType;
    _sum?: AIAnalysisSumAggregateInputType;
    _min?: AIAnalysisMinAggregateInputType;
    _max?: AIAnalysisMaxAggregateInputType;
};
export type AIAnalysisGroupByOutputType = {
    id: string;
    contractId: string;
    type: $Enums.AnalysisType;
    status: $Enums.AnalysisStatus;
    tokensUsed: number;
    modelUsed: string | null;
    processingMs: number | null;
    errorMessage: string | null;
    retryCount: number;
    startedAt: Date | null;
    completedAt: Date | null;
    createdAt: Date;
    _count: AIAnalysisCountAggregateOutputType | null;
    _avg: AIAnalysisAvgAggregateOutputType | null;
    _sum: AIAnalysisSumAggregateOutputType | null;
    _min: AIAnalysisMinAggregateOutputType | null;
    _max: AIAnalysisMaxAggregateOutputType | null;
};
export type GetAIAnalysisGroupByPayload<T extends AIAnalysisGroupByArgs> = Prisma.PrismaPromise<Array<Prisma.PickEnumerable<AIAnalysisGroupByOutputType, T['by']> & {
    [P in ((keyof T) & (keyof AIAnalysisGroupByOutputType))]: P extends '_count' ? T[P] extends boolean ? number : Prisma.GetScalarType<T[P], AIAnalysisGroupByOutputType[P]> : Prisma.GetScalarType<T[P], AIAnalysisGroupByOutputType[P]>;
}>>;
export type AIAnalysisWhereInput = {
    AND?: Prisma.AIAnalysisWhereInput | Prisma.AIAnalysisWhereInput[];
    OR?: Prisma.AIAnalysisWhereInput[];
    NOT?: Prisma.AIAnalysisWhereInput | Prisma.AIAnalysisWhereInput[];
    id?: Prisma.StringFilter<"AIAnalysis"> | string;
    contractId?: Prisma.StringFilter<"AIAnalysis"> | string;
    type?: Prisma.EnumAnalysisTypeFilter<"AIAnalysis"> | $Enums.AnalysisType;
    status?: Prisma.EnumAnalysisStatusFilter<"AIAnalysis"> | $Enums.AnalysisStatus;
    tokensUsed?: Prisma.IntFilter<"AIAnalysis"> | number;
    modelUsed?: Prisma.StringNullableFilter<"AIAnalysis"> | string | null;
    processingMs?: Prisma.IntNullableFilter<"AIAnalysis"> | number | null;
    errorMessage?: Prisma.StringNullableFilter<"AIAnalysis"> | string | null;
    retryCount?: Prisma.IntFilter<"AIAnalysis"> | number;
    startedAt?: Prisma.DateTimeNullableFilter<"AIAnalysis"> | Date | string | null;
    completedAt?: Prisma.DateTimeNullableFilter<"AIAnalysis"> | Date | string | null;
    createdAt?: Prisma.DateTimeFilter<"AIAnalysis"> | Date | string;
    contract?: Prisma.XOR<Prisma.ContractScalarRelationFilter, Prisma.ContractWhereInput>;
    riskFindings?: Prisma.RiskFindingListRelationFilter;
};
export type AIAnalysisOrderByWithRelationInput = {
    id?: Prisma.SortOrder;
    contractId?: Prisma.SortOrder;
    type?: Prisma.SortOrder;
    status?: Prisma.SortOrder;
    tokensUsed?: Prisma.SortOrder;
    modelUsed?: Prisma.SortOrderInput | Prisma.SortOrder;
    processingMs?: Prisma.SortOrderInput | Prisma.SortOrder;
    errorMessage?: Prisma.SortOrderInput | Prisma.SortOrder;
    retryCount?: Prisma.SortOrder;
    startedAt?: Prisma.SortOrderInput | Prisma.SortOrder;
    completedAt?: Prisma.SortOrderInput | Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    contract?: Prisma.ContractOrderByWithRelationInput;
    riskFindings?: Prisma.RiskFindingOrderByRelationAggregateInput;
};
export type AIAnalysisWhereUniqueInput = Prisma.AtLeast<{
    id?: string;
    AND?: Prisma.AIAnalysisWhereInput | Prisma.AIAnalysisWhereInput[];
    OR?: Prisma.AIAnalysisWhereInput[];
    NOT?: Prisma.AIAnalysisWhereInput | Prisma.AIAnalysisWhereInput[];
    contractId?: Prisma.StringFilter<"AIAnalysis"> | string;
    type?: Prisma.EnumAnalysisTypeFilter<"AIAnalysis"> | $Enums.AnalysisType;
    status?: Prisma.EnumAnalysisStatusFilter<"AIAnalysis"> | $Enums.AnalysisStatus;
    tokensUsed?: Prisma.IntFilter<"AIAnalysis"> | number;
    modelUsed?: Prisma.StringNullableFilter<"AIAnalysis"> | string | null;
    processingMs?: Prisma.IntNullableFilter<"AIAnalysis"> | number | null;
    errorMessage?: Prisma.StringNullableFilter<"AIAnalysis"> | string | null;
    retryCount?: Prisma.IntFilter<"AIAnalysis"> | number;
    startedAt?: Prisma.DateTimeNullableFilter<"AIAnalysis"> | Date | string | null;
    completedAt?: Prisma.DateTimeNullableFilter<"AIAnalysis"> | Date | string | null;
    createdAt?: Prisma.DateTimeFilter<"AIAnalysis"> | Date | string;
    contract?: Prisma.XOR<Prisma.ContractScalarRelationFilter, Prisma.ContractWhereInput>;
    riskFindings?: Prisma.RiskFindingListRelationFilter;
}, "id">;
export type AIAnalysisOrderByWithAggregationInput = {
    id?: Prisma.SortOrder;
    contractId?: Prisma.SortOrder;
    type?: Prisma.SortOrder;
    status?: Prisma.SortOrder;
    tokensUsed?: Prisma.SortOrder;
    modelUsed?: Prisma.SortOrderInput | Prisma.SortOrder;
    processingMs?: Prisma.SortOrderInput | Prisma.SortOrder;
    errorMessage?: Prisma.SortOrderInput | Prisma.SortOrder;
    retryCount?: Prisma.SortOrder;
    startedAt?: Prisma.SortOrderInput | Prisma.SortOrder;
    completedAt?: Prisma.SortOrderInput | Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    _count?: Prisma.AIAnalysisCountOrderByAggregateInput;
    _avg?: Prisma.AIAnalysisAvgOrderByAggregateInput;
    _max?: Prisma.AIAnalysisMaxOrderByAggregateInput;
    _min?: Prisma.AIAnalysisMinOrderByAggregateInput;
    _sum?: Prisma.AIAnalysisSumOrderByAggregateInput;
};
export type AIAnalysisScalarWhereWithAggregatesInput = {
    AND?: Prisma.AIAnalysisScalarWhereWithAggregatesInput | Prisma.AIAnalysisScalarWhereWithAggregatesInput[];
    OR?: Prisma.AIAnalysisScalarWhereWithAggregatesInput[];
    NOT?: Prisma.AIAnalysisScalarWhereWithAggregatesInput | Prisma.AIAnalysisScalarWhereWithAggregatesInput[];
    id?: Prisma.StringWithAggregatesFilter<"AIAnalysis"> | string;
    contractId?: Prisma.StringWithAggregatesFilter<"AIAnalysis"> | string;
    type?: Prisma.EnumAnalysisTypeWithAggregatesFilter<"AIAnalysis"> | $Enums.AnalysisType;
    status?: Prisma.EnumAnalysisStatusWithAggregatesFilter<"AIAnalysis"> | $Enums.AnalysisStatus;
    tokensUsed?: Prisma.IntWithAggregatesFilter<"AIAnalysis"> | number;
    modelUsed?: Prisma.StringNullableWithAggregatesFilter<"AIAnalysis"> | string | null;
    processingMs?: Prisma.IntNullableWithAggregatesFilter<"AIAnalysis"> | number | null;
    errorMessage?: Prisma.StringNullableWithAggregatesFilter<"AIAnalysis"> | string | null;
    retryCount?: Prisma.IntWithAggregatesFilter<"AIAnalysis"> | number;
    startedAt?: Prisma.DateTimeNullableWithAggregatesFilter<"AIAnalysis"> | Date | string | null;
    completedAt?: Prisma.DateTimeNullableWithAggregatesFilter<"AIAnalysis"> | Date | string | null;
    createdAt?: Prisma.DateTimeWithAggregatesFilter<"AIAnalysis"> | Date | string;
};
export type AIAnalysisCreateInput = {
    id?: string;
    type: $Enums.AnalysisType;
    status?: $Enums.AnalysisStatus;
    tokensUsed?: number;
    modelUsed?: string | null;
    processingMs?: number | null;
    errorMessage?: string | null;
    retryCount?: number;
    startedAt?: Date | string | null;
    completedAt?: Date | string | null;
    createdAt?: Date | string;
    contract: Prisma.ContractCreateNestedOneWithoutAnalysesInput;
    riskFindings?: Prisma.RiskFindingCreateNestedManyWithoutAnalysisInput;
};
export type AIAnalysisUncheckedCreateInput = {
    id?: string;
    contractId: string;
    type: $Enums.AnalysisType;
    status?: $Enums.AnalysisStatus;
    tokensUsed?: number;
    modelUsed?: string | null;
    processingMs?: number | null;
    errorMessage?: string | null;
    retryCount?: number;
    startedAt?: Date | string | null;
    completedAt?: Date | string | null;
    createdAt?: Date | string;
    riskFindings?: Prisma.RiskFindingUncheckedCreateNestedManyWithoutAnalysisInput;
};
export type AIAnalysisUpdateInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    type?: Prisma.EnumAnalysisTypeFieldUpdateOperationsInput | $Enums.AnalysisType;
    status?: Prisma.EnumAnalysisStatusFieldUpdateOperationsInput | $Enums.AnalysisStatus;
    tokensUsed?: Prisma.IntFieldUpdateOperationsInput | number;
    modelUsed?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    processingMs?: Prisma.NullableIntFieldUpdateOperationsInput | number | null;
    errorMessage?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    retryCount?: Prisma.IntFieldUpdateOperationsInput | number;
    startedAt?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    completedAt?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    contract?: Prisma.ContractUpdateOneRequiredWithoutAnalysesNestedInput;
    riskFindings?: Prisma.RiskFindingUpdateManyWithoutAnalysisNestedInput;
};
export type AIAnalysisUncheckedUpdateInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    contractId?: Prisma.StringFieldUpdateOperationsInput | string;
    type?: Prisma.EnumAnalysisTypeFieldUpdateOperationsInput | $Enums.AnalysisType;
    status?: Prisma.EnumAnalysisStatusFieldUpdateOperationsInput | $Enums.AnalysisStatus;
    tokensUsed?: Prisma.IntFieldUpdateOperationsInput | number;
    modelUsed?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    processingMs?: Prisma.NullableIntFieldUpdateOperationsInput | number | null;
    errorMessage?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    retryCount?: Prisma.IntFieldUpdateOperationsInput | number;
    startedAt?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    completedAt?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    riskFindings?: Prisma.RiskFindingUncheckedUpdateManyWithoutAnalysisNestedInput;
};
export type AIAnalysisCreateManyInput = {
    id?: string;
    contractId: string;
    type: $Enums.AnalysisType;
    status?: $Enums.AnalysisStatus;
    tokensUsed?: number;
    modelUsed?: string | null;
    processingMs?: number | null;
    errorMessage?: string | null;
    retryCount?: number;
    startedAt?: Date | string | null;
    completedAt?: Date | string | null;
    createdAt?: Date | string;
};
export type AIAnalysisUpdateManyMutationInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    type?: Prisma.EnumAnalysisTypeFieldUpdateOperationsInput | $Enums.AnalysisType;
    status?: Prisma.EnumAnalysisStatusFieldUpdateOperationsInput | $Enums.AnalysisStatus;
    tokensUsed?: Prisma.IntFieldUpdateOperationsInput | number;
    modelUsed?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    processingMs?: Prisma.NullableIntFieldUpdateOperationsInput | number | null;
    errorMessage?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    retryCount?: Prisma.IntFieldUpdateOperationsInput | number;
    startedAt?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    completedAt?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type AIAnalysisUncheckedUpdateManyInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    contractId?: Prisma.StringFieldUpdateOperationsInput | string;
    type?: Prisma.EnumAnalysisTypeFieldUpdateOperationsInput | $Enums.AnalysisType;
    status?: Prisma.EnumAnalysisStatusFieldUpdateOperationsInput | $Enums.AnalysisStatus;
    tokensUsed?: Prisma.IntFieldUpdateOperationsInput | number;
    modelUsed?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    processingMs?: Prisma.NullableIntFieldUpdateOperationsInput | number | null;
    errorMessage?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    retryCount?: Prisma.IntFieldUpdateOperationsInput | number;
    startedAt?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    completedAt?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type AIAnalysisListRelationFilter = {
    every?: Prisma.AIAnalysisWhereInput;
    some?: Prisma.AIAnalysisWhereInput;
    none?: Prisma.AIAnalysisWhereInput;
};
export type AIAnalysisOrderByRelationAggregateInput = {
    _count?: Prisma.SortOrder;
};
export type AIAnalysisCountOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    contractId?: Prisma.SortOrder;
    type?: Prisma.SortOrder;
    status?: Prisma.SortOrder;
    tokensUsed?: Prisma.SortOrder;
    modelUsed?: Prisma.SortOrder;
    processingMs?: Prisma.SortOrder;
    errorMessage?: Prisma.SortOrder;
    retryCount?: Prisma.SortOrder;
    startedAt?: Prisma.SortOrder;
    completedAt?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
};
export type AIAnalysisAvgOrderByAggregateInput = {
    tokensUsed?: Prisma.SortOrder;
    processingMs?: Prisma.SortOrder;
    retryCount?: Prisma.SortOrder;
};
export type AIAnalysisMaxOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    contractId?: Prisma.SortOrder;
    type?: Prisma.SortOrder;
    status?: Prisma.SortOrder;
    tokensUsed?: Prisma.SortOrder;
    modelUsed?: Prisma.SortOrder;
    processingMs?: Prisma.SortOrder;
    errorMessage?: Prisma.SortOrder;
    retryCount?: Prisma.SortOrder;
    startedAt?: Prisma.SortOrder;
    completedAt?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
};
export type AIAnalysisMinOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    contractId?: Prisma.SortOrder;
    type?: Prisma.SortOrder;
    status?: Prisma.SortOrder;
    tokensUsed?: Prisma.SortOrder;
    modelUsed?: Prisma.SortOrder;
    processingMs?: Prisma.SortOrder;
    errorMessage?: Prisma.SortOrder;
    retryCount?: Prisma.SortOrder;
    startedAt?: Prisma.SortOrder;
    completedAt?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
};
export type AIAnalysisSumOrderByAggregateInput = {
    tokensUsed?: Prisma.SortOrder;
    processingMs?: Prisma.SortOrder;
    retryCount?: Prisma.SortOrder;
};
export type AIAnalysisScalarRelationFilter = {
    is?: Prisma.AIAnalysisWhereInput;
    isNot?: Prisma.AIAnalysisWhereInput;
};
export type AIAnalysisCreateNestedManyWithoutContractInput = {
    create?: Prisma.XOR<Prisma.AIAnalysisCreateWithoutContractInput, Prisma.AIAnalysisUncheckedCreateWithoutContractInput> | Prisma.AIAnalysisCreateWithoutContractInput[] | Prisma.AIAnalysisUncheckedCreateWithoutContractInput[];
    connectOrCreate?: Prisma.AIAnalysisCreateOrConnectWithoutContractInput | Prisma.AIAnalysisCreateOrConnectWithoutContractInput[];
    createMany?: Prisma.AIAnalysisCreateManyContractInputEnvelope;
    connect?: Prisma.AIAnalysisWhereUniqueInput | Prisma.AIAnalysisWhereUniqueInput[];
};
export type AIAnalysisUncheckedCreateNestedManyWithoutContractInput = {
    create?: Prisma.XOR<Prisma.AIAnalysisCreateWithoutContractInput, Prisma.AIAnalysisUncheckedCreateWithoutContractInput> | Prisma.AIAnalysisCreateWithoutContractInput[] | Prisma.AIAnalysisUncheckedCreateWithoutContractInput[];
    connectOrCreate?: Prisma.AIAnalysisCreateOrConnectWithoutContractInput | Prisma.AIAnalysisCreateOrConnectWithoutContractInput[];
    createMany?: Prisma.AIAnalysisCreateManyContractInputEnvelope;
    connect?: Prisma.AIAnalysisWhereUniqueInput | Prisma.AIAnalysisWhereUniqueInput[];
};
export type AIAnalysisUpdateManyWithoutContractNestedInput = {
    create?: Prisma.XOR<Prisma.AIAnalysisCreateWithoutContractInput, Prisma.AIAnalysisUncheckedCreateWithoutContractInput> | Prisma.AIAnalysisCreateWithoutContractInput[] | Prisma.AIAnalysisUncheckedCreateWithoutContractInput[];
    connectOrCreate?: Prisma.AIAnalysisCreateOrConnectWithoutContractInput | Prisma.AIAnalysisCreateOrConnectWithoutContractInput[];
    upsert?: Prisma.AIAnalysisUpsertWithWhereUniqueWithoutContractInput | Prisma.AIAnalysisUpsertWithWhereUniqueWithoutContractInput[];
    createMany?: Prisma.AIAnalysisCreateManyContractInputEnvelope;
    set?: Prisma.AIAnalysisWhereUniqueInput | Prisma.AIAnalysisWhereUniqueInput[];
    disconnect?: Prisma.AIAnalysisWhereUniqueInput | Prisma.AIAnalysisWhereUniqueInput[];
    delete?: Prisma.AIAnalysisWhereUniqueInput | Prisma.AIAnalysisWhereUniqueInput[];
    connect?: Prisma.AIAnalysisWhereUniqueInput | Prisma.AIAnalysisWhereUniqueInput[];
    update?: Prisma.AIAnalysisUpdateWithWhereUniqueWithoutContractInput | Prisma.AIAnalysisUpdateWithWhereUniqueWithoutContractInput[];
    updateMany?: Prisma.AIAnalysisUpdateManyWithWhereWithoutContractInput | Prisma.AIAnalysisUpdateManyWithWhereWithoutContractInput[];
    deleteMany?: Prisma.AIAnalysisScalarWhereInput | Prisma.AIAnalysisScalarWhereInput[];
};
export type AIAnalysisUncheckedUpdateManyWithoutContractNestedInput = {
    create?: Prisma.XOR<Prisma.AIAnalysisCreateWithoutContractInput, Prisma.AIAnalysisUncheckedCreateWithoutContractInput> | Prisma.AIAnalysisCreateWithoutContractInput[] | Prisma.AIAnalysisUncheckedCreateWithoutContractInput[];
    connectOrCreate?: Prisma.AIAnalysisCreateOrConnectWithoutContractInput | Prisma.AIAnalysisCreateOrConnectWithoutContractInput[];
    upsert?: Prisma.AIAnalysisUpsertWithWhereUniqueWithoutContractInput | Prisma.AIAnalysisUpsertWithWhereUniqueWithoutContractInput[];
    createMany?: Prisma.AIAnalysisCreateManyContractInputEnvelope;
    set?: Prisma.AIAnalysisWhereUniqueInput | Prisma.AIAnalysisWhereUniqueInput[];
    disconnect?: Prisma.AIAnalysisWhereUniqueInput | Prisma.AIAnalysisWhereUniqueInput[];
    delete?: Prisma.AIAnalysisWhereUniqueInput | Prisma.AIAnalysisWhereUniqueInput[];
    connect?: Prisma.AIAnalysisWhereUniqueInput | Prisma.AIAnalysisWhereUniqueInput[];
    update?: Prisma.AIAnalysisUpdateWithWhereUniqueWithoutContractInput | Prisma.AIAnalysisUpdateWithWhereUniqueWithoutContractInput[];
    updateMany?: Prisma.AIAnalysisUpdateManyWithWhereWithoutContractInput | Prisma.AIAnalysisUpdateManyWithWhereWithoutContractInput[];
    deleteMany?: Prisma.AIAnalysisScalarWhereInput | Prisma.AIAnalysisScalarWhereInput[];
};
export type EnumAnalysisTypeFieldUpdateOperationsInput = {
    set?: $Enums.AnalysisType;
};
export type EnumAnalysisStatusFieldUpdateOperationsInput = {
    set?: $Enums.AnalysisStatus;
};
export type AIAnalysisCreateNestedOneWithoutRiskFindingsInput = {
    create?: Prisma.XOR<Prisma.AIAnalysisCreateWithoutRiskFindingsInput, Prisma.AIAnalysisUncheckedCreateWithoutRiskFindingsInput>;
    connectOrCreate?: Prisma.AIAnalysisCreateOrConnectWithoutRiskFindingsInput;
    connect?: Prisma.AIAnalysisWhereUniqueInput;
};
export type AIAnalysisUpdateOneRequiredWithoutRiskFindingsNestedInput = {
    create?: Prisma.XOR<Prisma.AIAnalysisCreateWithoutRiskFindingsInput, Prisma.AIAnalysisUncheckedCreateWithoutRiskFindingsInput>;
    connectOrCreate?: Prisma.AIAnalysisCreateOrConnectWithoutRiskFindingsInput;
    upsert?: Prisma.AIAnalysisUpsertWithoutRiskFindingsInput;
    connect?: Prisma.AIAnalysisWhereUniqueInput;
    update?: Prisma.XOR<Prisma.XOR<Prisma.AIAnalysisUpdateToOneWithWhereWithoutRiskFindingsInput, Prisma.AIAnalysisUpdateWithoutRiskFindingsInput>, Prisma.AIAnalysisUncheckedUpdateWithoutRiskFindingsInput>;
};
export type AIAnalysisCreateWithoutContractInput = {
    id?: string;
    type: $Enums.AnalysisType;
    status?: $Enums.AnalysisStatus;
    tokensUsed?: number;
    modelUsed?: string | null;
    processingMs?: number | null;
    errorMessage?: string | null;
    retryCount?: number;
    startedAt?: Date | string | null;
    completedAt?: Date | string | null;
    createdAt?: Date | string;
    riskFindings?: Prisma.RiskFindingCreateNestedManyWithoutAnalysisInput;
};
export type AIAnalysisUncheckedCreateWithoutContractInput = {
    id?: string;
    type: $Enums.AnalysisType;
    status?: $Enums.AnalysisStatus;
    tokensUsed?: number;
    modelUsed?: string | null;
    processingMs?: number | null;
    errorMessage?: string | null;
    retryCount?: number;
    startedAt?: Date | string | null;
    completedAt?: Date | string | null;
    createdAt?: Date | string;
    riskFindings?: Prisma.RiskFindingUncheckedCreateNestedManyWithoutAnalysisInput;
};
export type AIAnalysisCreateOrConnectWithoutContractInput = {
    where: Prisma.AIAnalysisWhereUniqueInput;
    create: Prisma.XOR<Prisma.AIAnalysisCreateWithoutContractInput, Prisma.AIAnalysisUncheckedCreateWithoutContractInput>;
};
export type AIAnalysisCreateManyContractInputEnvelope = {
    data: Prisma.AIAnalysisCreateManyContractInput | Prisma.AIAnalysisCreateManyContractInput[];
    skipDuplicates?: boolean;
};
export type AIAnalysisUpsertWithWhereUniqueWithoutContractInput = {
    where: Prisma.AIAnalysisWhereUniqueInput;
    update: Prisma.XOR<Prisma.AIAnalysisUpdateWithoutContractInput, Prisma.AIAnalysisUncheckedUpdateWithoutContractInput>;
    create: Prisma.XOR<Prisma.AIAnalysisCreateWithoutContractInput, Prisma.AIAnalysisUncheckedCreateWithoutContractInput>;
};
export type AIAnalysisUpdateWithWhereUniqueWithoutContractInput = {
    where: Prisma.AIAnalysisWhereUniqueInput;
    data: Prisma.XOR<Prisma.AIAnalysisUpdateWithoutContractInput, Prisma.AIAnalysisUncheckedUpdateWithoutContractInput>;
};
export type AIAnalysisUpdateManyWithWhereWithoutContractInput = {
    where: Prisma.AIAnalysisScalarWhereInput;
    data: Prisma.XOR<Prisma.AIAnalysisUpdateManyMutationInput, Prisma.AIAnalysisUncheckedUpdateManyWithoutContractInput>;
};
export type AIAnalysisScalarWhereInput = {
    AND?: Prisma.AIAnalysisScalarWhereInput | Prisma.AIAnalysisScalarWhereInput[];
    OR?: Prisma.AIAnalysisScalarWhereInput[];
    NOT?: Prisma.AIAnalysisScalarWhereInput | Prisma.AIAnalysisScalarWhereInput[];
    id?: Prisma.StringFilter<"AIAnalysis"> | string;
    contractId?: Prisma.StringFilter<"AIAnalysis"> | string;
    type?: Prisma.EnumAnalysisTypeFilter<"AIAnalysis"> | $Enums.AnalysisType;
    status?: Prisma.EnumAnalysisStatusFilter<"AIAnalysis"> | $Enums.AnalysisStatus;
    tokensUsed?: Prisma.IntFilter<"AIAnalysis"> | number;
    modelUsed?: Prisma.StringNullableFilter<"AIAnalysis"> | string | null;
    processingMs?: Prisma.IntNullableFilter<"AIAnalysis"> | number | null;
    errorMessage?: Prisma.StringNullableFilter<"AIAnalysis"> | string | null;
    retryCount?: Prisma.IntFilter<"AIAnalysis"> | number;
    startedAt?: Prisma.DateTimeNullableFilter<"AIAnalysis"> | Date | string | null;
    completedAt?: Prisma.DateTimeNullableFilter<"AIAnalysis"> | Date | string | null;
    createdAt?: Prisma.DateTimeFilter<"AIAnalysis"> | Date | string;
};
export type AIAnalysisCreateWithoutRiskFindingsInput = {
    id?: string;
    type: $Enums.AnalysisType;
    status?: $Enums.AnalysisStatus;
    tokensUsed?: number;
    modelUsed?: string | null;
    processingMs?: number | null;
    errorMessage?: string | null;
    retryCount?: number;
    startedAt?: Date | string | null;
    completedAt?: Date | string | null;
    createdAt?: Date | string;
    contract: Prisma.ContractCreateNestedOneWithoutAnalysesInput;
};
export type AIAnalysisUncheckedCreateWithoutRiskFindingsInput = {
    id?: string;
    contractId: string;
    type: $Enums.AnalysisType;
    status?: $Enums.AnalysisStatus;
    tokensUsed?: number;
    modelUsed?: string | null;
    processingMs?: number | null;
    errorMessage?: string | null;
    retryCount?: number;
    startedAt?: Date | string | null;
    completedAt?: Date | string | null;
    createdAt?: Date | string;
};
export type AIAnalysisCreateOrConnectWithoutRiskFindingsInput = {
    where: Prisma.AIAnalysisWhereUniqueInput;
    create: Prisma.XOR<Prisma.AIAnalysisCreateWithoutRiskFindingsInput, Prisma.AIAnalysisUncheckedCreateWithoutRiskFindingsInput>;
};
export type AIAnalysisUpsertWithoutRiskFindingsInput = {
    update: Prisma.XOR<Prisma.AIAnalysisUpdateWithoutRiskFindingsInput, Prisma.AIAnalysisUncheckedUpdateWithoutRiskFindingsInput>;
    create: Prisma.XOR<Prisma.AIAnalysisCreateWithoutRiskFindingsInput, Prisma.AIAnalysisUncheckedCreateWithoutRiskFindingsInput>;
    where?: Prisma.AIAnalysisWhereInput;
};
export type AIAnalysisUpdateToOneWithWhereWithoutRiskFindingsInput = {
    where?: Prisma.AIAnalysisWhereInput;
    data: Prisma.XOR<Prisma.AIAnalysisUpdateWithoutRiskFindingsInput, Prisma.AIAnalysisUncheckedUpdateWithoutRiskFindingsInput>;
};
export type AIAnalysisUpdateWithoutRiskFindingsInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    type?: Prisma.EnumAnalysisTypeFieldUpdateOperationsInput | $Enums.AnalysisType;
    status?: Prisma.EnumAnalysisStatusFieldUpdateOperationsInput | $Enums.AnalysisStatus;
    tokensUsed?: Prisma.IntFieldUpdateOperationsInput | number;
    modelUsed?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    processingMs?: Prisma.NullableIntFieldUpdateOperationsInput | number | null;
    errorMessage?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    retryCount?: Prisma.IntFieldUpdateOperationsInput | number;
    startedAt?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    completedAt?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    contract?: Prisma.ContractUpdateOneRequiredWithoutAnalysesNestedInput;
};
export type AIAnalysisUncheckedUpdateWithoutRiskFindingsInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    contractId?: Prisma.StringFieldUpdateOperationsInput | string;
    type?: Prisma.EnumAnalysisTypeFieldUpdateOperationsInput | $Enums.AnalysisType;
    status?: Prisma.EnumAnalysisStatusFieldUpdateOperationsInput | $Enums.AnalysisStatus;
    tokensUsed?: Prisma.IntFieldUpdateOperationsInput | number;
    modelUsed?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    processingMs?: Prisma.NullableIntFieldUpdateOperationsInput | number | null;
    errorMessage?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    retryCount?: Prisma.IntFieldUpdateOperationsInput | number;
    startedAt?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    completedAt?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type AIAnalysisCreateManyContractInput = {
    id?: string;
    type: $Enums.AnalysisType;
    status?: $Enums.AnalysisStatus;
    tokensUsed?: number;
    modelUsed?: string | null;
    processingMs?: number | null;
    errorMessage?: string | null;
    retryCount?: number;
    startedAt?: Date | string | null;
    completedAt?: Date | string | null;
    createdAt?: Date | string;
};
export type AIAnalysisUpdateWithoutContractInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    type?: Prisma.EnumAnalysisTypeFieldUpdateOperationsInput | $Enums.AnalysisType;
    status?: Prisma.EnumAnalysisStatusFieldUpdateOperationsInput | $Enums.AnalysisStatus;
    tokensUsed?: Prisma.IntFieldUpdateOperationsInput | number;
    modelUsed?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    processingMs?: Prisma.NullableIntFieldUpdateOperationsInput | number | null;
    errorMessage?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    retryCount?: Prisma.IntFieldUpdateOperationsInput | number;
    startedAt?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    completedAt?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    riskFindings?: Prisma.RiskFindingUpdateManyWithoutAnalysisNestedInput;
};
export type AIAnalysisUncheckedUpdateWithoutContractInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    type?: Prisma.EnumAnalysisTypeFieldUpdateOperationsInput | $Enums.AnalysisType;
    status?: Prisma.EnumAnalysisStatusFieldUpdateOperationsInput | $Enums.AnalysisStatus;
    tokensUsed?: Prisma.IntFieldUpdateOperationsInput | number;
    modelUsed?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    processingMs?: Prisma.NullableIntFieldUpdateOperationsInput | number | null;
    errorMessage?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    retryCount?: Prisma.IntFieldUpdateOperationsInput | number;
    startedAt?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    completedAt?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    riskFindings?: Prisma.RiskFindingUncheckedUpdateManyWithoutAnalysisNestedInput;
};
export type AIAnalysisUncheckedUpdateManyWithoutContractInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    type?: Prisma.EnumAnalysisTypeFieldUpdateOperationsInput | $Enums.AnalysisType;
    status?: Prisma.EnumAnalysisStatusFieldUpdateOperationsInput | $Enums.AnalysisStatus;
    tokensUsed?: Prisma.IntFieldUpdateOperationsInput | number;
    modelUsed?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    processingMs?: Prisma.NullableIntFieldUpdateOperationsInput | number | null;
    errorMessage?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    retryCount?: Prisma.IntFieldUpdateOperationsInput | number;
    startedAt?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    completedAt?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type AIAnalysisCountOutputType = {
    riskFindings: number;
};
export type AIAnalysisCountOutputTypeSelect<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    riskFindings?: boolean | AIAnalysisCountOutputTypeCountRiskFindingsArgs;
};
export type AIAnalysisCountOutputTypeDefaultArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.AIAnalysisCountOutputTypeSelect<ExtArgs> | null;
};
export type AIAnalysisCountOutputTypeCountRiskFindingsArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.RiskFindingWhereInput;
};
export type AIAnalysisSelect<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    contractId?: boolean;
    type?: boolean;
    status?: boolean;
    tokensUsed?: boolean;
    modelUsed?: boolean;
    processingMs?: boolean;
    errorMessage?: boolean;
    retryCount?: boolean;
    startedAt?: boolean;
    completedAt?: boolean;
    createdAt?: boolean;
    contract?: boolean | Prisma.ContractDefaultArgs<ExtArgs>;
    riskFindings?: boolean | Prisma.AIAnalysis$riskFindingsArgs<ExtArgs>;
    _count?: boolean | Prisma.AIAnalysisCountOutputTypeDefaultArgs<ExtArgs>;
}, ExtArgs["result"]["aIAnalysis"]>;
export type AIAnalysisSelectCreateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    contractId?: boolean;
    type?: boolean;
    status?: boolean;
    tokensUsed?: boolean;
    modelUsed?: boolean;
    processingMs?: boolean;
    errorMessage?: boolean;
    retryCount?: boolean;
    startedAt?: boolean;
    completedAt?: boolean;
    createdAt?: boolean;
    contract?: boolean | Prisma.ContractDefaultArgs<ExtArgs>;
}, ExtArgs["result"]["aIAnalysis"]>;
export type AIAnalysisSelectUpdateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    contractId?: boolean;
    type?: boolean;
    status?: boolean;
    tokensUsed?: boolean;
    modelUsed?: boolean;
    processingMs?: boolean;
    errorMessage?: boolean;
    retryCount?: boolean;
    startedAt?: boolean;
    completedAt?: boolean;
    createdAt?: boolean;
    contract?: boolean | Prisma.ContractDefaultArgs<ExtArgs>;
}, ExtArgs["result"]["aIAnalysis"]>;
export type AIAnalysisSelectScalar = {
    id?: boolean;
    contractId?: boolean;
    type?: boolean;
    status?: boolean;
    tokensUsed?: boolean;
    modelUsed?: boolean;
    processingMs?: boolean;
    errorMessage?: boolean;
    retryCount?: boolean;
    startedAt?: boolean;
    completedAt?: boolean;
    createdAt?: boolean;
};
export type AIAnalysisOmit<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetOmit<"id" | "contractId" | "type" | "status" | "tokensUsed" | "modelUsed" | "processingMs" | "errorMessage" | "retryCount" | "startedAt" | "completedAt" | "createdAt", ExtArgs["result"]["aIAnalysis"]>;
export type AIAnalysisInclude<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    contract?: boolean | Prisma.ContractDefaultArgs<ExtArgs>;
    riskFindings?: boolean | Prisma.AIAnalysis$riskFindingsArgs<ExtArgs>;
    _count?: boolean | Prisma.AIAnalysisCountOutputTypeDefaultArgs<ExtArgs>;
};
export type AIAnalysisIncludeCreateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    contract?: boolean | Prisma.ContractDefaultArgs<ExtArgs>;
};
export type AIAnalysisIncludeUpdateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    contract?: boolean | Prisma.ContractDefaultArgs<ExtArgs>;
};
export type $AIAnalysisPayload<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    name: "AIAnalysis";
    objects: {
        contract: Prisma.$ContractPayload<ExtArgs>;
        riskFindings: Prisma.$RiskFindingPayload<ExtArgs>[];
    };
    scalars: runtime.Types.Extensions.GetPayloadResult<{
        id: string;
        contractId: string;
        type: $Enums.AnalysisType;
        status: $Enums.AnalysisStatus;
        tokensUsed: number;
        modelUsed: string | null;
        processingMs: number | null;
        errorMessage: string | null;
        retryCount: number;
        startedAt: Date | null;
        completedAt: Date | null;
        createdAt: Date;
    }, ExtArgs["result"]["aIAnalysis"]>;
    composites: {};
};
export type AIAnalysisGetPayload<S extends boolean | null | undefined | AIAnalysisDefaultArgs> = runtime.Types.Result.GetResult<Prisma.$AIAnalysisPayload, S>;
export type AIAnalysisCountArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = Omit<AIAnalysisFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
    select?: AIAnalysisCountAggregateInputType | true;
};
export interface AIAnalysisDelegate<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: {
        types: Prisma.TypeMap<ExtArgs>['model']['AIAnalysis'];
        meta: {
            name: 'AIAnalysis';
        };
    };
    findUnique<T extends AIAnalysisFindUniqueArgs>(args: Prisma.SelectSubset<T, AIAnalysisFindUniqueArgs<ExtArgs>>): Prisma.Prisma__AIAnalysisClient<runtime.Types.Result.GetResult<Prisma.$AIAnalysisPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>;
    findUniqueOrThrow<T extends AIAnalysisFindUniqueOrThrowArgs>(args: Prisma.SelectSubset<T, AIAnalysisFindUniqueOrThrowArgs<ExtArgs>>): Prisma.Prisma__AIAnalysisClient<runtime.Types.Result.GetResult<Prisma.$AIAnalysisPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    findFirst<T extends AIAnalysisFindFirstArgs>(args?: Prisma.SelectSubset<T, AIAnalysisFindFirstArgs<ExtArgs>>): Prisma.Prisma__AIAnalysisClient<runtime.Types.Result.GetResult<Prisma.$AIAnalysisPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>;
    findFirstOrThrow<T extends AIAnalysisFindFirstOrThrowArgs>(args?: Prisma.SelectSubset<T, AIAnalysisFindFirstOrThrowArgs<ExtArgs>>): Prisma.Prisma__AIAnalysisClient<runtime.Types.Result.GetResult<Prisma.$AIAnalysisPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    findMany<T extends AIAnalysisFindManyArgs>(args?: Prisma.SelectSubset<T, AIAnalysisFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$AIAnalysisPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>;
    create<T extends AIAnalysisCreateArgs>(args: Prisma.SelectSubset<T, AIAnalysisCreateArgs<ExtArgs>>): Prisma.Prisma__AIAnalysisClient<runtime.Types.Result.GetResult<Prisma.$AIAnalysisPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    createMany<T extends AIAnalysisCreateManyArgs>(args?: Prisma.SelectSubset<T, AIAnalysisCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    createManyAndReturn<T extends AIAnalysisCreateManyAndReturnArgs>(args?: Prisma.SelectSubset<T, AIAnalysisCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$AIAnalysisPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>;
    delete<T extends AIAnalysisDeleteArgs>(args: Prisma.SelectSubset<T, AIAnalysisDeleteArgs<ExtArgs>>): Prisma.Prisma__AIAnalysisClient<runtime.Types.Result.GetResult<Prisma.$AIAnalysisPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    update<T extends AIAnalysisUpdateArgs>(args: Prisma.SelectSubset<T, AIAnalysisUpdateArgs<ExtArgs>>): Prisma.Prisma__AIAnalysisClient<runtime.Types.Result.GetResult<Prisma.$AIAnalysisPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    deleteMany<T extends AIAnalysisDeleteManyArgs>(args?: Prisma.SelectSubset<T, AIAnalysisDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    updateMany<T extends AIAnalysisUpdateManyArgs>(args: Prisma.SelectSubset<T, AIAnalysisUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    updateManyAndReturn<T extends AIAnalysisUpdateManyAndReturnArgs>(args: Prisma.SelectSubset<T, AIAnalysisUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$AIAnalysisPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>;
    upsert<T extends AIAnalysisUpsertArgs>(args: Prisma.SelectSubset<T, AIAnalysisUpsertArgs<ExtArgs>>): Prisma.Prisma__AIAnalysisClient<runtime.Types.Result.GetResult<Prisma.$AIAnalysisPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    count<T extends AIAnalysisCountArgs>(args?: Prisma.Subset<T, AIAnalysisCountArgs>): Prisma.PrismaPromise<T extends runtime.Types.Utils.Record<'select', any> ? T['select'] extends true ? number : Prisma.GetScalarType<T['select'], AIAnalysisCountAggregateOutputType> : number>;
    aggregate<T extends AIAnalysisAggregateArgs>(args: Prisma.Subset<T, AIAnalysisAggregateArgs>): Prisma.PrismaPromise<GetAIAnalysisAggregateType<T>>;
    groupBy<T extends AIAnalysisGroupByArgs, HasSelectOrTake extends Prisma.Or<Prisma.Extends<'skip', Prisma.Keys<T>>, Prisma.Extends<'take', Prisma.Keys<T>>>, OrderByArg extends Prisma.True extends HasSelectOrTake ? {
        orderBy: AIAnalysisGroupByArgs['orderBy'];
    } : {
        orderBy?: AIAnalysisGroupByArgs['orderBy'];
    }, OrderFields extends Prisma.ExcludeUnderscoreKeys<Prisma.Keys<Prisma.MaybeTupleToUnion<T['orderBy']>>>, ByFields extends Prisma.MaybeTupleToUnion<T['by']>, ByValid extends Prisma.Has<ByFields, OrderFields>, HavingFields extends Prisma.GetHavingFields<T['having']>, HavingValid extends Prisma.Has<ByFields, HavingFields>, ByEmpty extends T['by'] extends never[] ? Prisma.True : Prisma.False, InputErrors extends ByEmpty extends Prisma.True ? `Error: "by" must not be empty.` : HavingValid extends Prisma.False ? {
        [P in HavingFields]: P extends ByFields ? never : P extends string ? `Error: Field "${P}" used in "having" needs to be provided in "by".` : [
            Error,
            'Field ',
            P,
            ` in "having" needs to be provided in "by"`
        ];
    }[HavingFields] : 'take' extends Prisma.Keys<T> ? 'orderBy' extends Prisma.Keys<T> ? ByValid extends Prisma.True ? {} : {
        [P in OrderFields]: P extends ByFields ? never : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`;
    }[OrderFields] : 'Error: If you provide "take", you also need to provide "orderBy"' : 'skip' extends Prisma.Keys<T> ? 'orderBy' extends Prisma.Keys<T> ? ByValid extends Prisma.True ? {} : {
        [P in OrderFields]: P extends ByFields ? never : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`;
    }[OrderFields] : 'Error: If you provide "skip", you also need to provide "orderBy"' : ByValid extends Prisma.True ? {} : {
        [P in OrderFields]: P extends ByFields ? never : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`;
    }[OrderFields]>(args: Prisma.SubsetIntersection<T, AIAnalysisGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetAIAnalysisGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>;
    readonly fields: AIAnalysisFieldRefs;
}
export interface Prisma__AIAnalysisClient<T, Null = never, ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise";
    contract<T extends Prisma.ContractDefaultArgs<ExtArgs> = {}>(args?: Prisma.Subset<T, Prisma.ContractDefaultArgs<ExtArgs>>): Prisma.Prisma__ContractClient<runtime.Types.Result.GetResult<Prisma.$ContractPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>;
    riskFindings<T extends Prisma.AIAnalysis$riskFindingsArgs<ExtArgs> = {}>(args?: Prisma.Subset<T, Prisma.AIAnalysis$riskFindingsArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$RiskFindingPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>;
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): runtime.Types.Utils.JsPromise<TResult1 | TResult2>;
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): runtime.Types.Utils.JsPromise<T | TResult>;
    finally(onfinally?: (() => void) | undefined | null): runtime.Types.Utils.JsPromise<T>;
}
export interface AIAnalysisFieldRefs {
    readonly id: Prisma.FieldRef<"AIAnalysis", 'String'>;
    readonly contractId: Prisma.FieldRef<"AIAnalysis", 'String'>;
    readonly type: Prisma.FieldRef<"AIAnalysis", 'AnalysisType'>;
    readonly status: Prisma.FieldRef<"AIAnalysis", 'AnalysisStatus'>;
    readonly tokensUsed: Prisma.FieldRef<"AIAnalysis", 'Int'>;
    readonly modelUsed: Prisma.FieldRef<"AIAnalysis", 'String'>;
    readonly processingMs: Prisma.FieldRef<"AIAnalysis", 'Int'>;
    readonly errorMessage: Prisma.FieldRef<"AIAnalysis", 'String'>;
    readonly retryCount: Prisma.FieldRef<"AIAnalysis", 'Int'>;
    readonly startedAt: Prisma.FieldRef<"AIAnalysis", 'DateTime'>;
    readonly completedAt: Prisma.FieldRef<"AIAnalysis", 'DateTime'>;
    readonly createdAt: Prisma.FieldRef<"AIAnalysis", 'DateTime'>;
}
export type AIAnalysisFindUniqueArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.AIAnalysisSelect<ExtArgs> | null;
    omit?: Prisma.AIAnalysisOmit<ExtArgs> | null;
    include?: Prisma.AIAnalysisInclude<ExtArgs> | null;
    where: Prisma.AIAnalysisWhereUniqueInput;
};
export type AIAnalysisFindUniqueOrThrowArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.AIAnalysisSelect<ExtArgs> | null;
    omit?: Prisma.AIAnalysisOmit<ExtArgs> | null;
    include?: Prisma.AIAnalysisInclude<ExtArgs> | null;
    where: Prisma.AIAnalysisWhereUniqueInput;
};
export type AIAnalysisFindFirstArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.AIAnalysisSelect<ExtArgs> | null;
    omit?: Prisma.AIAnalysisOmit<ExtArgs> | null;
    include?: Prisma.AIAnalysisInclude<ExtArgs> | null;
    where?: Prisma.AIAnalysisWhereInput;
    orderBy?: Prisma.AIAnalysisOrderByWithRelationInput | Prisma.AIAnalysisOrderByWithRelationInput[];
    cursor?: Prisma.AIAnalysisWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.AIAnalysisScalarFieldEnum | Prisma.AIAnalysisScalarFieldEnum[];
};
export type AIAnalysisFindFirstOrThrowArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.AIAnalysisSelect<ExtArgs> | null;
    omit?: Prisma.AIAnalysisOmit<ExtArgs> | null;
    include?: Prisma.AIAnalysisInclude<ExtArgs> | null;
    where?: Prisma.AIAnalysisWhereInput;
    orderBy?: Prisma.AIAnalysisOrderByWithRelationInput | Prisma.AIAnalysisOrderByWithRelationInput[];
    cursor?: Prisma.AIAnalysisWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.AIAnalysisScalarFieldEnum | Prisma.AIAnalysisScalarFieldEnum[];
};
export type AIAnalysisFindManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.AIAnalysisSelect<ExtArgs> | null;
    omit?: Prisma.AIAnalysisOmit<ExtArgs> | null;
    include?: Prisma.AIAnalysisInclude<ExtArgs> | null;
    where?: Prisma.AIAnalysisWhereInput;
    orderBy?: Prisma.AIAnalysisOrderByWithRelationInput | Prisma.AIAnalysisOrderByWithRelationInput[];
    cursor?: Prisma.AIAnalysisWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.AIAnalysisScalarFieldEnum | Prisma.AIAnalysisScalarFieldEnum[];
};
export type AIAnalysisCreateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.AIAnalysisSelect<ExtArgs> | null;
    omit?: Prisma.AIAnalysisOmit<ExtArgs> | null;
    include?: Prisma.AIAnalysisInclude<ExtArgs> | null;
    data: Prisma.XOR<Prisma.AIAnalysisCreateInput, Prisma.AIAnalysisUncheckedCreateInput>;
};
export type AIAnalysisCreateManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    data: Prisma.AIAnalysisCreateManyInput | Prisma.AIAnalysisCreateManyInput[];
    skipDuplicates?: boolean;
};
export type AIAnalysisCreateManyAndReturnArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.AIAnalysisSelectCreateManyAndReturn<ExtArgs> | null;
    omit?: Prisma.AIAnalysisOmit<ExtArgs> | null;
    data: Prisma.AIAnalysisCreateManyInput | Prisma.AIAnalysisCreateManyInput[];
    skipDuplicates?: boolean;
    include?: Prisma.AIAnalysisIncludeCreateManyAndReturn<ExtArgs> | null;
};
export type AIAnalysisUpdateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.AIAnalysisSelect<ExtArgs> | null;
    omit?: Prisma.AIAnalysisOmit<ExtArgs> | null;
    include?: Prisma.AIAnalysisInclude<ExtArgs> | null;
    data: Prisma.XOR<Prisma.AIAnalysisUpdateInput, Prisma.AIAnalysisUncheckedUpdateInput>;
    where: Prisma.AIAnalysisWhereUniqueInput;
};
export type AIAnalysisUpdateManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    data: Prisma.XOR<Prisma.AIAnalysisUpdateManyMutationInput, Prisma.AIAnalysisUncheckedUpdateManyInput>;
    where?: Prisma.AIAnalysisWhereInput;
    limit?: number;
};
export type AIAnalysisUpdateManyAndReturnArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.AIAnalysisSelectUpdateManyAndReturn<ExtArgs> | null;
    omit?: Prisma.AIAnalysisOmit<ExtArgs> | null;
    data: Prisma.XOR<Prisma.AIAnalysisUpdateManyMutationInput, Prisma.AIAnalysisUncheckedUpdateManyInput>;
    where?: Prisma.AIAnalysisWhereInput;
    limit?: number;
    include?: Prisma.AIAnalysisIncludeUpdateManyAndReturn<ExtArgs> | null;
};
export type AIAnalysisUpsertArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.AIAnalysisSelect<ExtArgs> | null;
    omit?: Prisma.AIAnalysisOmit<ExtArgs> | null;
    include?: Prisma.AIAnalysisInclude<ExtArgs> | null;
    where: Prisma.AIAnalysisWhereUniqueInput;
    create: Prisma.XOR<Prisma.AIAnalysisCreateInput, Prisma.AIAnalysisUncheckedCreateInput>;
    update: Prisma.XOR<Prisma.AIAnalysisUpdateInput, Prisma.AIAnalysisUncheckedUpdateInput>;
};
export type AIAnalysisDeleteArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.AIAnalysisSelect<ExtArgs> | null;
    omit?: Prisma.AIAnalysisOmit<ExtArgs> | null;
    include?: Prisma.AIAnalysisInclude<ExtArgs> | null;
    where: Prisma.AIAnalysisWhereUniqueInput;
};
export type AIAnalysisDeleteManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.AIAnalysisWhereInput;
    limit?: number;
};
export type AIAnalysis$riskFindingsArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.RiskFindingSelect<ExtArgs> | null;
    omit?: Prisma.RiskFindingOmit<ExtArgs> | null;
    include?: Prisma.RiskFindingInclude<ExtArgs> | null;
    where?: Prisma.RiskFindingWhereInput;
    orderBy?: Prisma.RiskFindingOrderByWithRelationInput | Prisma.RiskFindingOrderByWithRelationInput[];
    cursor?: Prisma.RiskFindingWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.RiskFindingScalarFieldEnum | Prisma.RiskFindingScalarFieldEnum[];
};
export type AIAnalysisDefaultArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.AIAnalysisSelect<ExtArgs> | null;
    omit?: Prisma.AIAnalysisOmit<ExtArgs> | null;
    include?: Prisma.AIAnalysisInclude<ExtArgs> | null;
};

import type * as runtime from "@prisma/client/runtime/client";
import type * as $Enums from "../enums";
import type * as Prisma from "../internal/prismaNamespace";
export type RiskFindingModel = runtime.Types.Result.DefaultSelection<Prisma.$RiskFindingPayload>;
export type AggregateRiskFinding = {
    _count: RiskFindingCountAggregateOutputType | null;
    _avg: RiskFindingAvgAggregateOutputType | null;
    _sum: RiskFindingSumAggregateOutputType | null;
    _min: RiskFindingMinAggregateOutputType | null;
    _max: RiskFindingMaxAggregateOutputType | null;
};
export type RiskFindingAvgAggregateOutputType = {
    estimatedRisk: runtime.Decimal | null;
};
export type RiskFindingSumAggregateOutputType = {
    estimatedRisk: runtime.Decimal | null;
};
export type RiskFindingMinAggregateOutputType = {
    id: string | null;
    analysisId: string | null;
    severity: $Enums.RiskLevel | null;
    title: string | null;
    clause: string | null;
    impact: string | null;
    suggestion: string | null;
    legalRef: string | null;
    estimatedRisk: runtime.Decimal | null;
    createdAt: Date | null;
};
export type RiskFindingMaxAggregateOutputType = {
    id: string | null;
    analysisId: string | null;
    severity: $Enums.RiskLevel | null;
    title: string | null;
    clause: string | null;
    impact: string | null;
    suggestion: string | null;
    legalRef: string | null;
    estimatedRisk: runtime.Decimal | null;
    createdAt: Date | null;
};
export type RiskFindingCountAggregateOutputType = {
    id: number;
    analysisId: number;
    severity: number;
    title: number;
    clause: number;
    impact: number;
    suggestion: number;
    legalRef: number;
    estimatedRisk: number;
    createdAt: number;
    _all: number;
};
export type RiskFindingAvgAggregateInputType = {
    estimatedRisk?: true;
};
export type RiskFindingSumAggregateInputType = {
    estimatedRisk?: true;
};
export type RiskFindingMinAggregateInputType = {
    id?: true;
    analysisId?: true;
    severity?: true;
    title?: true;
    clause?: true;
    impact?: true;
    suggestion?: true;
    legalRef?: true;
    estimatedRisk?: true;
    createdAt?: true;
};
export type RiskFindingMaxAggregateInputType = {
    id?: true;
    analysisId?: true;
    severity?: true;
    title?: true;
    clause?: true;
    impact?: true;
    suggestion?: true;
    legalRef?: true;
    estimatedRisk?: true;
    createdAt?: true;
};
export type RiskFindingCountAggregateInputType = {
    id?: true;
    analysisId?: true;
    severity?: true;
    title?: true;
    clause?: true;
    impact?: true;
    suggestion?: true;
    legalRef?: true;
    estimatedRisk?: true;
    createdAt?: true;
    _all?: true;
};
export type RiskFindingAggregateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.RiskFindingWhereInput;
    orderBy?: Prisma.RiskFindingOrderByWithRelationInput | Prisma.RiskFindingOrderByWithRelationInput[];
    cursor?: Prisma.RiskFindingWhereUniqueInput;
    take?: number;
    skip?: number;
    _count?: true | RiskFindingCountAggregateInputType;
    _avg?: RiskFindingAvgAggregateInputType;
    _sum?: RiskFindingSumAggregateInputType;
    _min?: RiskFindingMinAggregateInputType;
    _max?: RiskFindingMaxAggregateInputType;
};
export type GetRiskFindingAggregateType<T extends RiskFindingAggregateArgs> = {
    [P in keyof T & keyof AggregateRiskFinding]: P extends '_count' | 'count' ? T[P] extends true ? number : Prisma.GetScalarType<T[P], AggregateRiskFinding[P]> : Prisma.GetScalarType<T[P], AggregateRiskFinding[P]>;
};
export type RiskFindingGroupByArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.RiskFindingWhereInput;
    orderBy?: Prisma.RiskFindingOrderByWithAggregationInput | Prisma.RiskFindingOrderByWithAggregationInput[];
    by: Prisma.RiskFindingScalarFieldEnum[] | Prisma.RiskFindingScalarFieldEnum;
    having?: Prisma.RiskFindingScalarWhereWithAggregatesInput;
    take?: number;
    skip?: number;
    _count?: RiskFindingCountAggregateInputType | true;
    _avg?: RiskFindingAvgAggregateInputType;
    _sum?: RiskFindingSumAggregateInputType;
    _min?: RiskFindingMinAggregateInputType;
    _max?: RiskFindingMaxAggregateInputType;
};
export type RiskFindingGroupByOutputType = {
    id: string;
    analysisId: string;
    severity: $Enums.RiskLevel;
    title: string;
    clause: string;
    impact: string;
    suggestion: string;
    legalRef: string | null;
    estimatedRisk: runtime.Decimal | null;
    createdAt: Date;
    _count: RiskFindingCountAggregateOutputType | null;
    _avg: RiskFindingAvgAggregateOutputType | null;
    _sum: RiskFindingSumAggregateOutputType | null;
    _min: RiskFindingMinAggregateOutputType | null;
    _max: RiskFindingMaxAggregateOutputType | null;
};
export type GetRiskFindingGroupByPayload<T extends RiskFindingGroupByArgs> = Prisma.PrismaPromise<Array<Prisma.PickEnumerable<RiskFindingGroupByOutputType, T['by']> & {
    [P in ((keyof T) & (keyof RiskFindingGroupByOutputType))]: P extends '_count' ? T[P] extends boolean ? number : Prisma.GetScalarType<T[P], RiskFindingGroupByOutputType[P]> : Prisma.GetScalarType<T[P], RiskFindingGroupByOutputType[P]>;
}>>;
export type RiskFindingWhereInput = {
    AND?: Prisma.RiskFindingWhereInput | Prisma.RiskFindingWhereInput[];
    OR?: Prisma.RiskFindingWhereInput[];
    NOT?: Prisma.RiskFindingWhereInput | Prisma.RiskFindingWhereInput[];
    id?: Prisma.StringFilter<"RiskFinding"> | string;
    analysisId?: Prisma.StringFilter<"RiskFinding"> | string;
    severity?: Prisma.EnumRiskLevelFilter<"RiskFinding"> | $Enums.RiskLevel;
    title?: Prisma.StringFilter<"RiskFinding"> | string;
    clause?: Prisma.StringFilter<"RiskFinding"> | string;
    impact?: Prisma.StringFilter<"RiskFinding"> | string;
    suggestion?: Prisma.StringFilter<"RiskFinding"> | string;
    legalRef?: Prisma.StringNullableFilter<"RiskFinding"> | string | null;
    estimatedRisk?: Prisma.DecimalNullableFilter<"RiskFinding"> | runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    createdAt?: Prisma.DateTimeFilter<"RiskFinding"> | Date | string;
    analysis?: Prisma.XOR<Prisma.AIAnalysisScalarRelationFilter, Prisma.AIAnalysisWhereInput>;
};
export type RiskFindingOrderByWithRelationInput = {
    id?: Prisma.SortOrder;
    analysisId?: Prisma.SortOrder;
    severity?: Prisma.SortOrder;
    title?: Prisma.SortOrder;
    clause?: Prisma.SortOrder;
    impact?: Prisma.SortOrder;
    suggestion?: Prisma.SortOrder;
    legalRef?: Prisma.SortOrderInput | Prisma.SortOrder;
    estimatedRisk?: Prisma.SortOrderInput | Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    analysis?: Prisma.AIAnalysisOrderByWithRelationInput;
};
export type RiskFindingWhereUniqueInput = Prisma.AtLeast<{
    id?: string;
    AND?: Prisma.RiskFindingWhereInput | Prisma.RiskFindingWhereInput[];
    OR?: Prisma.RiskFindingWhereInput[];
    NOT?: Prisma.RiskFindingWhereInput | Prisma.RiskFindingWhereInput[];
    analysisId?: Prisma.StringFilter<"RiskFinding"> | string;
    severity?: Prisma.EnumRiskLevelFilter<"RiskFinding"> | $Enums.RiskLevel;
    title?: Prisma.StringFilter<"RiskFinding"> | string;
    clause?: Prisma.StringFilter<"RiskFinding"> | string;
    impact?: Prisma.StringFilter<"RiskFinding"> | string;
    suggestion?: Prisma.StringFilter<"RiskFinding"> | string;
    legalRef?: Prisma.StringNullableFilter<"RiskFinding"> | string | null;
    estimatedRisk?: Prisma.DecimalNullableFilter<"RiskFinding"> | runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    createdAt?: Prisma.DateTimeFilter<"RiskFinding"> | Date | string;
    analysis?: Prisma.XOR<Prisma.AIAnalysisScalarRelationFilter, Prisma.AIAnalysisWhereInput>;
}, "id">;
export type RiskFindingOrderByWithAggregationInput = {
    id?: Prisma.SortOrder;
    analysisId?: Prisma.SortOrder;
    severity?: Prisma.SortOrder;
    title?: Prisma.SortOrder;
    clause?: Prisma.SortOrder;
    impact?: Prisma.SortOrder;
    suggestion?: Prisma.SortOrder;
    legalRef?: Prisma.SortOrderInput | Prisma.SortOrder;
    estimatedRisk?: Prisma.SortOrderInput | Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    _count?: Prisma.RiskFindingCountOrderByAggregateInput;
    _avg?: Prisma.RiskFindingAvgOrderByAggregateInput;
    _max?: Prisma.RiskFindingMaxOrderByAggregateInput;
    _min?: Prisma.RiskFindingMinOrderByAggregateInput;
    _sum?: Prisma.RiskFindingSumOrderByAggregateInput;
};
export type RiskFindingScalarWhereWithAggregatesInput = {
    AND?: Prisma.RiskFindingScalarWhereWithAggregatesInput | Prisma.RiskFindingScalarWhereWithAggregatesInput[];
    OR?: Prisma.RiskFindingScalarWhereWithAggregatesInput[];
    NOT?: Prisma.RiskFindingScalarWhereWithAggregatesInput | Prisma.RiskFindingScalarWhereWithAggregatesInput[];
    id?: Prisma.StringWithAggregatesFilter<"RiskFinding"> | string;
    analysisId?: Prisma.StringWithAggregatesFilter<"RiskFinding"> | string;
    severity?: Prisma.EnumRiskLevelWithAggregatesFilter<"RiskFinding"> | $Enums.RiskLevel;
    title?: Prisma.StringWithAggregatesFilter<"RiskFinding"> | string;
    clause?: Prisma.StringWithAggregatesFilter<"RiskFinding"> | string;
    impact?: Prisma.StringWithAggregatesFilter<"RiskFinding"> | string;
    suggestion?: Prisma.StringWithAggregatesFilter<"RiskFinding"> | string;
    legalRef?: Prisma.StringNullableWithAggregatesFilter<"RiskFinding"> | string | null;
    estimatedRisk?: Prisma.DecimalNullableWithAggregatesFilter<"RiskFinding"> | runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    createdAt?: Prisma.DateTimeWithAggregatesFilter<"RiskFinding"> | Date | string;
};
export type RiskFindingCreateInput = {
    id?: string;
    severity: $Enums.RiskLevel;
    title: string;
    clause: string;
    impact: string;
    suggestion: string;
    legalRef?: string | null;
    estimatedRisk?: runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    createdAt?: Date | string;
    analysis: Prisma.AIAnalysisCreateNestedOneWithoutRiskFindingsInput;
};
export type RiskFindingUncheckedCreateInput = {
    id?: string;
    analysisId: string;
    severity: $Enums.RiskLevel;
    title: string;
    clause: string;
    impact: string;
    suggestion: string;
    legalRef?: string | null;
    estimatedRisk?: runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    createdAt?: Date | string;
};
export type RiskFindingUpdateInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    severity?: Prisma.EnumRiskLevelFieldUpdateOperationsInput | $Enums.RiskLevel;
    title?: Prisma.StringFieldUpdateOperationsInput | string;
    clause?: Prisma.StringFieldUpdateOperationsInput | string;
    impact?: Prisma.StringFieldUpdateOperationsInput | string;
    suggestion?: Prisma.StringFieldUpdateOperationsInput | string;
    legalRef?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    estimatedRisk?: Prisma.NullableDecimalFieldUpdateOperationsInput | runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    analysis?: Prisma.AIAnalysisUpdateOneRequiredWithoutRiskFindingsNestedInput;
};
export type RiskFindingUncheckedUpdateInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    analysisId?: Prisma.StringFieldUpdateOperationsInput | string;
    severity?: Prisma.EnumRiskLevelFieldUpdateOperationsInput | $Enums.RiskLevel;
    title?: Prisma.StringFieldUpdateOperationsInput | string;
    clause?: Prisma.StringFieldUpdateOperationsInput | string;
    impact?: Prisma.StringFieldUpdateOperationsInput | string;
    suggestion?: Prisma.StringFieldUpdateOperationsInput | string;
    legalRef?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    estimatedRisk?: Prisma.NullableDecimalFieldUpdateOperationsInput | runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type RiskFindingCreateManyInput = {
    id?: string;
    analysisId: string;
    severity: $Enums.RiskLevel;
    title: string;
    clause: string;
    impact: string;
    suggestion: string;
    legalRef?: string | null;
    estimatedRisk?: runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    createdAt?: Date | string;
};
export type RiskFindingUpdateManyMutationInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    severity?: Prisma.EnumRiskLevelFieldUpdateOperationsInput | $Enums.RiskLevel;
    title?: Prisma.StringFieldUpdateOperationsInput | string;
    clause?: Prisma.StringFieldUpdateOperationsInput | string;
    impact?: Prisma.StringFieldUpdateOperationsInput | string;
    suggestion?: Prisma.StringFieldUpdateOperationsInput | string;
    legalRef?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    estimatedRisk?: Prisma.NullableDecimalFieldUpdateOperationsInput | runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type RiskFindingUncheckedUpdateManyInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    analysisId?: Prisma.StringFieldUpdateOperationsInput | string;
    severity?: Prisma.EnumRiskLevelFieldUpdateOperationsInput | $Enums.RiskLevel;
    title?: Prisma.StringFieldUpdateOperationsInput | string;
    clause?: Prisma.StringFieldUpdateOperationsInput | string;
    impact?: Prisma.StringFieldUpdateOperationsInput | string;
    suggestion?: Prisma.StringFieldUpdateOperationsInput | string;
    legalRef?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    estimatedRisk?: Prisma.NullableDecimalFieldUpdateOperationsInput | runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type RiskFindingListRelationFilter = {
    every?: Prisma.RiskFindingWhereInput;
    some?: Prisma.RiskFindingWhereInput;
    none?: Prisma.RiskFindingWhereInput;
};
export type RiskFindingOrderByRelationAggregateInput = {
    _count?: Prisma.SortOrder;
};
export type RiskFindingCountOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    analysisId?: Prisma.SortOrder;
    severity?: Prisma.SortOrder;
    title?: Prisma.SortOrder;
    clause?: Prisma.SortOrder;
    impact?: Prisma.SortOrder;
    suggestion?: Prisma.SortOrder;
    legalRef?: Prisma.SortOrder;
    estimatedRisk?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
};
export type RiskFindingAvgOrderByAggregateInput = {
    estimatedRisk?: Prisma.SortOrder;
};
export type RiskFindingMaxOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    analysisId?: Prisma.SortOrder;
    severity?: Prisma.SortOrder;
    title?: Prisma.SortOrder;
    clause?: Prisma.SortOrder;
    impact?: Prisma.SortOrder;
    suggestion?: Prisma.SortOrder;
    legalRef?: Prisma.SortOrder;
    estimatedRisk?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
};
export type RiskFindingMinOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    analysisId?: Prisma.SortOrder;
    severity?: Prisma.SortOrder;
    title?: Prisma.SortOrder;
    clause?: Prisma.SortOrder;
    impact?: Prisma.SortOrder;
    suggestion?: Prisma.SortOrder;
    legalRef?: Prisma.SortOrder;
    estimatedRisk?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
};
export type RiskFindingSumOrderByAggregateInput = {
    estimatedRisk?: Prisma.SortOrder;
};
export type RiskFindingCreateNestedManyWithoutAnalysisInput = {
    create?: Prisma.XOR<Prisma.RiskFindingCreateWithoutAnalysisInput, Prisma.RiskFindingUncheckedCreateWithoutAnalysisInput> | Prisma.RiskFindingCreateWithoutAnalysisInput[] | Prisma.RiskFindingUncheckedCreateWithoutAnalysisInput[];
    connectOrCreate?: Prisma.RiskFindingCreateOrConnectWithoutAnalysisInput | Prisma.RiskFindingCreateOrConnectWithoutAnalysisInput[];
    createMany?: Prisma.RiskFindingCreateManyAnalysisInputEnvelope;
    connect?: Prisma.RiskFindingWhereUniqueInput | Prisma.RiskFindingWhereUniqueInput[];
};
export type RiskFindingUncheckedCreateNestedManyWithoutAnalysisInput = {
    create?: Prisma.XOR<Prisma.RiskFindingCreateWithoutAnalysisInput, Prisma.RiskFindingUncheckedCreateWithoutAnalysisInput> | Prisma.RiskFindingCreateWithoutAnalysisInput[] | Prisma.RiskFindingUncheckedCreateWithoutAnalysisInput[];
    connectOrCreate?: Prisma.RiskFindingCreateOrConnectWithoutAnalysisInput | Prisma.RiskFindingCreateOrConnectWithoutAnalysisInput[];
    createMany?: Prisma.RiskFindingCreateManyAnalysisInputEnvelope;
    connect?: Prisma.RiskFindingWhereUniqueInput | Prisma.RiskFindingWhereUniqueInput[];
};
export type RiskFindingUpdateManyWithoutAnalysisNestedInput = {
    create?: Prisma.XOR<Prisma.RiskFindingCreateWithoutAnalysisInput, Prisma.RiskFindingUncheckedCreateWithoutAnalysisInput> | Prisma.RiskFindingCreateWithoutAnalysisInput[] | Prisma.RiskFindingUncheckedCreateWithoutAnalysisInput[];
    connectOrCreate?: Prisma.RiskFindingCreateOrConnectWithoutAnalysisInput | Prisma.RiskFindingCreateOrConnectWithoutAnalysisInput[];
    upsert?: Prisma.RiskFindingUpsertWithWhereUniqueWithoutAnalysisInput | Prisma.RiskFindingUpsertWithWhereUniqueWithoutAnalysisInput[];
    createMany?: Prisma.RiskFindingCreateManyAnalysisInputEnvelope;
    set?: Prisma.RiskFindingWhereUniqueInput | Prisma.RiskFindingWhereUniqueInput[];
    disconnect?: Prisma.RiskFindingWhereUniqueInput | Prisma.RiskFindingWhereUniqueInput[];
    delete?: Prisma.RiskFindingWhereUniqueInput | Prisma.RiskFindingWhereUniqueInput[];
    connect?: Prisma.RiskFindingWhereUniqueInput | Prisma.RiskFindingWhereUniqueInput[];
    update?: Prisma.RiskFindingUpdateWithWhereUniqueWithoutAnalysisInput | Prisma.RiskFindingUpdateWithWhereUniqueWithoutAnalysisInput[];
    updateMany?: Prisma.RiskFindingUpdateManyWithWhereWithoutAnalysisInput | Prisma.RiskFindingUpdateManyWithWhereWithoutAnalysisInput[];
    deleteMany?: Prisma.RiskFindingScalarWhereInput | Prisma.RiskFindingScalarWhereInput[];
};
export type RiskFindingUncheckedUpdateManyWithoutAnalysisNestedInput = {
    create?: Prisma.XOR<Prisma.RiskFindingCreateWithoutAnalysisInput, Prisma.RiskFindingUncheckedCreateWithoutAnalysisInput> | Prisma.RiskFindingCreateWithoutAnalysisInput[] | Prisma.RiskFindingUncheckedCreateWithoutAnalysisInput[];
    connectOrCreate?: Prisma.RiskFindingCreateOrConnectWithoutAnalysisInput | Prisma.RiskFindingCreateOrConnectWithoutAnalysisInput[];
    upsert?: Prisma.RiskFindingUpsertWithWhereUniqueWithoutAnalysisInput | Prisma.RiskFindingUpsertWithWhereUniqueWithoutAnalysisInput[];
    createMany?: Prisma.RiskFindingCreateManyAnalysisInputEnvelope;
    set?: Prisma.RiskFindingWhereUniqueInput | Prisma.RiskFindingWhereUniqueInput[];
    disconnect?: Prisma.RiskFindingWhereUniqueInput | Prisma.RiskFindingWhereUniqueInput[];
    delete?: Prisma.RiskFindingWhereUniqueInput | Prisma.RiskFindingWhereUniqueInput[];
    connect?: Prisma.RiskFindingWhereUniqueInput | Prisma.RiskFindingWhereUniqueInput[];
    update?: Prisma.RiskFindingUpdateWithWhereUniqueWithoutAnalysisInput | Prisma.RiskFindingUpdateWithWhereUniqueWithoutAnalysisInput[];
    updateMany?: Prisma.RiskFindingUpdateManyWithWhereWithoutAnalysisInput | Prisma.RiskFindingUpdateManyWithWhereWithoutAnalysisInput[];
    deleteMany?: Prisma.RiskFindingScalarWhereInput | Prisma.RiskFindingScalarWhereInput[];
};
export type RiskFindingCreateWithoutAnalysisInput = {
    id?: string;
    severity: $Enums.RiskLevel;
    title: string;
    clause: string;
    impact: string;
    suggestion: string;
    legalRef?: string | null;
    estimatedRisk?: runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    createdAt?: Date | string;
};
export type RiskFindingUncheckedCreateWithoutAnalysisInput = {
    id?: string;
    severity: $Enums.RiskLevel;
    title: string;
    clause: string;
    impact: string;
    suggestion: string;
    legalRef?: string | null;
    estimatedRisk?: runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    createdAt?: Date | string;
};
export type RiskFindingCreateOrConnectWithoutAnalysisInput = {
    where: Prisma.RiskFindingWhereUniqueInput;
    create: Prisma.XOR<Prisma.RiskFindingCreateWithoutAnalysisInput, Prisma.RiskFindingUncheckedCreateWithoutAnalysisInput>;
};
export type RiskFindingCreateManyAnalysisInputEnvelope = {
    data: Prisma.RiskFindingCreateManyAnalysisInput | Prisma.RiskFindingCreateManyAnalysisInput[];
    skipDuplicates?: boolean;
};
export type RiskFindingUpsertWithWhereUniqueWithoutAnalysisInput = {
    where: Prisma.RiskFindingWhereUniqueInput;
    update: Prisma.XOR<Prisma.RiskFindingUpdateWithoutAnalysisInput, Prisma.RiskFindingUncheckedUpdateWithoutAnalysisInput>;
    create: Prisma.XOR<Prisma.RiskFindingCreateWithoutAnalysisInput, Prisma.RiskFindingUncheckedCreateWithoutAnalysisInput>;
};
export type RiskFindingUpdateWithWhereUniqueWithoutAnalysisInput = {
    where: Prisma.RiskFindingWhereUniqueInput;
    data: Prisma.XOR<Prisma.RiskFindingUpdateWithoutAnalysisInput, Prisma.RiskFindingUncheckedUpdateWithoutAnalysisInput>;
};
export type RiskFindingUpdateManyWithWhereWithoutAnalysisInput = {
    where: Prisma.RiskFindingScalarWhereInput;
    data: Prisma.XOR<Prisma.RiskFindingUpdateManyMutationInput, Prisma.RiskFindingUncheckedUpdateManyWithoutAnalysisInput>;
};
export type RiskFindingScalarWhereInput = {
    AND?: Prisma.RiskFindingScalarWhereInput | Prisma.RiskFindingScalarWhereInput[];
    OR?: Prisma.RiskFindingScalarWhereInput[];
    NOT?: Prisma.RiskFindingScalarWhereInput | Prisma.RiskFindingScalarWhereInput[];
    id?: Prisma.StringFilter<"RiskFinding"> | string;
    analysisId?: Prisma.StringFilter<"RiskFinding"> | string;
    severity?: Prisma.EnumRiskLevelFilter<"RiskFinding"> | $Enums.RiskLevel;
    title?: Prisma.StringFilter<"RiskFinding"> | string;
    clause?: Prisma.StringFilter<"RiskFinding"> | string;
    impact?: Prisma.StringFilter<"RiskFinding"> | string;
    suggestion?: Prisma.StringFilter<"RiskFinding"> | string;
    legalRef?: Prisma.StringNullableFilter<"RiskFinding"> | string | null;
    estimatedRisk?: Prisma.DecimalNullableFilter<"RiskFinding"> | runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    createdAt?: Prisma.DateTimeFilter<"RiskFinding"> | Date | string;
};
export type RiskFindingCreateManyAnalysisInput = {
    id?: string;
    severity: $Enums.RiskLevel;
    title: string;
    clause: string;
    impact: string;
    suggestion: string;
    legalRef?: string | null;
    estimatedRisk?: runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    createdAt?: Date | string;
};
export type RiskFindingUpdateWithoutAnalysisInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    severity?: Prisma.EnumRiskLevelFieldUpdateOperationsInput | $Enums.RiskLevel;
    title?: Prisma.StringFieldUpdateOperationsInput | string;
    clause?: Prisma.StringFieldUpdateOperationsInput | string;
    impact?: Prisma.StringFieldUpdateOperationsInput | string;
    suggestion?: Prisma.StringFieldUpdateOperationsInput | string;
    legalRef?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    estimatedRisk?: Prisma.NullableDecimalFieldUpdateOperationsInput | runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type RiskFindingUncheckedUpdateWithoutAnalysisInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    severity?: Prisma.EnumRiskLevelFieldUpdateOperationsInput | $Enums.RiskLevel;
    title?: Prisma.StringFieldUpdateOperationsInput | string;
    clause?: Prisma.StringFieldUpdateOperationsInput | string;
    impact?: Prisma.StringFieldUpdateOperationsInput | string;
    suggestion?: Prisma.StringFieldUpdateOperationsInput | string;
    legalRef?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    estimatedRisk?: Prisma.NullableDecimalFieldUpdateOperationsInput | runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type RiskFindingUncheckedUpdateManyWithoutAnalysisInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    severity?: Prisma.EnumRiskLevelFieldUpdateOperationsInput | $Enums.RiskLevel;
    title?: Prisma.StringFieldUpdateOperationsInput | string;
    clause?: Prisma.StringFieldUpdateOperationsInput | string;
    impact?: Prisma.StringFieldUpdateOperationsInput | string;
    suggestion?: Prisma.StringFieldUpdateOperationsInput | string;
    legalRef?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    estimatedRisk?: Prisma.NullableDecimalFieldUpdateOperationsInput | runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type RiskFindingSelect<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    analysisId?: boolean;
    severity?: boolean;
    title?: boolean;
    clause?: boolean;
    impact?: boolean;
    suggestion?: boolean;
    legalRef?: boolean;
    estimatedRisk?: boolean;
    createdAt?: boolean;
    analysis?: boolean | Prisma.AIAnalysisDefaultArgs<ExtArgs>;
}, ExtArgs["result"]["riskFinding"]>;
export type RiskFindingSelectCreateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    analysisId?: boolean;
    severity?: boolean;
    title?: boolean;
    clause?: boolean;
    impact?: boolean;
    suggestion?: boolean;
    legalRef?: boolean;
    estimatedRisk?: boolean;
    createdAt?: boolean;
    analysis?: boolean | Prisma.AIAnalysisDefaultArgs<ExtArgs>;
}, ExtArgs["result"]["riskFinding"]>;
export type RiskFindingSelectUpdateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    analysisId?: boolean;
    severity?: boolean;
    title?: boolean;
    clause?: boolean;
    impact?: boolean;
    suggestion?: boolean;
    legalRef?: boolean;
    estimatedRisk?: boolean;
    createdAt?: boolean;
    analysis?: boolean | Prisma.AIAnalysisDefaultArgs<ExtArgs>;
}, ExtArgs["result"]["riskFinding"]>;
export type RiskFindingSelectScalar = {
    id?: boolean;
    analysisId?: boolean;
    severity?: boolean;
    title?: boolean;
    clause?: boolean;
    impact?: boolean;
    suggestion?: boolean;
    legalRef?: boolean;
    estimatedRisk?: boolean;
    createdAt?: boolean;
};
export type RiskFindingOmit<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetOmit<"id" | "analysisId" | "severity" | "title" | "clause" | "impact" | "suggestion" | "legalRef" | "estimatedRisk" | "createdAt", ExtArgs["result"]["riskFinding"]>;
export type RiskFindingInclude<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    analysis?: boolean | Prisma.AIAnalysisDefaultArgs<ExtArgs>;
};
export type RiskFindingIncludeCreateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    analysis?: boolean | Prisma.AIAnalysisDefaultArgs<ExtArgs>;
};
export type RiskFindingIncludeUpdateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    analysis?: boolean | Prisma.AIAnalysisDefaultArgs<ExtArgs>;
};
export type $RiskFindingPayload<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    name: "RiskFinding";
    objects: {
        analysis: Prisma.$AIAnalysisPayload<ExtArgs>;
    };
    scalars: runtime.Types.Extensions.GetPayloadResult<{
        id: string;
        analysisId: string;
        severity: $Enums.RiskLevel;
        title: string;
        clause: string;
        impact: string;
        suggestion: string;
        legalRef: string | null;
        estimatedRisk: runtime.Decimal | null;
        createdAt: Date;
    }, ExtArgs["result"]["riskFinding"]>;
    composites: {};
};
export type RiskFindingGetPayload<S extends boolean | null | undefined | RiskFindingDefaultArgs> = runtime.Types.Result.GetResult<Prisma.$RiskFindingPayload, S>;
export type RiskFindingCountArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = Omit<RiskFindingFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
    select?: RiskFindingCountAggregateInputType | true;
};
export interface RiskFindingDelegate<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: {
        types: Prisma.TypeMap<ExtArgs>['model']['RiskFinding'];
        meta: {
            name: 'RiskFinding';
        };
    };
    findUnique<T extends RiskFindingFindUniqueArgs>(args: Prisma.SelectSubset<T, RiskFindingFindUniqueArgs<ExtArgs>>): Prisma.Prisma__RiskFindingClient<runtime.Types.Result.GetResult<Prisma.$RiskFindingPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>;
    findUniqueOrThrow<T extends RiskFindingFindUniqueOrThrowArgs>(args: Prisma.SelectSubset<T, RiskFindingFindUniqueOrThrowArgs<ExtArgs>>): Prisma.Prisma__RiskFindingClient<runtime.Types.Result.GetResult<Prisma.$RiskFindingPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    findFirst<T extends RiskFindingFindFirstArgs>(args?: Prisma.SelectSubset<T, RiskFindingFindFirstArgs<ExtArgs>>): Prisma.Prisma__RiskFindingClient<runtime.Types.Result.GetResult<Prisma.$RiskFindingPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>;
    findFirstOrThrow<T extends RiskFindingFindFirstOrThrowArgs>(args?: Prisma.SelectSubset<T, RiskFindingFindFirstOrThrowArgs<ExtArgs>>): Prisma.Prisma__RiskFindingClient<runtime.Types.Result.GetResult<Prisma.$RiskFindingPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    findMany<T extends RiskFindingFindManyArgs>(args?: Prisma.SelectSubset<T, RiskFindingFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$RiskFindingPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>;
    create<T extends RiskFindingCreateArgs>(args: Prisma.SelectSubset<T, RiskFindingCreateArgs<ExtArgs>>): Prisma.Prisma__RiskFindingClient<runtime.Types.Result.GetResult<Prisma.$RiskFindingPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    createMany<T extends RiskFindingCreateManyArgs>(args?: Prisma.SelectSubset<T, RiskFindingCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    createManyAndReturn<T extends RiskFindingCreateManyAndReturnArgs>(args?: Prisma.SelectSubset<T, RiskFindingCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$RiskFindingPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>;
    delete<T extends RiskFindingDeleteArgs>(args: Prisma.SelectSubset<T, RiskFindingDeleteArgs<ExtArgs>>): Prisma.Prisma__RiskFindingClient<runtime.Types.Result.GetResult<Prisma.$RiskFindingPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    update<T extends RiskFindingUpdateArgs>(args: Prisma.SelectSubset<T, RiskFindingUpdateArgs<ExtArgs>>): Prisma.Prisma__RiskFindingClient<runtime.Types.Result.GetResult<Prisma.$RiskFindingPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    deleteMany<T extends RiskFindingDeleteManyArgs>(args?: Prisma.SelectSubset<T, RiskFindingDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    updateMany<T extends RiskFindingUpdateManyArgs>(args: Prisma.SelectSubset<T, RiskFindingUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    updateManyAndReturn<T extends RiskFindingUpdateManyAndReturnArgs>(args: Prisma.SelectSubset<T, RiskFindingUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$RiskFindingPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>;
    upsert<T extends RiskFindingUpsertArgs>(args: Prisma.SelectSubset<T, RiskFindingUpsertArgs<ExtArgs>>): Prisma.Prisma__RiskFindingClient<runtime.Types.Result.GetResult<Prisma.$RiskFindingPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    count<T extends RiskFindingCountArgs>(args?: Prisma.Subset<T, RiskFindingCountArgs>): Prisma.PrismaPromise<T extends runtime.Types.Utils.Record<'select', any> ? T['select'] extends true ? number : Prisma.GetScalarType<T['select'], RiskFindingCountAggregateOutputType> : number>;
    aggregate<T extends RiskFindingAggregateArgs>(args: Prisma.Subset<T, RiskFindingAggregateArgs>): Prisma.PrismaPromise<GetRiskFindingAggregateType<T>>;
    groupBy<T extends RiskFindingGroupByArgs, HasSelectOrTake extends Prisma.Or<Prisma.Extends<'skip', Prisma.Keys<T>>, Prisma.Extends<'take', Prisma.Keys<T>>>, OrderByArg extends Prisma.True extends HasSelectOrTake ? {
        orderBy: RiskFindingGroupByArgs['orderBy'];
    } : {
        orderBy?: RiskFindingGroupByArgs['orderBy'];
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
    }[OrderFields]>(args: Prisma.SubsetIntersection<T, RiskFindingGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetRiskFindingGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>;
    readonly fields: RiskFindingFieldRefs;
}
export interface Prisma__RiskFindingClient<T, Null = never, ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise";
    analysis<T extends Prisma.AIAnalysisDefaultArgs<ExtArgs> = {}>(args?: Prisma.Subset<T, Prisma.AIAnalysisDefaultArgs<ExtArgs>>): Prisma.Prisma__AIAnalysisClient<runtime.Types.Result.GetResult<Prisma.$AIAnalysisPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>;
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): runtime.Types.Utils.JsPromise<TResult1 | TResult2>;
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): runtime.Types.Utils.JsPromise<T | TResult>;
    finally(onfinally?: (() => void) | undefined | null): runtime.Types.Utils.JsPromise<T>;
}
export interface RiskFindingFieldRefs {
    readonly id: Prisma.FieldRef<"RiskFinding", 'String'>;
    readonly analysisId: Prisma.FieldRef<"RiskFinding", 'String'>;
    readonly severity: Prisma.FieldRef<"RiskFinding", 'RiskLevel'>;
    readonly title: Prisma.FieldRef<"RiskFinding", 'String'>;
    readonly clause: Prisma.FieldRef<"RiskFinding", 'String'>;
    readonly impact: Prisma.FieldRef<"RiskFinding", 'String'>;
    readonly suggestion: Prisma.FieldRef<"RiskFinding", 'String'>;
    readonly legalRef: Prisma.FieldRef<"RiskFinding", 'String'>;
    readonly estimatedRisk: Prisma.FieldRef<"RiskFinding", 'Decimal'>;
    readonly createdAt: Prisma.FieldRef<"RiskFinding", 'DateTime'>;
}
export type RiskFindingFindUniqueArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.RiskFindingSelect<ExtArgs> | null;
    omit?: Prisma.RiskFindingOmit<ExtArgs> | null;
    include?: Prisma.RiskFindingInclude<ExtArgs> | null;
    where: Prisma.RiskFindingWhereUniqueInput;
};
export type RiskFindingFindUniqueOrThrowArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.RiskFindingSelect<ExtArgs> | null;
    omit?: Prisma.RiskFindingOmit<ExtArgs> | null;
    include?: Prisma.RiskFindingInclude<ExtArgs> | null;
    where: Prisma.RiskFindingWhereUniqueInput;
};
export type RiskFindingFindFirstArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
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
export type RiskFindingFindFirstOrThrowArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
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
export type RiskFindingFindManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
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
export type RiskFindingCreateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.RiskFindingSelect<ExtArgs> | null;
    omit?: Prisma.RiskFindingOmit<ExtArgs> | null;
    include?: Prisma.RiskFindingInclude<ExtArgs> | null;
    data: Prisma.XOR<Prisma.RiskFindingCreateInput, Prisma.RiskFindingUncheckedCreateInput>;
};
export type RiskFindingCreateManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    data: Prisma.RiskFindingCreateManyInput | Prisma.RiskFindingCreateManyInput[];
    skipDuplicates?: boolean;
};
export type RiskFindingCreateManyAndReturnArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.RiskFindingSelectCreateManyAndReturn<ExtArgs> | null;
    omit?: Prisma.RiskFindingOmit<ExtArgs> | null;
    data: Prisma.RiskFindingCreateManyInput | Prisma.RiskFindingCreateManyInput[];
    skipDuplicates?: boolean;
    include?: Prisma.RiskFindingIncludeCreateManyAndReturn<ExtArgs> | null;
};
export type RiskFindingUpdateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.RiskFindingSelect<ExtArgs> | null;
    omit?: Prisma.RiskFindingOmit<ExtArgs> | null;
    include?: Prisma.RiskFindingInclude<ExtArgs> | null;
    data: Prisma.XOR<Prisma.RiskFindingUpdateInput, Prisma.RiskFindingUncheckedUpdateInput>;
    where: Prisma.RiskFindingWhereUniqueInput;
};
export type RiskFindingUpdateManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    data: Prisma.XOR<Prisma.RiskFindingUpdateManyMutationInput, Prisma.RiskFindingUncheckedUpdateManyInput>;
    where?: Prisma.RiskFindingWhereInput;
    limit?: number;
};
export type RiskFindingUpdateManyAndReturnArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.RiskFindingSelectUpdateManyAndReturn<ExtArgs> | null;
    omit?: Prisma.RiskFindingOmit<ExtArgs> | null;
    data: Prisma.XOR<Prisma.RiskFindingUpdateManyMutationInput, Prisma.RiskFindingUncheckedUpdateManyInput>;
    where?: Prisma.RiskFindingWhereInput;
    limit?: number;
    include?: Prisma.RiskFindingIncludeUpdateManyAndReturn<ExtArgs> | null;
};
export type RiskFindingUpsertArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.RiskFindingSelect<ExtArgs> | null;
    omit?: Prisma.RiskFindingOmit<ExtArgs> | null;
    include?: Prisma.RiskFindingInclude<ExtArgs> | null;
    where: Prisma.RiskFindingWhereUniqueInput;
    create: Prisma.XOR<Prisma.RiskFindingCreateInput, Prisma.RiskFindingUncheckedCreateInput>;
    update: Prisma.XOR<Prisma.RiskFindingUpdateInput, Prisma.RiskFindingUncheckedUpdateInput>;
};
export type RiskFindingDeleteArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.RiskFindingSelect<ExtArgs> | null;
    omit?: Prisma.RiskFindingOmit<ExtArgs> | null;
    include?: Prisma.RiskFindingInclude<ExtArgs> | null;
    where: Prisma.RiskFindingWhereUniqueInput;
};
export type RiskFindingDeleteManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.RiskFindingWhereInput;
    limit?: number;
};
export type RiskFindingDefaultArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.RiskFindingSelect<ExtArgs> | null;
    omit?: Prisma.RiskFindingOmit<ExtArgs> | null;
    include?: Prisma.RiskFindingInclude<ExtArgs> | null;
};

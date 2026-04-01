import type * as runtime from "@prisma/client/runtime/client";
import type * as $Enums from "../enums";
import type * as Prisma from "../internal/prismaNamespace";
export type ClauseModel = runtime.Types.Result.DefaultSelection<Prisma.$ClausePayload>;
export type AggregateClause = {
    _count: ClauseCountAggregateOutputType | null;
    _avg: ClauseAvgAggregateOutputType | null;
    _sum: ClauseSumAggregateOutputType | null;
    _min: ClauseMinAggregateOutputType | null;
    _max: ClauseMaxAggregateOutputType | null;
};
export type ClauseAvgAggregateOutputType = {
    estimatedImpact: runtime.Decimal | null;
};
export type ClauseSumAggregateOutputType = {
    estimatedImpact: runtime.Decimal | null;
};
export type ClauseMinAggregateOutputType = {
    id: string | null;
    contractId: string | null;
    type: $Enums.ClauseType | null;
    section: string | null;
    originalText: string | null;
    suggestedText: string | null;
    riskLevel: $Enums.RiskLevel | null;
    riskReason: string | null;
    estimatedImpact: runtime.Decimal | null;
    impactPeriod: string | null;
    isAccepted: boolean | null;
    createdAt: Date | null;
    updatedAt: Date | null;
};
export type ClauseMaxAggregateOutputType = {
    id: string | null;
    contractId: string | null;
    type: $Enums.ClauseType | null;
    section: string | null;
    originalText: string | null;
    suggestedText: string | null;
    riskLevel: $Enums.RiskLevel | null;
    riskReason: string | null;
    estimatedImpact: runtime.Decimal | null;
    impactPeriod: string | null;
    isAccepted: boolean | null;
    createdAt: Date | null;
    updatedAt: Date | null;
};
export type ClauseCountAggregateOutputType = {
    id: number;
    contractId: number;
    type: number;
    section: number;
    originalText: number;
    suggestedText: number;
    riskLevel: number;
    riskReason: number;
    estimatedImpact: number;
    impactPeriod: number;
    isAccepted: number;
    createdAt: number;
    updatedAt: number;
    _all: number;
};
export type ClauseAvgAggregateInputType = {
    estimatedImpact?: true;
};
export type ClauseSumAggregateInputType = {
    estimatedImpact?: true;
};
export type ClauseMinAggregateInputType = {
    id?: true;
    contractId?: true;
    type?: true;
    section?: true;
    originalText?: true;
    suggestedText?: true;
    riskLevel?: true;
    riskReason?: true;
    estimatedImpact?: true;
    impactPeriod?: true;
    isAccepted?: true;
    createdAt?: true;
    updatedAt?: true;
};
export type ClauseMaxAggregateInputType = {
    id?: true;
    contractId?: true;
    type?: true;
    section?: true;
    originalText?: true;
    suggestedText?: true;
    riskLevel?: true;
    riskReason?: true;
    estimatedImpact?: true;
    impactPeriod?: true;
    isAccepted?: true;
    createdAt?: true;
    updatedAt?: true;
};
export type ClauseCountAggregateInputType = {
    id?: true;
    contractId?: true;
    type?: true;
    section?: true;
    originalText?: true;
    suggestedText?: true;
    riskLevel?: true;
    riskReason?: true;
    estimatedImpact?: true;
    impactPeriod?: true;
    isAccepted?: true;
    createdAt?: true;
    updatedAt?: true;
    _all?: true;
};
export type ClauseAggregateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.ClauseWhereInput;
    orderBy?: Prisma.ClauseOrderByWithRelationInput | Prisma.ClauseOrderByWithRelationInput[];
    cursor?: Prisma.ClauseWhereUniqueInput;
    take?: number;
    skip?: number;
    _count?: true | ClauseCountAggregateInputType;
    _avg?: ClauseAvgAggregateInputType;
    _sum?: ClauseSumAggregateInputType;
    _min?: ClauseMinAggregateInputType;
    _max?: ClauseMaxAggregateInputType;
};
export type GetClauseAggregateType<T extends ClauseAggregateArgs> = {
    [P in keyof T & keyof AggregateClause]: P extends '_count' | 'count' ? T[P] extends true ? number : Prisma.GetScalarType<T[P], AggregateClause[P]> : Prisma.GetScalarType<T[P], AggregateClause[P]>;
};
export type ClauseGroupByArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.ClauseWhereInput;
    orderBy?: Prisma.ClauseOrderByWithAggregationInput | Prisma.ClauseOrderByWithAggregationInput[];
    by: Prisma.ClauseScalarFieldEnum[] | Prisma.ClauseScalarFieldEnum;
    having?: Prisma.ClauseScalarWhereWithAggregatesInput;
    take?: number;
    skip?: number;
    _count?: ClauseCountAggregateInputType | true;
    _avg?: ClauseAvgAggregateInputType;
    _sum?: ClauseSumAggregateInputType;
    _min?: ClauseMinAggregateInputType;
    _max?: ClauseMaxAggregateInputType;
};
export type ClauseGroupByOutputType = {
    id: string;
    contractId: string;
    type: $Enums.ClauseType;
    section: string | null;
    originalText: string;
    suggestedText: string | null;
    riskLevel: $Enums.RiskLevel;
    riskReason: string | null;
    estimatedImpact: runtime.Decimal | null;
    impactPeriod: string | null;
    isAccepted: boolean;
    createdAt: Date;
    updatedAt: Date;
    _count: ClauseCountAggregateOutputType | null;
    _avg: ClauseAvgAggregateOutputType | null;
    _sum: ClauseSumAggregateOutputType | null;
    _min: ClauseMinAggregateOutputType | null;
    _max: ClauseMaxAggregateOutputType | null;
};
export type GetClauseGroupByPayload<T extends ClauseGroupByArgs> = Prisma.PrismaPromise<Array<Prisma.PickEnumerable<ClauseGroupByOutputType, T['by']> & {
    [P in ((keyof T) & (keyof ClauseGroupByOutputType))]: P extends '_count' ? T[P] extends boolean ? number : Prisma.GetScalarType<T[P], ClauseGroupByOutputType[P]> : Prisma.GetScalarType<T[P], ClauseGroupByOutputType[P]>;
}>>;
export type ClauseWhereInput = {
    AND?: Prisma.ClauseWhereInput | Prisma.ClauseWhereInput[];
    OR?: Prisma.ClauseWhereInput[];
    NOT?: Prisma.ClauseWhereInput | Prisma.ClauseWhereInput[];
    id?: Prisma.StringFilter<"Clause"> | string;
    contractId?: Prisma.StringFilter<"Clause"> | string;
    type?: Prisma.EnumClauseTypeFilter<"Clause"> | $Enums.ClauseType;
    section?: Prisma.StringNullableFilter<"Clause"> | string | null;
    originalText?: Prisma.StringFilter<"Clause"> | string;
    suggestedText?: Prisma.StringNullableFilter<"Clause"> | string | null;
    riskLevel?: Prisma.EnumRiskLevelFilter<"Clause"> | $Enums.RiskLevel;
    riskReason?: Prisma.StringNullableFilter<"Clause"> | string | null;
    estimatedImpact?: Prisma.DecimalNullableFilter<"Clause"> | runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    impactPeriod?: Prisma.StringNullableFilter<"Clause"> | string | null;
    isAccepted?: Prisma.BoolFilter<"Clause"> | boolean;
    createdAt?: Prisma.DateTimeFilter<"Clause"> | Date | string;
    updatedAt?: Prisma.DateTimeFilter<"Clause"> | Date | string;
    contract?: Prisma.XOR<Prisma.ContractScalarRelationFilter, Prisma.ContractWhereInput>;
};
export type ClauseOrderByWithRelationInput = {
    id?: Prisma.SortOrder;
    contractId?: Prisma.SortOrder;
    type?: Prisma.SortOrder;
    section?: Prisma.SortOrderInput | Prisma.SortOrder;
    originalText?: Prisma.SortOrder;
    suggestedText?: Prisma.SortOrderInput | Prisma.SortOrder;
    riskLevel?: Prisma.SortOrder;
    riskReason?: Prisma.SortOrderInput | Prisma.SortOrder;
    estimatedImpact?: Prisma.SortOrderInput | Prisma.SortOrder;
    impactPeriod?: Prisma.SortOrderInput | Prisma.SortOrder;
    isAccepted?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    updatedAt?: Prisma.SortOrder;
    contract?: Prisma.ContractOrderByWithRelationInput;
};
export type ClauseWhereUniqueInput = Prisma.AtLeast<{
    id?: string;
    AND?: Prisma.ClauseWhereInput | Prisma.ClauseWhereInput[];
    OR?: Prisma.ClauseWhereInput[];
    NOT?: Prisma.ClauseWhereInput | Prisma.ClauseWhereInput[];
    contractId?: Prisma.StringFilter<"Clause"> | string;
    type?: Prisma.EnumClauseTypeFilter<"Clause"> | $Enums.ClauseType;
    section?: Prisma.StringNullableFilter<"Clause"> | string | null;
    originalText?: Prisma.StringFilter<"Clause"> | string;
    suggestedText?: Prisma.StringNullableFilter<"Clause"> | string | null;
    riskLevel?: Prisma.EnumRiskLevelFilter<"Clause"> | $Enums.RiskLevel;
    riskReason?: Prisma.StringNullableFilter<"Clause"> | string | null;
    estimatedImpact?: Prisma.DecimalNullableFilter<"Clause"> | runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    impactPeriod?: Prisma.StringNullableFilter<"Clause"> | string | null;
    isAccepted?: Prisma.BoolFilter<"Clause"> | boolean;
    createdAt?: Prisma.DateTimeFilter<"Clause"> | Date | string;
    updatedAt?: Prisma.DateTimeFilter<"Clause"> | Date | string;
    contract?: Prisma.XOR<Prisma.ContractScalarRelationFilter, Prisma.ContractWhereInput>;
}, "id">;
export type ClauseOrderByWithAggregationInput = {
    id?: Prisma.SortOrder;
    contractId?: Prisma.SortOrder;
    type?: Prisma.SortOrder;
    section?: Prisma.SortOrderInput | Prisma.SortOrder;
    originalText?: Prisma.SortOrder;
    suggestedText?: Prisma.SortOrderInput | Prisma.SortOrder;
    riskLevel?: Prisma.SortOrder;
    riskReason?: Prisma.SortOrderInput | Prisma.SortOrder;
    estimatedImpact?: Prisma.SortOrderInput | Prisma.SortOrder;
    impactPeriod?: Prisma.SortOrderInput | Prisma.SortOrder;
    isAccepted?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    updatedAt?: Prisma.SortOrder;
    _count?: Prisma.ClauseCountOrderByAggregateInput;
    _avg?: Prisma.ClauseAvgOrderByAggregateInput;
    _max?: Prisma.ClauseMaxOrderByAggregateInput;
    _min?: Prisma.ClauseMinOrderByAggregateInput;
    _sum?: Prisma.ClauseSumOrderByAggregateInput;
};
export type ClauseScalarWhereWithAggregatesInput = {
    AND?: Prisma.ClauseScalarWhereWithAggregatesInput | Prisma.ClauseScalarWhereWithAggregatesInput[];
    OR?: Prisma.ClauseScalarWhereWithAggregatesInput[];
    NOT?: Prisma.ClauseScalarWhereWithAggregatesInput | Prisma.ClauseScalarWhereWithAggregatesInput[];
    id?: Prisma.StringWithAggregatesFilter<"Clause"> | string;
    contractId?: Prisma.StringWithAggregatesFilter<"Clause"> | string;
    type?: Prisma.EnumClauseTypeWithAggregatesFilter<"Clause"> | $Enums.ClauseType;
    section?: Prisma.StringNullableWithAggregatesFilter<"Clause"> | string | null;
    originalText?: Prisma.StringWithAggregatesFilter<"Clause"> | string;
    suggestedText?: Prisma.StringNullableWithAggregatesFilter<"Clause"> | string | null;
    riskLevel?: Prisma.EnumRiskLevelWithAggregatesFilter<"Clause"> | $Enums.RiskLevel;
    riskReason?: Prisma.StringNullableWithAggregatesFilter<"Clause"> | string | null;
    estimatedImpact?: Prisma.DecimalNullableWithAggregatesFilter<"Clause"> | runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    impactPeriod?: Prisma.StringNullableWithAggregatesFilter<"Clause"> | string | null;
    isAccepted?: Prisma.BoolWithAggregatesFilter<"Clause"> | boolean;
    createdAt?: Prisma.DateTimeWithAggregatesFilter<"Clause"> | Date | string;
    updatedAt?: Prisma.DateTimeWithAggregatesFilter<"Clause"> | Date | string;
};
export type ClauseCreateInput = {
    id?: string;
    type: $Enums.ClauseType;
    section?: string | null;
    originalText: string;
    suggestedText?: string | null;
    riskLevel?: $Enums.RiskLevel;
    riskReason?: string | null;
    estimatedImpact?: runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    impactPeriod?: string | null;
    isAccepted?: boolean;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    contract: Prisma.ContractCreateNestedOneWithoutClausesInput;
};
export type ClauseUncheckedCreateInput = {
    id?: string;
    contractId: string;
    type: $Enums.ClauseType;
    section?: string | null;
    originalText: string;
    suggestedText?: string | null;
    riskLevel?: $Enums.RiskLevel;
    riskReason?: string | null;
    estimatedImpact?: runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    impactPeriod?: string | null;
    isAccepted?: boolean;
    createdAt?: Date | string;
    updatedAt?: Date | string;
};
export type ClauseUpdateInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    type?: Prisma.EnumClauseTypeFieldUpdateOperationsInput | $Enums.ClauseType;
    section?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    originalText?: Prisma.StringFieldUpdateOperationsInput | string;
    suggestedText?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    riskLevel?: Prisma.EnumRiskLevelFieldUpdateOperationsInput | $Enums.RiskLevel;
    riskReason?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    estimatedImpact?: Prisma.NullableDecimalFieldUpdateOperationsInput | runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    impactPeriod?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    isAccepted?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    contract?: Prisma.ContractUpdateOneRequiredWithoutClausesNestedInput;
};
export type ClauseUncheckedUpdateInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    contractId?: Prisma.StringFieldUpdateOperationsInput | string;
    type?: Prisma.EnumClauseTypeFieldUpdateOperationsInput | $Enums.ClauseType;
    section?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    originalText?: Prisma.StringFieldUpdateOperationsInput | string;
    suggestedText?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    riskLevel?: Prisma.EnumRiskLevelFieldUpdateOperationsInput | $Enums.RiskLevel;
    riskReason?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    estimatedImpact?: Prisma.NullableDecimalFieldUpdateOperationsInput | runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    impactPeriod?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    isAccepted?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type ClauseCreateManyInput = {
    id?: string;
    contractId: string;
    type: $Enums.ClauseType;
    section?: string | null;
    originalText: string;
    suggestedText?: string | null;
    riskLevel?: $Enums.RiskLevel;
    riskReason?: string | null;
    estimatedImpact?: runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    impactPeriod?: string | null;
    isAccepted?: boolean;
    createdAt?: Date | string;
    updatedAt?: Date | string;
};
export type ClauseUpdateManyMutationInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    type?: Prisma.EnumClauseTypeFieldUpdateOperationsInput | $Enums.ClauseType;
    section?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    originalText?: Prisma.StringFieldUpdateOperationsInput | string;
    suggestedText?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    riskLevel?: Prisma.EnumRiskLevelFieldUpdateOperationsInput | $Enums.RiskLevel;
    riskReason?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    estimatedImpact?: Prisma.NullableDecimalFieldUpdateOperationsInput | runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    impactPeriod?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    isAccepted?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type ClauseUncheckedUpdateManyInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    contractId?: Prisma.StringFieldUpdateOperationsInput | string;
    type?: Prisma.EnumClauseTypeFieldUpdateOperationsInput | $Enums.ClauseType;
    section?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    originalText?: Prisma.StringFieldUpdateOperationsInput | string;
    suggestedText?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    riskLevel?: Prisma.EnumRiskLevelFieldUpdateOperationsInput | $Enums.RiskLevel;
    riskReason?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    estimatedImpact?: Prisma.NullableDecimalFieldUpdateOperationsInput | runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    impactPeriod?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    isAccepted?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type ClauseListRelationFilter = {
    every?: Prisma.ClauseWhereInput;
    some?: Prisma.ClauseWhereInput;
    none?: Prisma.ClauseWhereInput;
};
export type ClauseOrderByRelationAggregateInput = {
    _count?: Prisma.SortOrder;
};
export type ClauseCountOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    contractId?: Prisma.SortOrder;
    type?: Prisma.SortOrder;
    section?: Prisma.SortOrder;
    originalText?: Prisma.SortOrder;
    suggestedText?: Prisma.SortOrder;
    riskLevel?: Prisma.SortOrder;
    riskReason?: Prisma.SortOrder;
    estimatedImpact?: Prisma.SortOrder;
    impactPeriod?: Prisma.SortOrder;
    isAccepted?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    updatedAt?: Prisma.SortOrder;
};
export type ClauseAvgOrderByAggregateInput = {
    estimatedImpact?: Prisma.SortOrder;
};
export type ClauseMaxOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    contractId?: Prisma.SortOrder;
    type?: Prisma.SortOrder;
    section?: Prisma.SortOrder;
    originalText?: Prisma.SortOrder;
    suggestedText?: Prisma.SortOrder;
    riskLevel?: Prisma.SortOrder;
    riskReason?: Prisma.SortOrder;
    estimatedImpact?: Prisma.SortOrder;
    impactPeriod?: Prisma.SortOrder;
    isAccepted?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    updatedAt?: Prisma.SortOrder;
};
export type ClauseMinOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    contractId?: Prisma.SortOrder;
    type?: Prisma.SortOrder;
    section?: Prisma.SortOrder;
    originalText?: Prisma.SortOrder;
    suggestedText?: Prisma.SortOrder;
    riskLevel?: Prisma.SortOrder;
    riskReason?: Prisma.SortOrder;
    estimatedImpact?: Prisma.SortOrder;
    impactPeriod?: Prisma.SortOrder;
    isAccepted?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    updatedAt?: Prisma.SortOrder;
};
export type ClauseSumOrderByAggregateInput = {
    estimatedImpact?: Prisma.SortOrder;
};
export type ClauseCreateNestedManyWithoutContractInput = {
    create?: Prisma.XOR<Prisma.ClauseCreateWithoutContractInput, Prisma.ClauseUncheckedCreateWithoutContractInput> | Prisma.ClauseCreateWithoutContractInput[] | Prisma.ClauseUncheckedCreateWithoutContractInput[];
    connectOrCreate?: Prisma.ClauseCreateOrConnectWithoutContractInput | Prisma.ClauseCreateOrConnectWithoutContractInput[];
    createMany?: Prisma.ClauseCreateManyContractInputEnvelope;
    connect?: Prisma.ClauseWhereUniqueInput | Prisma.ClauseWhereUniqueInput[];
};
export type ClauseUncheckedCreateNestedManyWithoutContractInput = {
    create?: Prisma.XOR<Prisma.ClauseCreateWithoutContractInput, Prisma.ClauseUncheckedCreateWithoutContractInput> | Prisma.ClauseCreateWithoutContractInput[] | Prisma.ClauseUncheckedCreateWithoutContractInput[];
    connectOrCreate?: Prisma.ClauseCreateOrConnectWithoutContractInput | Prisma.ClauseCreateOrConnectWithoutContractInput[];
    createMany?: Prisma.ClauseCreateManyContractInputEnvelope;
    connect?: Prisma.ClauseWhereUniqueInput | Prisma.ClauseWhereUniqueInput[];
};
export type ClauseUpdateManyWithoutContractNestedInput = {
    create?: Prisma.XOR<Prisma.ClauseCreateWithoutContractInput, Prisma.ClauseUncheckedCreateWithoutContractInput> | Prisma.ClauseCreateWithoutContractInput[] | Prisma.ClauseUncheckedCreateWithoutContractInput[];
    connectOrCreate?: Prisma.ClauseCreateOrConnectWithoutContractInput | Prisma.ClauseCreateOrConnectWithoutContractInput[];
    upsert?: Prisma.ClauseUpsertWithWhereUniqueWithoutContractInput | Prisma.ClauseUpsertWithWhereUniqueWithoutContractInput[];
    createMany?: Prisma.ClauseCreateManyContractInputEnvelope;
    set?: Prisma.ClauseWhereUniqueInput | Prisma.ClauseWhereUniqueInput[];
    disconnect?: Prisma.ClauseWhereUniqueInput | Prisma.ClauseWhereUniqueInput[];
    delete?: Prisma.ClauseWhereUniqueInput | Prisma.ClauseWhereUniqueInput[];
    connect?: Prisma.ClauseWhereUniqueInput | Prisma.ClauseWhereUniqueInput[];
    update?: Prisma.ClauseUpdateWithWhereUniqueWithoutContractInput | Prisma.ClauseUpdateWithWhereUniqueWithoutContractInput[];
    updateMany?: Prisma.ClauseUpdateManyWithWhereWithoutContractInput | Prisma.ClauseUpdateManyWithWhereWithoutContractInput[];
    deleteMany?: Prisma.ClauseScalarWhereInput | Prisma.ClauseScalarWhereInput[];
};
export type ClauseUncheckedUpdateManyWithoutContractNestedInput = {
    create?: Prisma.XOR<Prisma.ClauseCreateWithoutContractInput, Prisma.ClauseUncheckedCreateWithoutContractInput> | Prisma.ClauseCreateWithoutContractInput[] | Prisma.ClauseUncheckedCreateWithoutContractInput[];
    connectOrCreate?: Prisma.ClauseCreateOrConnectWithoutContractInput | Prisma.ClauseCreateOrConnectWithoutContractInput[];
    upsert?: Prisma.ClauseUpsertWithWhereUniqueWithoutContractInput | Prisma.ClauseUpsertWithWhereUniqueWithoutContractInput[];
    createMany?: Prisma.ClauseCreateManyContractInputEnvelope;
    set?: Prisma.ClauseWhereUniqueInput | Prisma.ClauseWhereUniqueInput[];
    disconnect?: Prisma.ClauseWhereUniqueInput | Prisma.ClauseWhereUniqueInput[];
    delete?: Prisma.ClauseWhereUniqueInput | Prisma.ClauseWhereUniqueInput[];
    connect?: Prisma.ClauseWhereUniqueInput | Prisma.ClauseWhereUniqueInput[];
    update?: Prisma.ClauseUpdateWithWhereUniqueWithoutContractInput | Prisma.ClauseUpdateWithWhereUniqueWithoutContractInput[];
    updateMany?: Prisma.ClauseUpdateManyWithWhereWithoutContractInput | Prisma.ClauseUpdateManyWithWhereWithoutContractInput[];
    deleteMany?: Prisma.ClauseScalarWhereInput | Prisma.ClauseScalarWhereInput[];
};
export type EnumClauseTypeFieldUpdateOperationsInput = {
    set?: $Enums.ClauseType;
};
export type EnumRiskLevelFieldUpdateOperationsInput = {
    set?: $Enums.RiskLevel;
};
export type ClauseCreateWithoutContractInput = {
    id?: string;
    type: $Enums.ClauseType;
    section?: string | null;
    originalText: string;
    suggestedText?: string | null;
    riskLevel?: $Enums.RiskLevel;
    riskReason?: string | null;
    estimatedImpact?: runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    impactPeriod?: string | null;
    isAccepted?: boolean;
    createdAt?: Date | string;
    updatedAt?: Date | string;
};
export type ClauseUncheckedCreateWithoutContractInput = {
    id?: string;
    type: $Enums.ClauseType;
    section?: string | null;
    originalText: string;
    suggestedText?: string | null;
    riskLevel?: $Enums.RiskLevel;
    riskReason?: string | null;
    estimatedImpact?: runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    impactPeriod?: string | null;
    isAccepted?: boolean;
    createdAt?: Date | string;
    updatedAt?: Date | string;
};
export type ClauseCreateOrConnectWithoutContractInput = {
    where: Prisma.ClauseWhereUniqueInput;
    create: Prisma.XOR<Prisma.ClauseCreateWithoutContractInput, Prisma.ClauseUncheckedCreateWithoutContractInput>;
};
export type ClauseCreateManyContractInputEnvelope = {
    data: Prisma.ClauseCreateManyContractInput | Prisma.ClauseCreateManyContractInput[];
    skipDuplicates?: boolean;
};
export type ClauseUpsertWithWhereUniqueWithoutContractInput = {
    where: Prisma.ClauseWhereUniqueInput;
    update: Prisma.XOR<Prisma.ClauseUpdateWithoutContractInput, Prisma.ClauseUncheckedUpdateWithoutContractInput>;
    create: Prisma.XOR<Prisma.ClauseCreateWithoutContractInput, Prisma.ClauseUncheckedCreateWithoutContractInput>;
};
export type ClauseUpdateWithWhereUniqueWithoutContractInput = {
    where: Prisma.ClauseWhereUniqueInput;
    data: Prisma.XOR<Prisma.ClauseUpdateWithoutContractInput, Prisma.ClauseUncheckedUpdateWithoutContractInput>;
};
export type ClauseUpdateManyWithWhereWithoutContractInput = {
    where: Prisma.ClauseScalarWhereInput;
    data: Prisma.XOR<Prisma.ClauseUpdateManyMutationInput, Prisma.ClauseUncheckedUpdateManyWithoutContractInput>;
};
export type ClauseScalarWhereInput = {
    AND?: Prisma.ClauseScalarWhereInput | Prisma.ClauseScalarWhereInput[];
    OR?: Prisma.ClauseScalarWhereInput[];
    NOT?: Prisma.ClauseScalarWhereInput | Prisma.ClauseScalarWhereInput[];
    id?: Prisma.StringFilter<"Clause"> | string;
    contractId?: Prisma.StringFilter<"Clause"> | string;
    type?: Prisma.EnumClauseTypeFilter<"Clause"> | $Enums.ClauseType;
    section?: Prisma.StringNullableFilter<"Clause"> | string | null;
    originalText?: Prisma.StringFilter<"Clause"> | string;
    suggestedText?: Prisma.StringNullableFilter<"Clause"> | string | null;
    riskLevel?: Prisma.EnumRiskLevelFilter<"Clause"> | $Enums.RiskLevel;
    riskReason?: Prisma.StringNullableFilter<"Clause"> | string | null;
    estimatedImpact?: Prisma.DecimalNullableFilter<"Clause"> | runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    impactPeriod?: Prisma.StringNullableFilter<"Clause"> | string | null;
    isAccepted?: Prisma.BoolFilter<"Clause"> | boolean;
    createdAt?: Prisma.DateTimeFilter<"Clause"> | Date | string;
    updatedAt?: Prisma.DateTimeFilter<"Clause"> | Date | string;
};
export type ClauseCreateManyContractInput = {
    id?: string;
    type: $Enums.ClauseType;
    section?: string | null;
    originalText: string;
    suggestedText?: string | null;
    riskLevel?: $Enums.RiskLevel;
    riskReason?: string | null;
    estimatedImpact?: runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    impactPeriod?: string | null;
    isAccepted?: boolean;
    createdAt?: Date | string;
    updatedAt?: Date | string;
};
export type ClauseUpdateWithoutContractInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    type?: Prisma.EnumClauseTypeFieldUpdateOperationsInput | $Enums.ClauseType;
    section?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    originalText?: Prisma.StringFieldUpdateOperationsInput | string;
    suggestedText?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    riskLevel?: Prisma.EnumRiskLevelFieldUpdateOperationsInput | $Enums.RiskLevel;
    riskReason?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    estimatedImpact?: Prisma.NullableDecimalFieldUpdateOperationsInput | runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    impactPeriod?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    isAccepted?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type ClauseUncheckedUpdateWithoutContractInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    type?: Prisma.EnumClauseTypeFieldUpdateOperationsInput | $Enums.ClauseType;
    section?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    originalText?: Prisma.StringFieldUpdateOperationsInput | string;
    suggestedText?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    riskLevel?: Prisma.EnumRiskLevelFieldUpdateOperationsInput | $Enums.RiskLevel;
    riskReason?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    estimatedImpact?: Prisma.NullableDecimalFieldUpdateOperationsInput | runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    impactPeriod?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    isAccepted?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type ClauseUncheckedUpdateManyWithoutContractInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    type?: Prisma.EnumClauseTypeFieldUpdateOperationsInput | $Enums.ClauseType;
    section?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    originalText?: Prisma.StringFieldUpdateOperationsInput | string;
    suggestedText?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    riskLevel?: Prisma.EnumRiskLevelFieldUpdateOperationsInput | $Enums.RiskLevel;
    riskReason?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    estimatedImpact?: Prisma.NullableDecimalFieldUpdateOperationsInput | runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    impactPeriod?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    isAccepted?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type ClauseSelect<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    contractId?: boolean;
    type?: boolean;
    section?: boolean;
    originalText?: boolean;
    suggestedText?: boolean;
    riskLevel?: boolean;
    riskReason?: boolean;
    estimatedImpact?: boolean;
    impactPeriod?: boolean;
    isAccepted?: boolean;
    createdAt?: boolean;
    updatedAt?: boolean;
    contract?: boolean | Prisma.ContractDefaultArgs<ExtArgs>;
}, ExtArgs["result"]["clause"]>;
export type ClauseSelectCreateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    contractId?: boolean;
    type?: boolean;
    section?: boolean;
    originalText?: boolean;
    suggestedText?: boolean;
    riskLevel?: boolean;
    riskReason?: boolean;
    estimatedImpact?: boolean;
    impactPeriod?: boolean;
    isAccepted?: boolean;
    createdAt?: boolean;
    updatedAt?: boolean;
    contract?: boolean | Prisma.ContractDefaultArgs<ExtArgs>;
}, ExtArgs["result"]["clause"]>;
export type ClauseSelectUpdateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    contractId?: boolean;
    type?: boolean;
    section?: boolean;
    originalText?: boolean;
    suggestedText?: boolean;
    riskLevel?: boolean;
    riskReason?: boolean;
    estimatedImpact?: boolean;
    impactPeriod?: boolean;
    isAccepted?: boolean;
    createdAt?: boolean;
    updatedAt?: boolean;
    contract?: boolean | Prisma.ContractDefaultArgs<ExtArgs>;
}, ExtArgs["result"]["clause"]>;
export type ClauseSelectScalar = {
    id?: boolean;
    contractId?: boolean;
    type?: boolean;
    section?: boolean;
    originalText?: boolean;
    suggestedText?: boolean;
    riskLevel?: boolean;
    riskReason?: boolean;
    estimatedImpact?: boolean;
    impactPeriod?: boolean;
    isAccepted?: boolean;
    createdAt?: boolean;
    updatedAt?: boolean;
};
export type ClauseOmit<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetOmit<"id" | "contractId" | "type" | "section" | "originalText" | "suggestedText" | "riskLevel" | "riskReason" | "estimatedImpact" | "impactPeriod" | "isAccepted" | "createdAt" | "updatedAt", ExtArgs["result"]["clause"]>;
export type ClauseInclude<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    contract?: boolean | Prisma.ContractDefaultArgs<ExtArgs>;
};
export type ClauseIncludeCreateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    contract?: boolean | Prisma.ContractDefaultArgs<ExtArgs>;
};
export type ClauseIncludeUpdateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    contract?: boolean | Prisma.ContractDefaultArgs<ExtArgs>;
};
export type $ClausePayload<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    name: "Clause";
    objects: {
        contract: Prisma.$ContractPayload<ExtArgs>;
    };
    scalars: runtime.Types.Extensions.GetPayloadResult<{
        id: string;
        contractId: string;
        type: $Enums.ClauseType;
        section: string | null;
        originalText: string;
        suggestedText: string | null;
        riskLevel: $Enums.RiskLevel;
        riskReason: string | null;
        estimatedImpact: runtime.Decimal | null;
        impactPeriod: string | null;
        isAccepted: boolean;
        createdAt: Date;
        updatedAt: Date;
    }, ExtArgs["result"]["clause"]>;
    composites: {};
};
export type ClauseGetPayload<S extends boolean | null | undefined | ClauseDefaultArgs> = runtime.Types.Result.GetResult<Prisma.$ClausePayload, S>;
export type ClauseCountArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = Omit<ClauseFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
    select?: ClauseCountAggregateInputType | true;
};
export interface ClauseDelegate<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: {
        types: Prisma.TypeMap<ExtArgs>['model']['Clause'];
        meta: {
            name: 'Clause';
        };
    };
    findUnique<T extends ClauseFindUniqueArgs>(args: Prisma.SelectSubset<T, ClauseFindUniqueArgs<ExtArgs>>): Prisma.Prisma__ClauseClient<runtime.Types.Result.GetResult<Prisma.$ClausePayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>;
    findUniqueOrThrow<T extends ClauseFindUniqueOrThrowArgs>(args: Prisma.SelectSubset<T, ClauseFindUniqueOrThrowArgs<ExtArgs>>): Prisma.Prisma__ClauseClient<runtime.Types.Result.GetResult<Prisma.$ClausePayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    findFirst<T extends ClauseFindFirstArgs>(args?: Prisma.SelectSubset<T, ClauseFindFirstArgs<ExtArgs>>): Prisma.Prisma__ClauseClient<runtime.Types.Result.GetResult<Prisma.$ClausePayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>;
    findFirstOrThrow<T extends ClauseFindFirstOrThrowArgs>(args?: Prisma.SelectSubset<T, ClauseFindFirstOrThrowArgs<ExtArgs>>): Prisma.Prisma__ClauseClient<runtime.Types.Result.GetResult<Prisma.$ClausePayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    findMany<T extends ClauseFindManyArgs>(args?: Prisma.SelectSubset<T, ClauseFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$ClausePayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>;
    create<T extends ClauseCreateArgs>(args: Prisma.SelectSubset<T, ClauseCreateArgs<ExtArgs>>): Prisma.Prisma__ClauseClient<runtime.Types.Result.GetResult<Prisma.$ClausePayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    createMany<T extends ClauseCreateManyArgs>(args?: Prisma.SelectSubset<T, ClauseCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    createManyAndReturn<T extends ClauseCreateManyAndReturnArgs>(args?: Prisma.SelectSubset<T, ClauseCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$ClausePayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>;
    delete<T extends ClauseDeleteArgs>(args: Prisma.SelectSubset<T, ClauseDeleteArgs<ExtArgs>>): Prisma.Prisma__ClauseClient<runtime.Types.Result.GetResult<Prisma.$ClausePayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    update<T extends ClauseUpdateArgs>(args: Prisma.SelectSubset<T, ClauseUpdateArgs<ExtArgs>>): Prisma.Prisma__ClauseClient<runtime.Types.Result.GetResult<Prisma.$ClausePayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    deleteMany<T extends ClauseDeleteManyArgs>(args?: Prisma.SelectSubset<T, ClauseDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    updateMany<T extends ClauseUpdateManyArgs>(args: Prisma.SelectSubset<T, ClauseUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    updateManyAndReturn<T extends ClauseUpdateManyAndReturnArgs>(args: Prisma.SelectSubset<T, ClauseUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$ClausePayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>;
    upsert<T extends ClauseUpsertArgs>(args: Prisma.SelectSubset<T, ClauseUpsertArgs<ExtArgs>>): Prisma.Prisma__ClauseClient<runtime.Types.Result.GetResult<Prisma.$ClausePayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    count<T extends ClauseCountArgs>(args?: Prisma.Subset<T, ClauseCountArgs>): Prisma.PrismaPromise<T extends runtime.Types.Utils.Record<'select', any> ? T['select'] extends true ? number : Prisma.GetScalarType<T['select'], ClauseCountAggregateOutputType> : number>;
    aggregate<T extends ClauseAggregateArgs>(args: Prisma.Subset<T, ClauseAggregateArgs>): Prisma.PrismaPromise<GetClauseAggregateType<T>>;
    groupBy<T extends ClauseGroupByArgs, HasSelectOrTake extends Prisma.Or<Prisma.Extends<'skip', Prisma.Keys<T>>, Prisma.Extends<'take', Prisma.Keys<T>>>, OrderByArg extends Prisma.True extends HasSelectOrTake ? {
        orderBy: ClauseGroupByArgs['orderBy'];
    } : {
        orderBy?: ClauseGroupByArgs['orderBy'];
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
    }[OrderFields]>(args: Prisma.SubsetIntersection<T, ClauseGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetClauseGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>;
    readonly fields: ClauseFieldRefs;
}
export interface Prisma__ClauseClient<T, Null = never, ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise";
    contract<T extends Prisma.ContractDefaultArgs<ExtArgs> = {}>(args?: Prisma.Subset<T, Prisma.ContractDefaultArgs<ExtArgs>>): Prisma.Prisma__ContractClient<runtime.Types.Result.GetResult<Prisma.$ContractPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>;
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): runtime.Types.Utils.JsPromise<TResult1 | TResult2>;
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): runtime.Types.Utils.JsPromise<T | TResult>;
    finally(onfinally?: (() => void) | undefined | null): runtime.Types.Utils.JsPromise<T>;
}
export interface ClauseFieldRefs {
    readonly id: Prisma.FieldRef<"Clause", 'String'>;
    readonly contractId: Prisma.FieldRef<"Clause", 'String'>;
    readonly type: Prisma.FieldRef<"Clause", 'ClauseType'>;
    readonly section: Prisma.FieldRef<"Clause", 'String'>;
    readonly originalText: Prisma.FieldRef<"Clause", 'String'>;
    readonly suggestedText: Prisma.FieldRef<"Clause", 'String'>;
    readonly riskLevel: Prisma.FieldRef<"Clause", 'RiskLevel'>;
    readonly riskReason: Prisma.FieldRef<"Clause", 'String'>;
    readonly estimatedImpact: Prisma.FieldRef<"Clause", 'Decimal'>;
    readonly impactPeriod: Prisma.FieldRef<"Clause", 'String'>;
    readonly isAccepted: Prisma.FieldRef<"Clause", 'Boolean'>;
    readonly createdAt: Prisma.FieldRef<"Clause", 'DateTime'>;
    readonly updatedAt: Prisma.FieldRef<"Clause", 'DateTime'>;
}
export type ClauseFindUniqueArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.ClauseSelect<ExtArgs> | null;
    omit?: Prisma.ClauseOmit<ExtArgs> | null;
    include?: Prisma.ClauseInclude<ExtArgs> | null;
    where: Prisma.ClauseWhereUniqueInput;
};
export type ClauseFindUniqueOrThrowArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.ClauseSelect<ExtArgs> | null;
    omit?: Prisma.ClauseOmit<ExtArgs> | null;
    include?: Prisma.ClauseInclude<ExtArgs> | null;
    where: Prisma.ClauseWhereUniqueInput;
};
export type ClauseFindFirstArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.ClauseSelect<ExtArgs> | null;
    omit?: Prisma.ClauseOmit<ExtArgs> | null;
    include?: Prisma.ClauseInclude<ExtArgs> | null;
    where?: Prisma.ClauseWhereInput;
    orderBy?: Prisma.ClauseOrderByWithRelationInput | Prisma.ClauseOrderByWithRelationInput[];
    cursor?: Prisma.ClauseWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.ClauseScalarFieldEnum | Prisma.ClauseScalarFieldEnum[];
};
export type ClauseFindFirstOrThrowArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.ClauseSelect<ExtArgs> | null;
    omit?: Prisma.ClauseOmit<ExtArgs> | null;
    include?: Prisma.ClauseInclude<ExtArgs> | null;
    where?: Prisma.ClauseWhereInput;
    orderBy?: Prisma.ClauseOrderByWithRelationInput | Prisma.ClauseOrderByWithRelationInput[];
    cursor?: Prisma.ClauseWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.ClauseScalarFieldEnum | Prisma.ClauseScalarFieldEnum[];
};
export type ClauseFindManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.ClauseSelect<ExtArgs> | null;
    omit?: Prisma.ClauseOmit<ExtArgs> | null;
    include?: Prisma.ClauseInclude<ExtArgs> | null;
    where?: Prisma.ClauseWhereInput;
    orderBy?: Prisma.ClauseOrderByWithRelationInput | Prisma.ClauseOrderByWithRelationInput[];
    cursor?: Prisma.ClauseWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.ClauseScalarFieldEnum | Prisma.ClauseScalarFieldEnum[];
};
export type ClauseCreateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.ClauseSelect<ExtArgs> | null;
    omit?: Prisma.ClauseOmit<ExtArgs> | null;
    include?: Prisma.ClauseInclude<ExtArgs> | null;
    data: Prisma.XOR<Prisma.ClauseCreateInput, Prisma.ClauseUncheckedCreateInput>;
};
export type ClauseCreateManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    data: Prisma.ClauseCreateManyInput | Prisma.ClauseCreateManyInput[];
    skipDuplicates?: boolean;
};
export type ClauseCreateManyAndReturnArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.ClauseSelectCreateManyAndReturn<ExtArgs> | null;
    omit?: Prisma.ClauseOmit<ExtArgs> | null;
    data: Prisma.ClauseCreateManyInput | Prisma.ClauseCreateManyInput[];
    skipDuplicates?: boolean;
    include?: Prisma.ClauseIncludeCreateManyAndReturn<ExtArgs> | null;
};
export type ClauseUpdateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.ClauseSelect<ExtArgs> | null;
    omit?: Prisma.ClauseOmit<ExtArgs> | null;
    include?: Prisma.ClauseInclude<ExtArgs> | null;
    data: Prisma.XOR<Prisma.ClauseUpdateInput, Prisma.ClauseUncheckedUpdateInput>;
    where: Prisma.ClauseWhereUniqueInput;
};
export type ClauseUpdateManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    data: Prisma.XOR<Prisma.ClauseUpdateManyMutationInput, Prisma.ClauseUncheckedUpdateManyInput>;
    where?: Prisma.ClauseWhereInput;
    limit?: number;
};
export type ClauseUpdateManyAndReturnArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.ClauseSelectUpdateManyAndReturn<ExtArgs> | null;
    omit?: Prisma.ClauseOmit<ExtArgs> | null;
    data: Prisma.XOR<Prisma.ClauseUpdateManyMutationInput, Prisma.ClauseUncheckedUpdateManyInput>;
    where?: Prisma.ClauseWhereInput;
    limit?: number;
    include?: Prisma.ClauseIncludeUpdateManyAndReturn<ExtArgs> | null;
};
export type ClauseUpsertArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.ClauseSelect<ExtArgs> | null;
    omit?: Prisma.ClauseOmit<ExtArgs> | null;
    include?: Prisma.ClauseInclude<ExtArgs> | null;
    where: Prisma.ClauseWhereUniqueInput;
    create: Prisma.XOR<Prisma.ClauseCreateInput, Prisma.ClauseUncheckedCreateInput>;
    update: Prisma.XOR<Prisma.ClauseUpdateInput, Prisma.ClauseUncheckedUpdateInput>;
};
export type ClauseDeleteArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.ClauseSelect<ExtArgs> | null;
    omit?: Prisma.ClauseOmit<ExtArgs> | null;
    include?: Prisma.ClauseInclude<ExtArgs> | null;
    where: Prisma.ClauseWhereUniqueInput;
};
export type ClauseDeleteManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.ClauseWhereInput;
    limit?: number;
};
export type ClauseDefaultArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.ClauseSelect<ExtArgs> | null;
    omit?: Prisma.ClauseOmit<ExtArgs> | null;
    include?: Prisma.ClauseInclude<ExtArgs> | null;
};

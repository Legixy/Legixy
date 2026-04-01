import type * as runtime from "@prisma/client/runtime/client";
import type * as $Enums from "../enums";
import type * as Prisma from "../internal/prismaNamespace";
export type TemplateModel = runtime.Types.Result.DefaultSelection<Prisma.$TemplatePayload>;
export type AggregateTemplate = {
    _count: TemplateCountAggregateOutputType | null;
    _avg: TemplateAvgAggregateOutputType | null;
    _sum: TemplateSumAggregateOutputType | null;
    _min: TemplateMinAggregateOutputType | null;
    _max: TemplateMaxAggregateOutputType | null;
};
export type TemplateAvgAggregateOutputType = {
    riskScore: number | null;
    usageCount: number | null;
};
export type TemplateSumAggregateOutputType = {
    riskScore: number | null;
    usageCount: number | null;
};
export type TemplateMinAggregateOutputType = {
    id: string | null;
    tenantId: string | null;
    category: $Enums.TemplateCategory | null;
    name: string | null;
    description: string | null;
    riskScore: number | null;
    isSystem: boolean | null;
    usageCount: number | null;
    socialProof: string | null;
    createdAt: Date | null;
    updatedAt: Date | null;
};
export type TemplateMaxAggregateOutputType = {
    id: string | null;
    tenantId: string | null;
    category: $Enums.TemplateCategory | null;
    name: string | null;
    description: string | null;
    riskScore: number | null;
    isSystem: boolean | null;
    usageCount: number | null;
    socialProof: string | null;
    createdAt: Date | null;
    updatedAt: Date | null;
};
export type TemplateCountAggregateOutputType = {
    id: number;
    tenantId: number;
    category: number;
    name: number;
    description: number;
    riskScore: number;
    clauseBlocks: number;
    isSystem: number;
    usageCount: number;
    socialProof: number;
    createdAt: number;
    updatedAt: number;
    _all: number;
};
export type TemplateAvgAggregateInputType = {
    riskScore?: true;
    usageCount?: true;
};
export type TemplateSumAggregateInputType = {
    riskScore?: true;
    usageCount?: true;
};
export type TemplateMinAggregateInputType = {
    id?: true;
    tenantId?: true;
    category?: true;
    name?: true;
    description?: true;
    riskScore?: true;
    isSystem?: true;
    usageCount?: true;
    socialProof?: true;
    createdAt?: true;
    updatedAt?: true;
};
export type TemplateMaxAggregateInputType = {
    id?: true;
    tenantId?: true;
    category?: true;
    name?: true;
    description?: true;
    riskScore?: true;
    isSystem?: true;
    usageCount?: true;
    socialProof?: true;
    createdAt?: true;
    updatedAt?: true;
};
export type TemplateCountAggregateInputType = {
    id?: true;
    tenantId?: true;
    category?: true;
    name?: true;
    description?: true;
    riskScore?: true;
    clauseBlocks?: true;
    isSystem?: true;
    usageCount?: true;
    socialProof?: true;
    createdAt?: true;
    updatedAt?: true;
    _all?: true;
};
export type TemplateAggregateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.TemplateWhereInput;
    orderBy?: Prisma.TemplateOrderByWithRelationInput | Prisma.TemplateOrderByWithRelationInput[];
    cursor?: Prisma.TemplateWhereUniqueInput;
    take?: number;
    skip?: number;
    _count?: true | TemplateCountAggregateInputType;
    _avg?: TemplateAvgAggregateInputType;
    _sum?: TemplateSumAggregateInputType;
    _min?: TemplateMinAggregateInputType;
    _max?: TemplateMaxAggregateInputType;
};
export type GetTemplateAggregateType<T extends TemplateAggregateArgs> = {
    [P in keyof T & keyof AggregateTemplate]: P extends '_count' | 'count' ? T[P] extends true ? number : Prisma.GetScalarType<T[P], AggregateTemplate[P]> : Prisma.GetScalarType<T[P], AggregateTemplate[P]>;
};
export type TemplateGroupByArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.TemplateWhereInput;
    orderBy?: Prisma.TemplateOrderByWithAggregationInput | Prisma.TemplateOrderByWithAggregationInput[];
    by: Prisma.TemplateScalarFieldEnum[] | Prisma.TemplateScalarFieldEnum;
    having?: Prisma.TemplateScalarWhereWithAggregatesInput;
    take?: number;
    skip?: number;
    _count?: TemplateCountAggregateInputType | true;
    _avg?: TemplateAvgAggregateInputType;
    _sum?: TemplateSumAggregateInputType;
    _min?: TemplateMinAggregateInputType;
    _max?: TemplateMaxAggregateInputType;
};
export type TemplateGroupByOutputType = {
    id: string;
    tenantId: string | null;
    category: $Enums.TemplateCategory;
    name: string;
    description: string | null;
    riskScore: number;
    clauseBlocks: runtime.JsonValue;
    isSystem: boolean;
    usageCount: number;
    socialProof: string | null;
    createdAt: Date;
    updatedAt: Date;
    _count: TemplateCountAggregateOutputType | null;
    _avg: TemplateAvgAggregateOutputType | null;
    _sum: TemplateSumAggregateOutputType | null;
    _min: TemplateMinAggregateOutputType | null;
    _max: TemplateMaxAggregateOutputType | null;
};
export type GetTemplateGroupByPayload<T extends TemplateGroupByArgs> = Prisma.PrismaPromise<Array<Prisma.PickEnumerable<TemplateGroupByOutputType, T['by']> & {
    [P in ((keyof T) & (keyof TemplateGroupByOutputType))]: P extends '_count' ? T[P] extends boolean ? number : Prisma.GetScalarType<T[P], TemplateGroupByOutputType[P]> : Prisma.GetScalarType<T[P], TemplateGroupByOutputType[P]>;
}>>;
export type TemplateWhereInput = {
    AND?: Prisma.TemplateWhereInput | Prisma.TemplateWhereInput[];
    OR?: Prisma.TemplateWhereInput[];
    NOT?: Prisma.TemplateWhereInput | Prisma.TemplateWhereInput[];
    id?: Prisma.StringFilter<"Template"> | string;
    tenantId?: Prisma.StringNullableFilter<"Template"> | string | null;
    category?: Prisma.EnumTemplateCategoryFilter<"Template"> | $Enums.TemplateCategory;
    name?: Prisma.StringFilter<"Template"> | string;
    description?: Prisma.StringNullableFilter<"Template"> | string | null;
    riskScore?: Prisma.IntFilter<"Template"> | number;
    clauseBlocks?: Prisma.JsonFilter<"Template">;
    isSystem?: Prisma.BoolFilter<"Template"> | boolean;
    usageCount?: Prisma.IntFilter<"Template"> | number;
    socialProof?: Prisma.StringNullableFilter<"Template"> | string | null;
    createdAt?: Prisma.DateTimeFilter<"Template"> | Date | string;
    updatedAt?: Prisma.DateTimeFilter<"Template"> | Date | string;
    tenant?: Prisma.XOR<Prisma.TenantNullableScalarRelationFilter, Prisma.TenantWhereInput> | null;
    contracts?: Prisma.ContractListRelationFilter;
};
export type TemplateOrderByWithRelationInput = {
    id?: Prisma.SortOrder;
    tenantId?: Prisma.SortOrderInput | Prisma.SortOrder;
    category?: Prisma.SortOrder;
    name?: Prisma.SortOrder;
    description?: Prisma.SortOrderInput | Prisma.SortOrder;
    riskScore?: Prisma.SortOrder;
    clauseBlocks?: Prisma.SortOrder;
    isSystem?: Prisma.SortOrder;
    usageCount?: Prisma.SortOrder;
    socialProof?: Prisma.SortOrderInput | Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    updatedAt?: Prisma.SortOrder;
    tenant?: Prisma.TenantOrderByWithRelationInput;
    contracts?: Prisma.ContractOrderByRelationAggregateInput;
};
export type TemplateWhereUniqueInput = Prisma.AtLeast<{
    id?: string;
    AND?: Prisma.TemplateWhereInput | Prisma.TemplateWhereInput[];
    OR?: Prisma.TemplateWhereInput[];
    NOT?: Prisma.TemplateWhereInput | Prisma.TemplateWhereInput[];
    tenantId?: Prisma.StringNullableFilter<"Template"> | string | null;
    category?: Prisma.EnumTemplateCategoryFilter<"Template"> | $Enums.TemplateCategory;
    name?: Prisma.StringFilter<"Template"> | string;
    description?: Prisma.StringNullableFilter<"Template"> | string | null;
    riskScore?: Prisma.IntFilter<"Template"> | number;
    clauseBlocks?: Prisma.JsonFilter<"Template">;
    isSystem?: Prisma.BoolFilter<"Template"> | boolean;
    usageCount?: Prisma.IntFilter<"Template"> | number;
    socialProof?: Prisma.StringNullableFilter<"Template"> | string | null;
    createdAt?: Prisma.DateTimeFilter<"Template"> | Date | string;
    updatedAt?: Prisma.DateTimeFilter<"Template"> | Date | string;
    tenant?: Prisma.XOR<Prisma.TenantNullableScalarRelationFilter, Prisma.TenantWhereInput> | null;
    contracts?: Prisma.ContractListRelationFilter;
}, "id">;
export type TemplateOrderByWithAggregationInput = {
    id?: Prisma.SortOrder;
    tenantId?: Prisma.SortOrderInput | Prisma.SortOrder;
    category?: Prisma.SortOrder;
    name?: Prisma.SortOrder;
    description?: Prisma.SortOrderInput | Prisma.SortOrder;
    riskScore?: Prisma.SortOrder;
    clauseBlocks?: Prisma.SortOrder;
    isSystem?: Prisma.SortOrder;
    usageCount?: Prisma.SortOrder;
    socialProof?: Prisma.SortOrderInput | Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    updatedAt?: Prisma.SortOrder;
    _count?: Prisma.TemplateCountOrderByAggregateInput;
    _avg?: Prisma.TemplateAvgOrderByAggregateInput;
    _max?: Prisma.TemplateMaxOrderByAggregateInput;
    _min?: Prisma.TemplateMinOrderByAggregateInput;
    _sum?: Prisma.TemplateSumOrderByAggregateInput;
};
export type TemplateScalarWhereWithAggregatesInput = {
    AND?: Prisma.TemplateScalarWhereWithAggregatesInput | Prisma.TemplateScalarWhereWithAggregatesInput[];
    OR?: Prisma.TemplateScalarWhereWithAggregatesInput[];
    NOT?: Prisma.TemplateScalarWhereWithAggregatesInput | Prisma.TemplateScalarWhereWithAggregatesInput[];
    id?: Prisma.StringWithAggregatesFilter<"Template"> | string;
    tenantId?: Prisma.StringNullableWithAggregatesFilter<"Template"> | string | null;
    category?: Prisma.EnumTemplateCategoryWithAggregatesFilter<"Template"> | $Enums.TemplateCategory;
    name?: Prisma.StringWithAggregatesFilter<"Template"> | string;
    description?: Prisma.StringNullableWithAggregatesFilter<"Template"> | string | null;
    riskScore?: Prisma.IntWithAggregatesFilter<"Template"> | number;
    clauseBlocks?: Prisma.JsonWithAggregatesFilter<"Template">;
    isSystem?: Prisma.BoolWithAggregatesFilter<"Template"> | boolean;
    usageCount?: Prisma.IntWithAggregatesFilter<"Template"> | number;
    socialProof?: Prisma.StringNullableWithAggregatesFilter<"Template"> | string | null;
    createdAt?: Prisma.DateTimeWithAggregatesFilter<"Template"> | Date | string;
    updatedAt?: Prisma.DateTimeWithAggregatesFilter<"Template"> | Date | string;
};
export type TemplateCreateInput = {
    id?: string;
    category: $Enums.TemplateCategory;
    name: string;
    description?: string | null;
    riskScore?: number;
    clauseBlocks?: Prisma.JsonNullValueInput | runtime.InputJsonValue;
    isSystem?: boolean;
    usageCount?: number;
    socialProof?: string | null;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    tenant?: Prisma.TenantCreateNestedOneWithoutTemplatesInput;
    contracts?: Prisma.ContractCreateNestedManyWithoutTemplateInput;
};
export type TemplateUncheckedCreateInput = {
    id?: string;
    tenantId?: string | null;
    category: $Enums.TemplateCategory;
    name: string;
    description?: string | null;
    riskScore?: number;
    clauseBlocks?: Prisma.JsonNullValueInput | runtime.InputJsonValue;
    isSystem?: boolean;
    usageCount?: number;
    socialProof?: string | null;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    contracts?: Prisma.ContractUncheckedCreateNestedManyWithoutTemplateInput;
};
export type TemplateUpdateInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    category?: Prisma.EnumTemplateCategoryFieldUpdateOperationsInput | $Enums.TemplateCategory;
    name?: Prisma.StringFieldUpdateOperationsInput | string;
    description?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    riskScore?: Prisma.IntFieldUpdateOperationsInput | number;
    clauseBlocks?: Prisma.JsonNullValueInput | runtime.InputJsonValue;
    isSystem?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    usageCount?: Prisma.IntFieldUpdateOperationsInput | number;
    socialProof?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    tenant?: Prisma.TenantUpdateOneWithoutTemplatesNestedInput;
    contracts?: Prisma.ContractUpdateManyWithoutTemplateNestedInput;
};
export type TemplateUncheckedUpdateInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    tenantId?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    category?: Prisma.EnumTemplateCategoryFieldUpdateOperationsInput | $Enums.TemplateCategory;
    name?: Prisma.StringFieldUpdateOperationsInput | string;
    description?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    riskScore?: Prisma.IntFieldUpdateOperationsInput | number;
    clauseBlocks?: Prisma.JsonNullValueInput | runtime.InputJsonValue;
    isSystem?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    usageCount?: Prisma.IntFieldUpdateOperationsInput | number;
    socialProof?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    contracts?: Prisma.ContractUncheckedUpdateManyWithoutTemplateNestedInput;
};
export type TemplateCreateManyInput = {
    id?: string;
    tenantId?: string | null;
    category: $Enums.TemplateCategory;
    name: string;
    description?: string | null;
    riskScore?: number;
    clauseBlocks?: Prisma.JsonNullValueInput | runtime.InputJsonValue;
    isSystem?: boolean;
    usageCount?: number;
    socialProof?: string | null;
    createdAt?: Date | string;
    updatedAt?: Date | string;
};
export type TemplateUpdateManyMutationInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    category?: Prisma.EnumTemplateCategoryFieldUpdateOperationsInput | $Enums.TemplateCategory;
    name?: Prisma.StringFieldUpdateOperationsInput | string;
    description?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    riskScore?: Prisma.IntFieldUpdateOperationsInput | number;
    clauseBlocks?: Prisma.JsonNullValueInput | runtime.InputJsonValue;
    isSystem?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    usageCount?: Prisma.IntFieldUpdateOperationsInput | number;
    socialProof?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type TemplateUncheckedUpdateManyInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    tenantId?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    category?: Prisma.EnumTemplateCategoryFieldUpdateOperationsInput | $Enums.TemplateCategory;
    name?: Prisma.StringFieldUpdateOperationsInput | string;
    description?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    riskScore?: Prisma.IntFieldUpdateOperationsInput | number;
    clauseBlocks?: Prisma.JsonNullValueInput | runtime.InputJsonValue;
    isSystem?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    usageCount?: Prisma.IntFieldUpdateOperationsInput | number;
    socialProof?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type TemplateListRelationFilter = {
    every?: Prisma.TemplateWhereInput;
    some?: Prisma.TemplateWhereInput;
    none?: Prisma.TemplateWhereInput;
};
export type TemplateOrderByRelationAggregateInput = {
    _count?: Prisma.SortOrder;
};
export type TemplateCountOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    tenantId?: Prisma.SortOrder;
    category?: Prisma.SortOrder;
    name?: Prisma.SortOrder;
    description?: Prisma.SortOrder;
    riskScore?: Prisma.SortOrder;
    clauseBlocks?: Prisma.SortOrder;
    isSystem?: Prisma.SortOrder;
    usageCount?: Prisma.SortOrder;
    socialProof?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    updatedAt?: Prisma.SortOrder;
};
export type TemplateAvgOrderByAggregateInput = {
    riskScore?: Prisma.SortOrder;
    usageCount?: Prisma.SortOrder;
};
export type TemplateMaxOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    tenantId?: Prisma.SortOrder;
    category?: Prisma.SortOrder;
    name?: Prisma.SortOrder;
    description?: Prisma.SortOrder;
    riskScore?: Prisma.SortOrder;
    isSystem?: Prisma.SortOrder;
    usageCount?: Prisma.SortOrder;
    socialProof?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    updatedAt?: Prisma.SortOrder;
};
export type TemplateMinOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    tenantId?: Prisma.SortOrder;
    category?: Prisma.SortOrder;
    name?: Prisma.SortOrder;
    description?: Prisma.SortOrder;
    riskScore?: Prisma.SortOrder;
    isSystem?: Prisma.SortOrder;
    usageCount?: Prisma.SortOrder;
    socialProof?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    updatedAt?: Prisma.SortOrder;
};
export type TemplateSumOrderByAggregateInput = {
    riskScore?: Prisma.SortOrder;
    usageCount?: Prisma.SortOrder;
};
export type TemplateNullableScalarRelationFilter = {
    is?: Prisma.TemplateWhereInput | null;
    isNot?: Prisma.TemplateWhereInput | null;
};
export type TemplateCreateNestedManyWithoutTenantInput = {
    create?: Prisma.XOR<Prisma.TemplateCreateWithoutTenantInput, Prisma.TemplateUncheckedCreateWithoutTenantInput> | Prisma.TemplateCreateWithoutTenantInput[] | Prisma.TemplateUncheckedCreateWithoutTenantInput[];
    connectOrCreate?: Prisma.TemplateCreateOrConnectWithoutTenantInput | Prisma.TemplateCreateOrConnectWithoutTenantInput[];
    createMany?: Prisma.TemplateCreateManyTenantInputEnvelope;
    connect?: Prisma.TemplateWhereUniqueInput | Prisma.TemplateWhereUniqueInput[];
};
export type TemplateUncheckedCreateNestedManyWithoutTenantInput = {
    create?: Prisma.XOR<Prisma.TemplateCreateWithoutTenantInput, Prisma.TemplateUncheckedCreateWithoutTenantInput> | Prisma.TemplateCreateWithoutTenantInput[] | Prisma.TemplateUncheckedCreateWithoutTenantInput[];
    connectOrCreate?: Prisma.TemplateCreateOrConnectWithoutTenantInput | Prisma.TemplateCreateOrConnectWithoutTenantInput[];
    createMany?: Prisma.TemplateCreateManyTenantInputEnvelope;
    connect?: Prisma.TemplateWhereUniqueInput | Prisma.TemplateWhereUniqueInput[];
};
export type TemplateUpdateManyWithoutTenantNestedInput = {
    create?: Prisma.XOR<Prisma.TemplateCreateWithoutTenantInput, Prisma.TemplateUncheckedCreateWithoutTenantInput> | Prisma.TemplateCreateWithoutTenantInput[] | Prisma.TemplateUncheckedCreateWithoutTenantInput[];
    connectOrCreate?: Prisma.TemplateCreateOrConnectWithoutTenantInput | Prisma.TemplateCreateOrConnectWithoutTenantInput[];
    upsert?: Prisma.TemplateUpsertWithWhereUniqueWithoutTenantInput | Prisma.TemplateUpsertWithWhereUniqueWithoutTenantInput[];
    createMany?: Prisma.TemplateCreateManyTenantInputEnvelope;
    set?: Prisma.TemplateWhereUniqueInput | Prisma.TemplateWhereUniqueInput[];
    disconnect?: Prisma.TemplateWhereUniqueInput | Prisma.TemplateWhereUniqueInput[];
    delete?: Prisma.TemplateWhereUniqueInput | Prisma.TemplateWhereUniqueInput[];
    connect?: Prisma.TemplateWhereUniqueInput | Prisma.TemplateWhereUniqueInput[];
    update?: Prisma.TemplateUpdateWithWhereUniqueWithoutTenantInput | Prisma.TemplateUpdateWithWhereUniqueWithoutTenantInput[];
    updateMany?: Prisma.TemplateUpdateManyWithWhereWithoutTenantInput | Prisma.TemplateUpdateManyWithWhereWithoutTenantInput[];
    deleteMany?: Prisma.TemplateScalarWhereInput | Prisma.TemplateScalarWhereInput[];
};
export type TemplateUncheckedUpdateManyWithoutTenantNestedInput = {
    create?: Prisma.XOR<Prisma.TemplateCreateWithoutTenantInput, Prisma.TemplateUncheckedCreateWithoutTenantInput> | Prisma.TemplateCreateWithoutTenantInput[] | Prisma.TemplateUncheckedCreateWithoutTenantInput[];
    connectOrCreate?: Prisma.TemplateCreateOrConnectWithoutTenantInput | Prisma.TemplateCreateOrConnectWithoutTenantInput[];
    upsert?: Prisma.TemplateUpsertWithWhereUniqueWithoutTenantInput | Prisma.TemplateUpsertWithWhereUniqueWithoutTenantInput[];
    createMany?: Prisma.TemplateCreateManyTenantInputEnvelope;
    set?: Prisma.TemplateWhereUniqueInput | Prisma.TemplateWhereUniqueInput[];
    disconnect?: Prisma.TemplateWhereUniqueInput | Prisma.TemplateWhereUniqueInput[];
    delete?: Prisma.TemplateWhereUniqueInput | Prisma.TemplateWhereUniqueInput[];
    connect?: Prisma.TemplateWhereUniqueInput | Prisma.TemplateWhereUniqueInput[];
    update?: Prisma.TemplateUpdateWithWhereUniqueWithoutTenantInput | Prisma.TemplateUpdateWithWhereUniqueWithoutTenantInput[];
    updateMany?: Prisma.TemplateUpdateManyWithWhereWithoutTenantInput | Prisma.TemplateUpdateManyWithWhereWithoutTenantInput[];
    deleteMany?: Prisma.TemplateScalarWhereInput | Prisma.TemplateScalarWhereInput[];
};
export type EnumTemplateCategoryFieldUpdateOperationsInput = {
    set?: $Enums.TemplateCategory;
};
export type BoolFieldUpdateOperationsInput = {
    set?: boolean;
};
export type TemplateCreateNestedOneWithoutContractsInput = {
    create?: Prisma.XOR<Prisma.TemplateCreateWithoutContractsInput, Prisma.TemplateUncheckedCreateWithoutContractsInput>;
    connectOrCreate?: Prisma.TemplateCreateOrConnectWithoutContractsInput;
    connect?: Prisma.TemplateWhereUniqueInput;
};
export type TemplateUpdateOneWithoutContractsNestedInput = {
    create?: Prisma.XOR<Prisma.TemplateCreateWithoutContractsInput, Prisma.TemplateUncheckedCreateWithoutContractsInput>;
    connectOrCreate?: Prisma.TemplateCreateOrConnectWithoutContractsInput;
    upsert?: Prisma.TemplateUpsertWithoutContractsInput;
    disconnect?: Prisma.TemplateWhereInput | boolean;
    delete?: Prisma.TemplateWhereInput | boolean;
    connect?: Prisma.TemplateWhereUniqueInput;
    update?: Prisma.XOR<Prisma.XOR<Prisma.TemplateUpdateToOneWithWhereWithoutContractsInput, Prisma.TemplateUpdateWithoutContractsInput>, Prisma.TemplateUncheckedUpdateWithoutContractsInput>;
};
export type TemplateCreateWithoutTenantInput = {
    id?: string;
    category: $Enums.TemplateCategory;
    name: string;
    description?: string | null;
    riskScore?: number;
    clauseBlocks?: Prisma.JsonNullValueInput | runtime.InputJsonValue;
    isSystem?: boolean;
    usageCount?: number;
    socialProof?: string | null;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    contracts?: Prisma.ContractCreateNestedManyWithoutTemplateInput;
};
export type TemplateUncheckedCreateWithoutTenantInput = {
    id?: string;
    category: $Enums.TemplateCategory;
    name: string;
    description?: string | null;
    riskScore?: number;
    clauseBlocks?: Prisma.JsonNullValueInput | runtime.InputJsonValue;
    isSystem?: boolean;
    usageCount?: number;
    socialProof?: string | null;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    contracts?: Prisma.ContractUncheckedCreateNestedManyWithoutTemplateInput;
};
export type TemplateCreateOrConnectWithoutTenantInput = {
    where: Prisma.TemplateWhereUniqueInput;
    create: Prisma.XOR<Prisma.TemplateCreateWithoutTenantInput, Prisma.TemplateUncheckedCreateWithoutTenantInput>;
};
export type TemplateCreateManyTenantInputEnvelope = {
    data: Prisma.TemplateCreateManyTenantInput | Prisma.TemplateCreateManyTenantInput[];
    skipDuplicates?: boolean;
};
export type TemplateUpsertWithWhereUniqueWithoutTenantInput = {
    where: Prisma.TemplateWhereUniqueInput;
    update: Prisma.XOR<Prisma.TemplateUpdateWithoutTenantInput, Prisma.TemplateUncheckedUpdateWithoutTenantInput>;
    create: Prisma.XOR<Prisma.TemplateCreateWithoutTenantInput, Prisma.TemplateUncheckedCreateWithoutTenantInput>;
};
export type TemplateUpdateWithWhereUniqueWithoutTenantInput = {
    where: Prisma.TemplateWhereUniqueInput;
    data: Prisma.XOR<Prisma.TemplateUpdateWithoutTenantInput, Prisma.TemplateUncheckedUpdateWithoutTenantInput>;
};
export type TemplateUpdateManyWithWhereWithoutTenantInput = {
    where: Prisma.TemplateScalarWhereInput;
    data: Prisma.XOR<Prisma.TemplateUpdateManyMutationInput, Prisma.TemplateUncheckedUpdateManyWithoutTenantInput>;
};
export type TemplateScalarWhereInput = {
    AND?: Prisma.TemplateScalarWhereInput | Prisma.TemplateScalarWhereInput[];
    OR?: Prisma.TemplateScalarWhereInput[];
    NOT?: Prisma.TemplateScalarWhereInput | Prisma.TemplateScalarWhereInput[];
    id?: Prisma.StringFilter<"Template"> | string;
    tenantId?: Prisma.StringNullableFilter<"Template"> | string | null;
    category?: Prisma.EnumTemplateCategoryFilter<"Template"> | $Enums.TemplateCategory;
    name?: Prisma.StringFilter<"Template"> | string;
    description?: Prisma.StringNullableFilter<"Template"> | string | null;
    riskScore?: Prisma.IntFilter<"Template"> | number;
    clauseBlocks?: Prisma.JsonFilter<"Template">;
    isSystem?: Prisma.BoolFilter<"Template"> | boolean;
    usageCount?: Prisma.IntFilter<"Template"> | number;
    socialProof?: Prisma.StringNullableFilter<"Template"> | string | null;
    createdAt?: Prisma.DateTimeFilter<"Template"> | Date | string;
    updatedAt?: Prisma.DateTimeFilter<"Template"> | Date | string;
};
export type TemplateCreateWithoutContractsInput = {
    id?: string;
    category: $Enums.TemplateCategory;
    name: string;
    description?: string | null;
    riskScore?: number;
    clauseBlocks?: Prisma.JsonNullValueInput | runtime.InputJsonValue;
    isSystem?: boolean;
    usageCount?: number;
    socialProof?: string | null;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    tenant?: Prisma.TenantCreateNestedOneWithoutTemplatesInput;
};
export type TemplateUncheckedCreateWithoutContractsInput = {
    id?: string;
    tenantId?: string | null;
    category: $Enums.TemplateCategory;
    name: string;
    description?: string | null;
    riskScore?: number;
    clauseBlocks?: Prisma.JsonNullValueInput | runtime.InputJsonValue;
    isSystem?: boolean;
    usageCount?: number;
    socialProof?: string | null;
    createdAt?: Date | string;
    updatedAt?: Date | string;
};
export type TemplateCreateOrConnectWithoutContractsInput = {
    where: Prisma.TemplateWhereUniqueInput;
    create: Prisma.XOR<Prisma.TemplateCreateWithoutContractsInput, Prisma.TemplateUncheckedCreateWithoutContractsInput>;
};
export type TemplateUpsertWithoutContractsInput = {
    update: Prisma.XOR<Prisma.TemplateUpdateWithoutContractsInput, Prisma.TemplateUncheckedUpdateWithoutContractsInput>;
    create: Prisma.XOR<Prisma.TemplateCreateWithoutContractsInput, Prisma.TemplateUncheckedCreateWithoutContractsInput>;
    where?: Prisma.TemplateWhereInput;
};
export type TemplateUpdateToOneWithWhereWithoutContractsInput = {
    where?: Prisma.TemplateWhereInput;
    data: Prisma.XOR<Prisma.TemplateUpdateWithoutContractsInput, Prisma.TemplateUncheckedUpdateWithoutContractsInput>;
};
export type TemplateUpdateWithoutContractsInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    category?: Prisma.EnumTemplateCategoryFieldUpdateOperationsInput | $Enums.TemplateCategory;
    name?: Prisma.StringFieldUpdateOperationsInput | string;
    description?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    riskScore?: Prisma.IntFieldUpdateOperationsInput | number;
    clauseBlocks?: Prisma.JsonNullValueInput | runtime.InputJsonValue;
    isSystem?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    usageCount?: Prisma.IntFieldUpdateOperationsInput | number;
    socialProof?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    tenant?: Prisma.TenantUpdateOneWithoutTemplatesNestedInput;
};
export type TemplateUncheckedUpdateWithoutContractsInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    tenantId?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    category?: Prisma.EnumTemplateCategoryFieldUpdateOperationsInput | $Enums.TemplateCategory;
    name?: Prisma.StringFieldUpdateOperationsInput | string;
    description?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    riskScore?: Prisma.IntFieldUpdateOperationsInput | number;
    clauseBlocks?: Prisma.JsonNullValueInput | runtime.InputJsonValue;
    isSystem?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    usageCount?: Prisma.IntFieldUpdateOperationsInput | number;
    socialProof?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type TemplateCreateManyTenantInput = {
    id?: string;
    category: $Enums.TemplateCategory;
    name: string;
    description?: string | null;
    riskScore?: number;
    clauseBlocks?: Prisma.JsonNullValueInput | runtime.InputJsonValue;
    isSystem?: boolean;
    usageCount?: number;
    socialProof?: string | null;
    createdAt?: Date | string;
    updatedAt?: Date | string;
};
export type TemplateUpdateWithoutTenantInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    category?: Prisma.EnumTemplateCategoryFieldUpdateOperationsInput | $Enums.TemplateCategory;
    name?: Prisma.StringFieldUpdateOperationsInput | string;
    description?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    riskScore?: Prisma.IntFieldUpdateOperationsInput | number;
    clauseBlocks?: Prisma.JsonNullValueInput | runtime.InputJsonValue;
    isSystem?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    usageCount?: Prisma.IntFieldUpdateOperationsInput | number;
    socialProof?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    contracts?: Prisma.ContractUpdateManyWithoutTemplateNestedInput;
};
export type TemplateUncheckedUpdateWithoutTenantInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    category?: Prisma.EnumTemplateCategoryFieldUpdateOperationsInput | $Enums.TemplateCategory;
    name?: Prisma.StringFieldUpdateOperationsInput | string;
    description?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    riskScore?: Prisma.IntFieldUpdateOperationsInput | number;
    clauseBlocks?: Prisma.JsonNullValueInput | runtime.InputJsonValue;
    isSystem?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    usageCount?: Prisma.IntFieldUpdateOperationsInput | number;
    socialProof?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    contracts?: Prisma.ContractUncheckedUpdateManyWithoutTemplateNestedInput;
};
export type TemplateUncheckedUpdateManyWithoutTenantInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    category?: Prisma.EnumTemplateCategoryFieldUpdateOperationsInput | $Enums.TemplateCategory;
    name?: Prisma.StringFieldUpdateOperationsInput | string;
    description?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    riskScore?: Prisma.IntFieldUpdateOperationsInput | number;
    clauseBlocks?: Prisma.JsonNullValueInput | runtime.InputJsonValue;
    isSystem?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    usageCount?: Prisma.IntFieldUpdateOperationsInput | number;
    socialProof?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type TemplateCountOutputType = {
    contracts: number;
};
export type TemplateCountOutputTypeSelect<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    contracts?: boolean | TemplateCountOutputTypeCountContractsArgs;
};
export type TemplateCountOutputTypeDefaultArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.TemplateCountOutputTypeSelect<ExtArgs> | null;
};
export type TemplateCountOutputTypeCountContractsArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.ContractWhereInput;
};
export type TemplateSelect<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    tenantId?: boolean;
    category?: boolean;
    name?: boolean;
    description?: boolean;
    riskScore?: boolean;
    clauseBlocks?: boolean;
    isSystem?: boolean;
    usageCount?: boolean;
    socialProof?: boolean;
    createdAt?: boolean;
    updatedAt?: boolean;
    tenant?: boolean | Prisma.Template$tenantArgs<ExtArgs>;
    contracts?: boolean | Prisma.Template$contractsArgs<ExtArgs>;
    _count?: boolean | Prisma.TemplateCountOutputTypeDefaultArgs<ExtArgs>;
}, ExtArgs["result"]["template"]>;
export type TemplateSelectCreateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    tenantId?: boolean;
    category?: boolean;
    name?: boolean;
    description?: boolean;
    riskScore?: boolean;
    clauseBlocks?: boolean;
    isSystem?: boolean;
    usageCount?: boolean;
    socialProof?: boolean;
    createdAt?: boolean;
    updatedAt?: boolean;
    tenant?: boolean | Prisma.Template$tenantArgs<ExtArgs>;
}, ExtArgs["result"]["template"]>;
export type TemplateSelectUpdateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    tenantId?: boolean;
    category?: boolean;
    name?: boolean;
    description?: boolean;
    riskScore?: boolean;
    clauseBlocks?: boolean;
    isSystem?: boolean;
    usageCount?: boolean;
    socialProof?: boolean;
    createdAt?: boolean;
    updatedAt?: boolean;
    tenant?: boolean | Prisma.Template$tenantArgs<ExtArgs>;
}, ExtArgs["result"]["template"]>;
export type TemplateSelectScalar = {
    id?: boolean;
    tenantId?: boolean;
    category?: boolean;
    name?: boolean;
    description?: boolean;
    riskScore?: boolean;
    clauseBlocks?: boolean;
    isSystem?: boolean;
    usageCount?: boolean;
    socialProof?: boolean;
    createdAt?: boolean;
    updatedAt?: boolean;
};
export type TemplateOmit<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetOmit<"id" | "tenantId" | "category" | "name" | "description" | "riskScore" | "clauseBlocks" | "isSystem" | "usageCount" | "socialProof" | "createdAt" | "updatedAt", ExtArgs["result"]["template"]>;
export type TemplateInclude<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    tenant?: boolean | Prisma.Template$tenantArgs<ExtArgs>;
    contracts?: boolean | Prisma.Template$contractsArgs<ExtArgs>;
    _count?: boolean | Prisma.TemplateCountOutputTypeDefaultArgs<ExtArgs>;
};
export type TemplateIncludeCreateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    tenant?: boolean | Prisma.Template$tenantArgs<ExtArgs>;
};
export type TemplateIncludeUpdateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    tenant?: boolean | Prisma.Template$tenantArgs<ExtArgs>;
};
export type $TemplatePayload<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    name: "Template";
    objects: {
        tenant: Prisma.$TenantPayload<ExtArgs> | null;
        contracts: Prisma.$ContractPayload<ExtArgs>[];
    };
    scalars: runtime.Types.Extensions.GetPayloadResult<{
        id: string;
        tenantId: string | null;
        category: $Enums.TemplateCategory;
        name: string;
        description: string | null;
        riskScore: number;
        clauseBlocks: runtime.JsonValue;
        isSystem: boolean;
        usageCount: number;
        socialProof: string | null;
        createdAt: Date;
        updatedAt: Date;
    }, ExtArgs["result"]["template"]>;
    composites: {};
};
export type TemplateGetPayload<S extends boolean | null | undefined | TemplateDefaultArgs> = runtime.Types.Result.GetResult<Prisma.$TemplatePayload, S>;
export type TemplateCountArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = Omit<TemplateFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
    select?: TemplateCountAggregateInputType | true;
};
export interface TemplateDelegate<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: {
        types: Prisma.TypeMap<ExtArgs>['model']['Template'];
        meta: {
            name: 'Template';
        };
    };
    findUnique<T extends TemplateFindUniqueArgs>(args: Prisma.SelectSubset<T, TemplateFindUniqueArgs<ExtArgs>>): Prisma.Prisma__TemplateClient<runtime.Types.Result.GetResult<Prisma.$TemplatePayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>;
    findUniqueOrThrow<T extends TemplateFindUniqueOrThrowArgs>(args: Prisma.SelectSubset<T, TemplateFindUniqueOrThrowArgs<ExtArgs>>): Prisma.Prisma__TemplateClient<runtime.Types.Result.GetResult<Prisma.$TemplatePayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    findFirst<T extends TemplateFindFirstArgs>(args?: Prisma.SelectSubset<T, TemplateFindFirstArgs<ExtArgs>>): Prisma.Prisma__TemplateClient<runtime.Types.Result.GetResult<Prisma.$TemplatePayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>;
    findFirstOrThrow<T extends TemplateFindFirstOrThrowArgs>(args?: Prisma.SelectSubset<T, TemplateFindFirstOrThrowArgs<ExtArgs>>): Prisma.Prisma__TemplateClient<runtime.Types.Result.GetResult<Prisma.$TemplatePayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    findMany<T extends TemplateFindManyArgs>(args?: Prisma.SelectSubset<T, TemplateFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$TemplatePayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>;
    create<T extends TemplateCreateArgs>(args: Prisma.SelectSubset<T, TemplateCreateArgs<ExtArgs>>): Prisma.Prisma__TemplateClient<runtime.Types.Result.GetResult<Prisma.$TemplatePayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    createMany<T extends TemplateCreateManyArgs>(args?: Prisma.SelectSubset<T, TemplateCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    createManyAndReturn<T extends TemplateCreateManyAndReturnArgs>(args?: Prisma.SelectSubset<T, TemplateCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$TemplatePayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>;
    delete<T extends TemplateDeleteArgs>(args: Prisma.SelectSubset<T, TemplateDeleteArgs<ExtArgs>>): Prisma.Prisma__TemplateClient<runtime.Types.Result.GetResult<Prisma.$TemplatePayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    update<T extends TemplateUpdateArgs>(args: Prisma.SelectSubset<T, TemplateUpdateArgs<ExtArgs>>): Prisma.Prisma__TemplateClient<runtime.Types.Result.GetResult<Prisma.$TemplatePayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    deleteMany<T extends TemplateDeleteManyArgs>(args?: Prisma.SelectSubset<T, TemplateDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    updateMany<T extends TemplateUpdateManyArgs>(args: Prisma.SelectSubset<T, TemplateUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    updateManyAndReturn<T extends TemplateUpdateManyAndReturnArgs>(args: Prisma.SelectSubset<T, TemplateUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$TemplatePayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>;
    upsert<T extends TemplateUpsertArgs>(args: Prisma.SelectSubset<T, TemplateUpsertArgs<ExtArgs>>): Prisma.Prisma__TemplateClient<runtime.Types.Result.GetResult<Prisma.$TemplatePayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    count<T extends TemplateCountArgs>(args?: Prisma.Subset<T, TemplateCountArgs>): Prisma.PrismaPromise<T extends runtime.Types.Utils.Record<'select', any> ? T['select'] extends true ? number : Prisma.GetScalarType<T['select'], TemplateCountAggregateOutputType> : number>;
    aggregate<T extends TemplateAggregateArgs>(args: Prisma.Subset<T, TemplateAggregateArgs>): Prisma.PrismaPromise<GetTemplateAggregateType<T>>;
    groupBy<T extends TemplateGroupByArgs, HasSelectOrTake extends Prisma.Or<Prisma.Extends<'skip', Prisma.Keys<T>>, Prisma.Extends<'take', Prisma.Keys<T>>>, OrderByArg extends Prisma.True extends HasSelectOrTake ? {
        orderBy: TemplateGroupByArgs['orderBy'];
    } : {
        orderBy?: TemplateGroupByArgs['orderBy'];
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
    }[OrderFields]>(args: Prisma.SubsetIntersection<T, TemplateGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetTemplateGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>;
    readonly fields: TemplateFieldRefs;
}
export interface Prisma__TemplateClient<T, Null = never, ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise";
    tenant<T extends Prisma.Template$tenantArgs<ExtArgs> = {}>(args?: Prisma.Subset<T, Prisma.Template$tenantArgs<ExtArgs>>): Prisma.Prisma__TenantClient<runtime.Types.Result.GetResult<Prisma.$TenantPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>;
    contracts<T extends Prisma.Template$contractsArgs<ExtArgs> = {}>(args?: Prisma.Subset<T, Prisma.Template$contractsArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$ContractPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>;
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): runtime.Types.Utils.JsPromise<TResult1 | TResult2>;
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): runtime.Types.Utils.JsPromise<T | TResult>;
    finally(onfinally?: (() => void) | undefined | null): runtime.Types.Utils.JsPromise<T>;
}
export interface TemplateFieldRefs {
    readonly id: Prisma.FieldRef<"Template", 'String'>;
    readonly tenantId: Prisma.FieldRef<"Template", 'String'>;
    readonly category: Prisma.FieldRef<"Template", 'TemplateCategory'>;
    readonly name: Prisma.FieldRef<"Template", 'String'>;
    readonly description: Prisma.FieldRef<"Template", 'String'>;
    readonly riskScore: Prisma.FieldRef<"Template", 'Int'>;
    readonly clauseBlocks: Prisma.FieldRef<"Template", 'Json'>;
    readonly isSystem: Prisma.FieldRef<"Template", 'Boolean'>;
    readonly usageCount: Prisma.FieldRef<"Template", 'Int'>;
    readonly socialProof: Prisma.FieldRef<"Template", 'String'>;
    readonly createdAt: Prisma.FieldRef<"Template", 'DateTime'>;
    readonly updatedAt: Prisma.FieldRef<"Template", 'DateTime'>;
}
export type TemplateFindUniqueArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.TemplateSelect<ExtArgs> | null;
    omit?: Prisma.TemplateOmit<ExtArgs> | null;
    include?: Prisma.TemplateInclude<ExtArgs> | null;
    where: Prisma.TemplateWhereUniqueInput;
};
export type TemplateFindUniqueOrThrowArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.TemplateSelect<ExtArgs> | null;
    omit?: Prisma.TemplateOmit<ExtArgs> | null;
    include?: Prisma.TemplateInclude<ExtArgs> | null;
    where: Prisma.TemplateWhereUniqueInput;
};
export type TemplateFindFirstArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.TemplateSelect<ExtArgs> | null;
    omit?: Prisma.TemplateOmit<ExtArgs> | null;
    include?: Prisma.TemplateInclude<ExtArgs> | null;
    where?: Prisma.TemplateWhereInput;
    orderBy?: Prisma.TemplateOrderByWithRelationInput | Prisma.TemplateOrderByWithRelationInput[];
    cursor?: Prisma.TemplateWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.TemplateScalarFieldEnum | Prisma.TemplateScalarFieldEnum[];
};
export type TemplateFindFirstOrThrowArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.TemplateSelect<ExtArgs> | null;
    omit?: Prisma.TemplateOmit<ExtArgs> | null;
    include?: Prisma.TemplateInclude<ExtArgs> | null;
    where?: Prisma.TemplateWhereInput;
    orderBy?: Prisma.TemplateOrderByWithRelationInput | Prisma.TemplateOrderByWithRelationInput[];
    cursor?: Prisma.TemplateWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.TemplateScalarFieldEnum | Prisma.TemplateScalarFieldEnum[];
};
export type TemplateFindManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.TemplateSelect<ExtArgs> | null;
    omit?: Prisma.TemplateOmit<ExtArgs> | null;
    include?: Prisma.TemplateInclude<ExtArgs> | null;
    where?: Prisma.TemplateWhereInput;
    orderBy?: Prisma.TemplateOrderByWithRelationInput | Prisma.TemplateOrderByWithRelationInput[];
    cursor?: Prisma.TemplateWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.TemplateScalarFieldEnum | Prisma.TemplateScalarFieldEnum[];
};
export type TemplateCreateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.TemplateSelect<ExtArgs> | null;
    omit?: Prisma.TemplateOmit<ExtArgs> | null;
    include?: Prisma.TemplateInclude<ExtArgs> | null;
    data: Prisma.XOR<Prisma.TemplateCreateInput, Prisma.TemplateUncheckedCreateInput>;
};
export type TemplateCreateManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    data: Prisma.TemplateCreateManyInput | Prisma.TemplateCreateManyInput[];
    skipDuplicates?: boolean;
};
export type TemplateCreateManyAndReturnArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.TemplateSelectCreateManyAndReturn<ExtArgs> | null;
    omit?: Prisma.TemplateOmit<ExtArgs> | null;
    data: Prisma.TemplateCreateManyInput | Prisma.TemplateCreateManyInput[];
    skipDuplicates?: boolean;
    include?: Prisma.TemplateIncludeCreateManyAndReturn<ExtArgs> | null;
};
export type TemplateUpdateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.TemplateSelect<ExtArgs> | null;
    omit?: Prisma.TemplateOmit<ExtArgs> | null;
    include?: Prisma.TemplateInclude<ExtArgs> | null;
    data: Prisma.XOR<Prisma.TemplateUpdateInput, Prisma.TemplateUncheckedUpdateInput>;
    where: Prisma.TemplateWhereUniqueInput;
};
export type TemplateUpdateManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    data: Prisma.XOR<Prisma.TemplateUpdateManyMutationInput, Prisma.TemplateUncheckedUpdateManyInput>;
    where?: Prisma.TemplateWhereInput;
    limit?: number;
};
export type TemplateUpdateManyAndReturnArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.TemplateSelectUpdateManyAndReturn<ExtArgs> | null;
    omit?: Prisma.TemplateOmit<ExtArgs> | null;
    data: Prisma.XOR<Prisma.TemplateUpdateManyMutationInput, Prisma.TemplateUncheckedUpdateManyInput>;
    where?: Prisma.TemplateWhereInput;
    limit?: number;
    include?: Prisma.TemplateIncludeUpdateManyAndReturn<ExtArgs> | null;
};
export type TemplateUpsertArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.TemplateSelect<ExtArgs> | null;
    omit?: Prisma.TemplateOmit<ExtArgs> | null;
    include?: Prisma.TemplateInclude<ExtArgs> | null;
    where: Prisma.TemplateWhereUniqueInput;
    create: Prisma.XOR<Prisma.TemplateCreateInput, Prisma.TemplateUncheckedCreateInput>;
    update: Prisma.XOR<Prisma.TemplateUpdateInput, Prisma.TemplateUncheckedUpdateInput>;
};
export type TemplateDeleteArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.TemplateSelect<ExtArgs> | null;
    omit?: Prisma.TemplateOmit<ExtArgs> | null;
    include?: Prisma.TemplateInclude<ExtArgs> | null;
    where: Prisma.TemplateWhereUniqueInput;
};
export type TemplateDeleteManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.TemplateWhereInput;
    limit?: number;
};
export type Template$tenantArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.TenantSelect<ExtArgs> | null;
    omit?: Prisma.TenantOmit<ExtArgs> | null;
    include?: Prisma.TenantInclude<ExtArgs> | null;
    where?: Prisma.TenantWhereInput;
};
export type Template$contractsArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.ContractSelect<ExtArgs> | null;
    omit?: Prisma.ContractOmit<ExtArgs> | null;
    include?: Prisma.ContractInclude<ExtArgs> | null;
    where?: Prisma.ContractWhereInput;
    orderBy?: Prisma.ContractOrderByWithRelationInput | Prisma.ContractOrderByWithRelationInput[];
    cursor?: Prisma.ContractWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.ContractScalarFieldEnum | Prisma.ContractScalarFieldEnum[];
};
export type TemplateDefaultArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.TemplateSelect<ExtArgs> | null;
    omit?: Prisma.TemplateOmit<ExtArgs> | null;
    include?: Prisma.TemplateInclude<ExtArgs> | null;
};

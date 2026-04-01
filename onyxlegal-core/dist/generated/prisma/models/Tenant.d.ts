import type * as runtime from "@prisma/client/runtime/client";
import type * as $Enums from "../enums";
import type * as Prisma from "../internal/prismaNamespace";
export type TenantModel = runtime.Types.Result.DefaultSelection<Prisma.$TenantPayload>;
export type AggregateTenant = {
    _count: TenantCountAggregateOutputType | null;
    _avg: TenantAvgAggregateOutputType | null;
    _sum: TenantSumAggregateOutputType | null;
    _min: TenantMinAggregateOutputType | null;
    _max: TenantMaxAggregateOutputType | null;
};
export type TenantAvgAggregateOutputType = {
    aiTokensUsed: number | null;
    aiTokenLimit: number | null;
};
export type TenantSumAggregateOutputType = {
    aiTokensUsed: number | null;
    aiTokenLimit: number | null;
};
export type TenantMinAggregateOutputType = {
    id: string | null;
    name: string | null;
    plan: $Enums.Plan | null;
    domain: string | null;
    aiTokensUsed: number | null;
    aiTokenLimit: number | null;
    billingCycleStart: Date | null;
    createdAt: Date | null;
    updatedAt: Date | null;
};
export type TenantMaxAggregateOutputType = {
    id: string | null;
    name: string | null;
    plan: $Enums.Plan | null;
    domain: string | null;
    aiTokensUsed: number | null;
    aiTokenLimit: number | null;
    billingCycleStart: Date | null;
    createdAt: Date | null;
    updatedAt: Date | null;
};
export type TenantCountAggregateOutputType = {
    id: number;
    name: number;
    plan: number;
    domain: number;
    aiTokensUsed: number;
    aiTokenLimit: number;
    billingCycleStart: number;
    createdAt: number;
    updatedAt: number;
    _all: number;
};
export type TenantAvgAggregateInputType = {
    aiTokensUsed?: true;
    aiTokenLimit?: true;
};
export type TenantSumAggregateInputType = {
    aiTokensUsed?: true;
    aiTokenLimit?: true;
};
export type TenantMinAggregateInputType = {
    id?: true;
    name?: true;
    plan?: true;
    domain?: true;
    aiTokensUsed?: true;
    aiTokenLimit?: true;
    billingCycleStart?: true;
    createdAt?: true;
    updatedAt?: true;
};
export type TenantMaxAggregateInputType = {
    id?: true;
    name?: true;
    plan?: true;
    domain?: true;
    aiTokensUsed?: true;
    aiTokenLimit?: true;
    billingCycleStart?: true;
    createdAt?: true;
    updatedAt?: true;
};
export type TenantCountAggregateInputType = {
    id?: true;
    name?: true;
    plan?: true;
    domain?: true;
    aiTokensUsed?: true;
    aiTokenLimit?: true;
    billingCycleStart?: true;
    createdAt?: true;
    updatedAt?: true;
    _all?: true;
};
export type TenantAggregateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.TenantWhereInput;
    orderBy?: Prisma.TenantOrderByWithRelationInput | Prisma.TenantOrderByWithRelationInput[];
    cursor?: Prisma.TenantWhereUniqueInput;
    take?: number;
    skip?: number;
    _count?: true | TenantCountAggregateInputType;
    _avg?: TenantAvgAggregateInputType;
    _sum?: TenantSumAggregateInputType;
    _min?: TenantMinAggregateInputType;
    _max?: TenantMaxAggregateInputType;
};
export type GetTenantAggregateType<T extends TenantAggregateArgs> = {
    [P in keyof T & keyof AggregateTenant]: P extends '_count' | 'count' ? T[P] extends true ? number : Prisma.GetScalarType<T[P], AggregateTenant[P]> : Prisma.GetScalarType<T[P], AggregateTenant[P]>;
};
export type TenantGroupByArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.TenantWhereInput;
    orderBy?: Prisma.TenantOrderByWithAggregationInput | Prisma.TenantOrderByWithAggregationInput[];
    by: Prisma.TenantScalarFieldEnum[] | Prisma.TenantScalarFieldEnum;
    having?: Prisma.TenantScalarWhereWithAggregatesInput;
    take?: number;
    skip?: number;
    _count?: TenantCountAggregateInputType | true;
    _avg?: TenantAvgAggregateInputType;
    _sum?: TenantSumAggregateInputType;
    _min?: TenantMinAggregateInputType;
    _max?: TenantMaxAggregateInputType;
};
export type TenantGroupByOutputType = {
    id: string;
    name: string;
    plan: $Enums.Plan;
    domain: string | null;
    aiTokensUsed: number;
    aiTokenLimit: number;
    billingCycleStart: Date;
    createdAt: Date;
    updatedAt: Date;
    _count: TenantCountAggregateOutputType | null;
    _avg: TenantAvgAggregateOutputType | null;
    _sum: TenantSumAggregateOutputType | null;
    _min: TenantMinAggregateOutputType | null;
    _max: TenantMaxAggregateOutputType | null;
};
export type GetTenantGroupByPayload<T extends TenantGroupByArgs> = Prisma.PrismaPromise<Array<Prisma.PickEnumerable<TenantGroupByOutputType, T['by']> & {
    [P in ((keyof T) & (keyof TenantGroupByOutputType))]: P extends '_count' ? T[P] extends boolean ? number : Prisma.GetScalarType<T[P], TenantGroupByOutputType[P]> : Prisma.GetScalarType<T[P], TenantGroupByOutputType[P]>;
}>>;
export type TenantWhereInput = {
    AND?: Prisma.TenantWhereInput | Prisma.TenantWhereInput[];
    OR?: Prisma.TenantWhereInput[];
    NOT?: Prisma.TenantWhereInput | Prisma.TenantWhereInput[];
    id?: Prisma.StringFilter<"Tenant"> | string;
    name?: Prisma.StringFilter<"Tenant"> | string;
    plan?: Prisma.EnumPlanFilter<"Tenant"> | $Enums.Plan;
    domain?: Prisma.StringNullableFilter<"Tenant"> | string | null;
    aiTokensUsed?: Prisma.IntFilter<"Tenant"> | number;
    aiTokenLimit?: Prisma.IntFilter<"Tenant"> | number;
    billingCycleStart?: Prisma.DateTimeFilter<"Tenant"> | Date | string;
    createdAt?: Prisma.DateTimeFilter<"Tenant"> | Date | string;
    updatedAt?: Prisma.DateTimeFilter<"Tenant"> | Date | string;
    users?: Prisma.UserListRelationFilter;
    contracts?: Prisma.ContractListRelationFilter;
    templates?: Prisma.TemplateListRelationFilter;
};
export type TenantOrderByWithRelationInput = {
    id?: Prisma.SortOrder;
    name?: Prisma.SortOrder;
    plan?: Prisma.SortOrder;
    domain?: Prisma.SortOrderInput | Prisma.SortOrder;
    aiTokensUsed?: Prisma.SortOrder;
    aiTokenLimit?: Prisma.SortOrder;
    billingCycleStart?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    updatedAt?: Prisma.SortOrder;
    users?: Prisma.UserOrderByRelationAggregateInput;
    contracts?: Prisma.ContractOrderByRelationAggregateInput;
    templates?: Prisma.TemplateOrderByRelationAggregateInput;
};
export type TenantWhereUniqueInput = Prisma.AtLeast<{
    id?: string;
    domain?: string;
    AND?: Prisma.TenantWhereInput | Prisma.TenantWhereInput[];
    OR?: Prisma.TenantWhereInput[];
    NOT?: Prisma.TenantWhereInput | Prisma.TenantWhereInput[];
    name?: Prisma.StringFilter<"Tenant"> | string;
    plan?: Prisma.EnumPlanFilter<"Tenant"> | $Enums.Plan;
    aiTokensUsed?: Prisma.IntFilter<"Tenant"> | number;
    aiTokenLimit?: Prisma.IntFilter<"Tenant"> | number;
    billingCycleStart?: Prisma.DateTimeFilter<"Tenant"> | Date | string;
    createdAt?: Prisma.DateTimeFilter<"Tenant"> | Date | string;
    updatedAt?: Prisma.DateTimeFilter<"Tenant"> | Date | string;
    users?: Prisma.UserListRelationFilter;
    contracts?: Prisma.ContractListRelationFilter;
    templates?: Prisma.TemplateListRelationFilter;
}, "id" | "domain">;
export type TenantOrderByWithAggregationInput = {
    id?: Prisma.SortOrder;
    name?: Prisma.SortOrder;
    plan?: Prisma.SortOrder;
    domain?: Prisma.SortOrderInput | Prisma.SortOrder;
    aiTokensUsed?: Prisma.SortOrder;
    aiTokenLimit?: Prisma.SortOrder;
    billingCycleStart?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    updatedAt?: Prisma.SortOrder;
    _count?: Prisma.TenantCountOrderByAggregateInput;
    _avg?: Prisma.TenantAvgOrderByAggregateInput;
    _max?: Prisma.TenantMaxOrderByAggregateInput;
    _min?: Prisma.TenantMinOrderByAggregateInput;
    _sum?: Prisma.TenantSumOrderByAggregateInput;
};
export type TenantScalarWhereWithAggregatesInput = {
    AND?: Prisma.TenantScalarWhereWithAggregatesInput | Prisma.TenantScalarWhereWithAggregatesInput[];
    OR?: Prisma.TenantScalarWhereWithAggregatesInput[];
    NOT?: Prisma.TenantScalarWhereWithAggregatesInput | Prisma.TenantScalarWhereWithAggregatesInput[];
    id?: Prisma.StringWithAggregatesFilter<"Tenant"> | string;
    name?: Prisma.StringWithAggregatesFilter<"Tenant"> | string;
    plan?: Prisma.EnumPlanWithAggregatesFilter<"Tenant"> | $Enums.Plan;
    domain?: Prisma.StringNullableWithAggregatesFilter<"Tenant"> | string | null;
    aiTokensUsed?: Prisma.IntWithAggregatesFilter<"Tenant"> | number;
    aiTokenLimit?: Prisma.IntWithAggregatesFilter<"Tenant"> | number;
    billingCycleStart?: Prisma.DateTimeWithAggregatesFilter<"Tenant"> | Date | string;
    createdAt?: Prisma.DateTimeWithAggregatesFilter<"Tenant"> | Date | string;
    updatedAt?: Prisma.DateTimeWithAggregatesFilter<"Tenant"> | Date | string;
};
export type TenantCreateInput = {
    id?: string;
    name: string;
    plan?: $Enums.Plan;
    domain?: string | null;
    aiTokensUsed?: number;
    aiTokenLimit?: number;
    billingCycleStart?: Date | string;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    users?: Prisma.UserCreateNestedManyWithoutTenantInput;
    contracts?: Prisma.ContractCreateNestedManyWithoutTenantInput;
    templates?: Prisma.TemplateCreateNestedManyWithoutTenantInput;
};
export type TenantUncheckedCreateInput = {
    id?: string;
    name: string;
    plan?: $Enums.Plan;
    domain?: string | null;
    aiTokensUsed?: number;
    aiTokenLimit?: number;
    billingCycleStart?: Date | string;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    users?: Prisma.UserUncheckedCreateNestedManyWithoutTenantInput;
    contracts?: Prisma.ContractUncheckedCreateNestedManyWithoutTenantInput;
    templates?: Prisma.TemplateUncheckedCreateNestedManyWithoutTenantInput;
};
export type TenantUpdateInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    name?: Prisma.StringFieldUpdateOperationsInput | string;
    plan?: Prisma.EnumPlanFieldUpdateOperationsInput | $Enums.Plan;
    domain?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    aiTokensUsed?: Prisma.IntFieldUpdateOperationsInput | number;
    aiTokenLimit?: Prisma.IntFieldUpdateOperationsInput | number;
    billingCycleStart?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    users?: Prisma.UserUpdateManyWithoutTenantNestedInput;
    contracts?: Prisma.ContractUpdateManyWithoutTenantNestedInput;
    templates?: Prisma.TemplateUpdateManyWithoutTenantNestedInput;
};
export type TenantUncheckedUpdateInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    name?: Prisma.StringFieldUpdateOperationsInput | string;
    plan?: Prisma.EnumPlanFieldUpdateOperationsInput | $Enums.Plan;
    domain?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    aiTokensUsed?: Prisma.IntFieldUpdateOperationsInput | number;
    aiTokenLimit?: Prisma.IntFieldUpdateOperationsInput | number;
    billingCycleStart?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    users?: Prisma.UserUncheckedUpdateManyWithoutTenantNestedInput;
    contracts?: Prisma.ContractUncheckedUpdateManyWithoutTenantNestedInput;
    templates?: Prisma.TemplateUncheckedUpdateManyWithoutTenantNestedInput;
};
export type TenantCreateManyInput = {
    id?: string;
    name: string;
    plan?: $Enums.Plan;
    domain?: string | null;
    aiTokensUsed?: number;
    aiTokenLimit?: number;
    billingCycleStart?: Date | string;
    createdAt?: Date | string;
    updatedAt?: Date | string;
};
export type TenantUpdateManyMutationInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    name?: Prisma.StringFieldUpdateOperationsInput | string;
    plan?: Prisma.EnumPlanFieldUpdateOperationsInput | $Enums.Plan;
    domain?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    aiTokensUsed?: Prisma.IntFieldUpdateOperationsInput | number;
    aiTokenLimit?: Prisma.IntFieldUpdateOperationsInput | number;
    billingCycleStart?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type TenantUncheckedUpdateManyInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    name?: Prisma.StringFieldUpdateOperationsInput | string;
    plan?: Prisma.EnumPlanFieldUpdateOperationsInput | $Enums.Plan;
    domain?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    aiTokensUsed?: Prisma.IntFieldUpdateOperationsInput | number;
    aiTokenLimit?: Prisma.IntFieldUpdateOperationsInput | number;
    billingCycleStart?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type TenantCountOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    name?: Prisma.SortOrder;
    plan?: Prisma.SortOrder;
    domain?: Prisma.SortOrder;
    aiTokensUsed?: Prisma.SortOrder;
    aiTokenLimit?: Prisma.SortOrder;
    billingCycleStart?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    updatedAt?: Prisma.SortOrder;
};
export type TenantAvgOrderByAggregateInput = {
    aiTokensUsed?: Prisma.SortOrder;
    aiTokenLimit?: Prisma.SortOrder;
};
export type TenantMaxOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    name?: Prisma.SortOrder;
    plan?: Prisma.SortOrder;
    domain?: Prisma.SortOrder;
    aiTokensUsed?: Prisma.SortOrder;
    aiTokenLimit?: Prisma.SortOrder;
    billingCycleStart?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    updatedAt?: Prisma.SortOrder;
};
export type TenantMinOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    name?: Prisma.SortOrder;
    plan?: Prisma.SortOrder;
    domain?: Prisma.SortOrder;
    aiTokensUsed?: Prisma.SortOrder;
    aiTokenLimit?: Prisma.SortOrder;
    billingCycleStart?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    updatedAt?: Prisma.SortOrder;
};
export type TenantSumOrderByAggregateInput = {
    aiTokensUsed?: Prisma.SortOrder;
    aiTokenLimit?: Prisma.SortOrder;
};
export type TenantScalarRelationFilter = {
    is?: Prisma.TenantWhereInput;
    isNot?: Prisma.TenantWhereInput;
};
export type TenantNullableScalarRelationFilter = {
    is?: Prisma.TenantWhereInput | null;
    isNot?: Prisma.TenantWhereInput | null;
};
export type StringFieldUpdateOperationsInput = {
    set?: string;
};
export type EnumPlanFieldUpdateOperationsInput = {
    set?: $Enums.Plan;
};
export type NullableStringFieldUpdateOperationsInput = {
    set?: string | null;
};
export type IntFieldUpdateOperationsInput = {
    set?: number;
    increment?: number;
    decrement?: number;
    multiply?: number;
    divide?: number;
};
export type DateTimeFieldUpdateOperationsInput = {
    set?: Date | string;
};
export type TenantCreateNestedOneWithoutUsersInput = {
    create?: Prisma.XOR<Prisma.TenantCreateWithoutUsersInput, Prisma.TenantUncheckedCreateWithoutUsersInput>;
    connectOrCreate?: Prisma.TenantCreateOrConnectWithoutUsersInput;
    connect?: Prisma.TenantWhereUniqueInput;
};
export type TenantUpdateOneRequiredWithoutUsersNestedInput = {
    create?: Prisma.XOR<Prisma.TenantCreateWithoutUsersInput, Prisma.TenantUncheckedCreateWithoutUsersInput>;
    connectOrCreate?: Prisma.TenantCreateOrConnectWithoutUsersInput;
    upsert?: Prisma.TenantUpsertWithoutUsersInput;
    connect?: Prisma.TenantWhereUniqueInput;
    update?: Prisma.XOR<Prisma.XOR<Prisma.TenantUpdateToOneWithWhereWithoutUsersInput, Prisma.TenantUpdateWithoutUsersInput>, Prisma.TenantUncheckedUpdateWithoutUsersInput>;
};
export type TenantCreateNestedOneWithoutTemplatesInput = {
    create?: Prisma.XOR<Prisma.TenantCreateWithoutTemplatesInput, Prisma.TenantUncheckedCreateWithoutTemplatesInput>;
    connectOrCreate?: Prisma.TenantCreateOrConnectWithoutTemplatesInput;
    connect?: Prisma.TenantWhereUniqueInput;
};
export type TenantUpdateOneWithoutTemplatesNestedInput = {
    create?: Prisma.XOR<Prisma.TenantCreateWithoutTemplatesInput, Prisma.TenantUncheckedCreateWithoutTemplatesInput>;
    connectOrCreate?: Prisma.TenantCreateOrConnectWithoutTemplatesInput;
    upsert?: Prisma.TenantUpsertWithoutTemplatesInput;
    disconnect?: Prisma.TenantWhereInput | boolean;
    delete?: Prisma.TenantWhereInput | boolean;
    connect?: Prisma.TenantWhereUniqueInput;
    update?: Prisma.XOR<Prisma.XOR<Prisma.TenantUpdateToOneWithWhereWithoutTemplatesInput, Prisma.TenantUpdateWithoutTemplatesInput>, Prisma.TenantUncheckedUpdateWithoutTemplatesInput>;
};
export type TenantCreateNestedOneWithoutContractsInput = {
    create?: Prisma.XOR<Prisma.TenantCreateWithoutContractsInput, Prisma.TenantUncheckedCreateWithoutContractsInput>;
    connectOrCreate?: Prisma.TenantCreateOrConnectWithoutContractsInput;
    connect?: Prisma.TenantWhereUniqueInput;
};
export type TenantUpdateOneRequiredWithoutContractsNestedInput = {
    create?: Prisma.XOR<Prisma.TenantCreateWithoutContractsInput, Prisma.TenantUncheckedCreateWithoutContractsInput>;
    connectOrCreate?: Prisma.TenantCreateOrConnectWithoutContractsInput;
    upsert?: Prisma.TenantUpsertWithoutContractsInput;
    connect?: Prisma.TenantWhereUniqueInput;
    update?: Prisma.XOR<Prisma.XOR<Prisma.TenantUpdateToOneWithWhereWithoutContractsInput, Prisma.TenantUpdateWithoutContractsInput>, Prisma.TenantUncheckedUpdateWithoutContractsInput>;
};
export type TenantCreateWithoutUsersInput = {
    id?: string;
    name: string;
    plan?: $Enums.Plan;
    domain?: string | null;
    aiTokensUsed?: number;
    aiTokenLimit?: number;
    billingCycleStart?: Date | string;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    contracts?: Prisma.ContractCreateNestedManyWithoutTenantInput;
    templates?: Prisma.TemplateCreateNestedManyWithoutTenantInput;
};
export type TenantUncheckedCreateWithoutUsersInput = {
    id?: string;
    name: string;
    plan?: $Enums.Plan;
    domain?: string | null;
    aiTokensUsed?: number;
    aiTokenLimit?: number;
    billingCycleStart?: Date | string;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    contracts?: Prisma.ContractUncheckedCreateNestedManyWithoutTenantInput;
    templates?: Prisma.TemplateUncheckedCreateNestedManyWithoutTenantInput;
};
export type TenantCreateOrConnectWithoutUsersInput = {
    where: Prisma.TenantWhereUniqueInput;
    create: Prisma.XOR<Prisma.TenantCreateWithoutUsersInput, Prisma.TenantUncheckedCreateWithoutUsersInput>;
};
export type TenantUpsertWithoutUsersInput = {
    update: Prisma.XOR<Prisma.TenantUpdateWithoutUsersInput, Prisma.TenantUncheckedUpdateWithoutUsersInput>;
    create: Prisma.XOR<Prisma.TenantCreateWithoutUsersInput, Prisma.TenantUncheckedCreateWithoutUsersInput>;
    where?: Prisma.TenantWhereInput;
};
export type TenantUpdateToOneWithWhereWithoutUsersInput = {
    where?: Prisma.TenantWhereInput;
    data: Prisma.XOR<Prisma.TenantUpdateWithoutUsersInput, Prisma.TenantUncheckedUpdateWithoutUsersInput>;
};
export type TenantUpdateWithoutUsersInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    name?: Prisma.StringFieldUpdateOperationsInput | string;
    plan?: Prisma.EnumPlanFieldUpdateOperationsInput | $Enums.Plan;
    domain?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    aiTokensUsed?: Prisma.IntFieldUpdateOperationsInput | number;
    aiTokenLimit?: Prisma.IntFieldUpdateOperationsInput | number;
    billingCycleStart?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    contracts?: Prisma.ContractUpdateManyWithoutTenantNestedInput;
    templates?: Prisma.TemplateUpdateManyWithoutTenantNestedInput;
};
export type TenantUncheckedUpdateWithoutUsersInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    name?: Prisma.StringFieldUpdateOperationsInput | string;
    plan?: Prisma.EnumPlanFieldUpdateOperationsInput | $Enums.Plan;
    domain?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    aiTokensUsed?: Prisma.IntFieldUpdateOperationsInput | number;
    aiTokenLimit?: Prisma.IntFieldUpdateOperationsInput | number;
    billingCycleStart?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    contracts?: Prisma.ContractUncheckedUpdateManyWithoutTenantNestedInput;
    templates?: Prisma.TemplateUncheckedUpdateManyWithoutTenantNestedInput;
};
export type TenantCreateWithoutTemplatesInput = {
    id?: string;
    name: string;
    plan?: $Enums.Plan;
    domain?: string | null;
    aiTokensUsed?: number;
    aiTokenLimit?: number;
    billingCycleStart?: Date | string;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    users?: Prisma.UserCreateNestedManyWithoutTenantInput;
    contracts?: Prisma.ContractCreateNestedManyWithoutTenantInput;
};
export type TenantUncheckedCreateWithoutTemplatesInput = {
    id?: string;
    name: string;
    plan?: $Enums.Plan;
    domain?: string | null;
    aiTokensUsed?: number;
    aiTokenLimit?: number;
    billingCycleStart?: Date | string;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    users?: Prisma.UserUncheckedCreateNestedManyWithoutTenantInput;
    contracts?: Prisma.ContractUncheckedCreateNestedManyWithoutTenantInput;
};
export type TenantCreateOrConnectWithoutTemplatesInput = {
    where: Prisma.TenantWhereUniqueInput;
    create: Prisma.XOR<Prisma.TenantCreateWithoutTemplatesInput, Prisma.TenantUncheckedCreateWithoutTemplatesInput>;
};
export type TenantUpsertWithoutTemplatesInput = {
    update: Prisma.XOR<Prisma.TenantUpdateWithoutTemplatesInput, Prisma.TenantUncheckedUpdateWithoutTemplatesInput>;
    create: Prisma.XOR<Prisma.TenantCreateWithoutTemplatesInput, Prisma.TenantUncheckedCreateWithoutTemplatesInput>;
    where?: Prisma.TenantWhereInput;
};
export type TenantUpdateToOneWithWhereWithoutTemplatesInput = {
    where?: Prisma.TenantWhereInput;
    data: Prisma.XOR<Prisma.TenantUpdateWithoutTemplatesInput, Prisma.TenantUncheckedUpdateWithoutTemplatesInput>;
};
export type TenantUpdateWithoutTemplatesInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    name?: Prisma.StringFieldUpdateOperationsInput | string;
    plan?: Prisma.EnumPlanFieldUpdateOperationsInput | $Enums.Plan;
    domain?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    aiTokensUsed?: Prisma.IntFieldUpdateOperationsInput | number;
    aiTokenLimit?: Prisma.IntFieldUpdateOperationsInput | number;
    billingCycleStart?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    users?: Prisma.UserUpdateManyWithoutTenantNestedInput;
    contracts?: Prisma.ContractUpdateManyWithoutTenantNestedInput;
};
export type TenantUncheckedUpdateWithoutTemplatesInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    name?: Prisma.StringFieldUpdateOperationsInput | string;
    plan?: Prisma.EnumPlanFieldUpdateOperationsInput | $Enums.Plan;
    domain?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    aiTokensUsed?: Prisma.IntFieldUpdateOperationsInput | number;
    aiTokenLimit?: Prisma.IntFieldUpdateOperationsInput | number;
    billingCycleStart?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    users?: Prisma.UserUncheckedUpdateManyWithoutTenantNestedInput;
    contracts?: Prisma.ContractUncheckedUpdateManyWithoutTenantNestedInput;
};
export type TenantCreateWithoutContractsInput = {
    id?: string;
    name: string;
    plan?: $Enums.Plan;
    domain?: string | null;
    aiTokensUsed?: number;
    aiTokenLimit?: number;
    billingCycleStart?: Date | string;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    users?: Prisma.UserCreateNestedManyWithoutTenantInput;
    templates?: Prisma.TemplateCreateNestedManyWithoutTenantInput;
};
export type TenantUncheckedCreateWithoutContractsInput = {
    id?: string;
    name: string;
    plan?: $Enums.Plan;
    domain?: string | null;
    aiTokensUsed?: number;
    aiTokenLimit?: number;
    billingCycleStart?: Date | string;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    users?: Prisma.UserUncheckedCreateNestedManyWithoutTenantInput;
    templates?: Prisma.TemplateUncheckedCreateNestedManyWithoutTenantInput;
};
export type TenantCreateOrConnectWithoutContractsInput = {
    where: Prisma.TenantWhereUniqueInput;
    create: Prisma.XOR<Prisma.TenantCreateWithoutContractsInput, Prisma.TenantUncheckedCreateWithoutContractsInput>;
};
export type TenantUpsertWithoutContractsInput = {
    update: Prisma.XOR<Prisma.TenantUpdateWithoutContractsInput, Prisma.TenantUncheckedUpdateWithoutContractsInput>;
    create: Prisma.XOR<Prisma.TenantCreateWithoutContractsInput, Prisma.TenantUncheckedCreateWithoutContractsInput>;
    where?: Prisma.TenantWhereInput;
};
export type TenantUpdateToOneWithWhereWithoutContractsInput = {
    where?: Prisma.TenantWhereInput;
    data: Prisma.XOR<Prisma.TenantUpdateWithoutContractsInput, Prisma.TenantUncheckedUpdateWithoutContractsInput>;
};
export type TenantUpdateWithoutContractsInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    name?: Prisma.StringFieldUpdateOperationsInput | string;
    plan?: Prisma.EnumPlanFieldUpdateOperationsInput | $Enums.Plan;
    domain?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    aiTokensUsed?: Prisma.IntFieldUpdateOperationsInput | number;
    aiTokenLimit?: Prisma.IntFieldUpdateOperationsInput | number;
    billingCycleStart?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    users?: Prisma.UserUpdateManyWithoutTenantNestedInput;
    templates?: Prisma.TemplateUpdateManyWithoutTenantNestedInput;
};
export type TenantUncheckedUpdateWithoutContractsInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    name?: Prisma.StringFieldUpdateOperationsInput | string;
    plan?: Prisma.EnumPlanFieldUpdateOperationsInput | $Enums.Plan;
    domain?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    aiTokensUsed?: Prisma.IntFieldUpdateOperationsInput | number;
    aiTokenLimit?: Prisma.IntFieldUpdateOperationsInput | number;
    billingCycleStart?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    users?: Prisma.UserUncheckedUpdateManyWithoutTenantNestedInput;
    templates?: Prisma.TemplateUncheckedUpdateManyWithoutTenantNestedInput;
};
export type TenantCountOutputType = {
    users: number;
    contracts: number;
    templates: number;
};
export type TenantCountOutputTypeSelect<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    users?: boolean | TenantCountOutputTypeCountUsersArgs;
    contracts?: boolean | TenantCountOutputTypeCountContractsArgs;
    templates?: boolean | TenantCountOutputTypeCountTemplatesArgs;
};
export type TenantCountOutputTypeDefaultArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.TenantCountOutputTypeSelect<ExtArgs> | null;
};
export type TenantCountOutputTypeCountUsersArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.UserWhereInput;
};
export type TenantCountOutputTypeCountContractsArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.ContractWhereInput;
};
export type TenantCountOutputTypeCountTemplatesArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.TemplateWhereInput;
};
export type TenantSelect<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    name?: boolean;
    plan?: boolean;
    domain?: boolean;
    aiTokensUsed?: boolean;
    aiTokenLimit?: boolean;
    billingCycleStart?: boolean;
    createdAt?: boolean;
    updatedAt?: boolean;
    users?: boolean | Prisma.Tenant$usersArgs<ExtArgs>;
    contracts?: boolean | Prisma.Tenant$contractsArgs<ExtArgs>;
    templates?: boolean | Prisma.Tenant$templatesArgs<ExtArgs>;
    _count?: boolean | Prisma.TenantCountOutputTypeDefaultArgs<ExtArgs>;
}, ExtArgs["result"]["tenant"]>;
export type TenantSelectCreateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    name?: boolean;
    plan?: boolean;
    domain?: boolean;
    aiTokensUsed?: boolean;
    aiTokenLimit?: boolean;
    billingCycleStart?: boolean;
    createdAt?: boolean;
    updatedAt?: boolean;
}, ExtArgs["result"]["tenant"]>;
export type TenantSelectUpdateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    name?: boolean;
    plan?: boolean;
    domain?: boolean;
    aiTokensUsed?: boolean;
    aiTokenLimit?: boolean;
    billingCycleStart?: boolean;
    createdAt?: boolean;
    updatedAt?: boolean;
}, ExtArgs["result"]["tenant"]>;
export type TenantSelectScalar = {
    id?: boolean;
    name?: boolean;
    plan?: boolean;
    domain?: boolean;
    aiTokensUsed?: boolean;
    aiTokenLimit?: boolean;
    billingCycleStart?: boolean;
    createdAt?: boolean;
    updatedAt?: boolean;
};
export type TenantOmit<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetOmit<"id" | "name" | "plan" | "domain" | "aiTokensUsed" | "aiTokenLimit" | "billingCycleStart" | "createdAt" | "updatedAt", ExtArgs["result"]["tenant"]>;
export type TenantInclude<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    users?: boolean | Prisma.Tenant$usersArgs<ExtArgs>;
    contracts?: boolean | Prisma.Tenant$contractsArgs<ExtArgs>;
    templates?: boolean | Prisma.Tenant$templatesArgs<ExtArgs>;
    _count?: boolean | Prisma.TenantCountOutputTypeDefaultArgs<ExtArgs>;
};
export type TenantIncludeCreateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {};
export type TenantIncludeUpdateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {};
export type $TenantPayload<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    name: "Tenant";
    objects: {
        users: Prisma.$UserPayload<ExtArgs>[];
        contracts: Prisma.$ContractPayload<ExtArgs>[];
        templates: Prisma.$TemplatePayload<ExtArgs>[];
    };
    scalars: runtime.Types.Extensions.GetPayloadResult<{
        id: string;
        name: string;
        plan: $Enums.Plan;
        domain: string | null;
        aiTokensUsed: number;
        aiTokenLimit: number;
        billingCycleStart: Date;
        createdAt: Date;
        updatedAt: Date;
    }, ExtArgs["result"]["tenant"]>;
    composites: {};
};
export type TenantGetPayload<S extends boolean | null | undefined | TenantDefaultArgs> = runtime.Types.Result.GetResult<Prisma.$TenantPayload, S>;
export type TenantCountArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = Omit<TenantFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
    select?: TenantCountAggregateInputType | true;
};
export interface TenantDelegate<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: {
        types: Prisma.TypeMap<ExtArgs>['model']['Tenant'];
        meta: {
            name: 'Tenant';
        };
    };
    findUnique<T extends TenantFindUniqueArgs>(args: Prisma.SelectSubset<T, TenantFindUniqueArgs<ExtArgs>>): Prisma.Prisma__TenantClient<runtime.Types.Result.GetResult<Prisma.$TenantPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>;
    findUniqueOrThrow<T extends TenantFindUniqueOrThrowArgs>(args: Prisma.SelectSubset<T, TenantFindUniqueOrThrowArgs<ExtArgs>>): Prisma.Prisma__TenantClient<runtime.Types.Result.GetResult<Prisma.$TenantPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    findFirst<T extends TenantFindFirstArgs>(args?: Prisma.SelectSubset<T, TenantFindFirstArgs<ExtArgs>>): Prisma.Prisma__TenantClient<runtime.Types.Result.GetResult<Prisma.$TenantPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>;
    findFirstOrThrow<T extends TenantFindFirstOrThrowArgs>(args?: Prisma.SelectSubset<T, TenantFindFirstOrThrowArgs<ExtArgs>>): Prisma.Prisma__TenantClient<runtime.Types.Result.GetResult<Prisma.$TenantPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    findMany<T extends TenantFindManyArgs>(args?: Prisma.SelectSubset<T, TenantFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$TenantPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>;
    create<T extends TenantCreateArgs>(args: Prisma.SelectSubset<T, TenantCreateArgs<ExtArgs>>): Prisma.Prisma__TenantClient<runtime.Types.Result.GetResult<Prisma.$TenantPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    createMany<T extends TenantCreateManyArgs>(args?: Prisma.SelectSubset<T, TenantCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    createManyAndReturn<T extends TenantCreateManyAndReturnArgs>(args?: Prisma.SelectSubset<T, TenantCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$TenantPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>;
    delete<T extends TenantDeleteArgs>(args: Prisma.SelectSubset<T, TenantDeleteArgs<ExtArgs>>): Prisma.Prisma__TenantClient<runtime.Types.Result.GetResult<Prisma.$TenantPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    update<T extends TenantUpdateArgs>(args: Prisma.SelectSubset<T, TenantUpdateArgs<ExtArgs>>): Prisma.Prisma__TenantClient<runtime.Types.Result.GetResult<Prisma.$TenantPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    deleteMany<T extends TenantDeleteManyArgs>(args?: Prisma.SelectSubset<T, TenantDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    updateMany<T extends TenantUpdateManyArgs>(args: Prisma.SelectSubset<T, TenantUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    updateManyAndReturn<T extends TenantUpdateManyAndReturnArgs>(args: Prisma.SelectSubset<T, TenantUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$TenantPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>;
    upsert<T extends TenantUpsertArgs>(args: Prisma.SelectSubset<T, TenantUpsertArgs<ExtArgs>>): Prisma.Prisma__TenantClient<runtime.Types.Result.GetResult<Prisma.$TenantPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    count<T extends TenantCountArgs>(args?: Prisma.Subset<T, TenantCountArgs>): Prisma.PrismaPromise<T extends runtime.Types.Utils.Record<'select', any> ? T['select'] extends true ? number : Prisma.GetScalarType<T['select'], TenantCountAggregateOutputType> : number>;
    aggregate<T extends TenantAggregateArgs>(args: Prisma.Subset<T, TenantAggregateArgs>): Prisma.PrismaPromise<GetTenantAggregateType<T>>;
    groupBy<T extends TenantGroupByArgs, HasSelectOrTake extends Prisma.Or<Prisma.Extends<'skip', Prisma.Keys<T>>, Prisma.Extends<'take', Prisma.Keys<T>>>, OrderByArg extends Prisma.True extends HasSelectOrTake ? {
        orderBy: TenantGroupByArgs['orderBy'];
    } : {
        orderBy?: TenantGroupByArgs['orderBy'];
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
    }[OrderFields]>(args: Prisma.SubsetIntersection<T, TenantGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetTenantGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>;
    readonly fields: TenantFieldRefs;
}
export interface Prisma__TenantClient<T, Null = never, ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise";
    users<T extends Prisma.Tenant$usersArgs<ExtArgs> = {}>(args?: Prisma.Subset<T, Prisma.Tenant$usersArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>;
    contracts<T extends Prisma.Tenant$contractsArgs<ExtArgs> = {}>(args?: Prisma.Subset<T, Prisma.Tenant$contractsArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$ContractPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>;
    templates<T extends Prisma.Tenant$templatesArgs<ExtArgs> = {}>(args?: Prisma.Subset<T, Prisma.Tenant$templatesArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$TemplatePayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>;
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): runtime.Types.Utils.JsPromise<TResult1 | TResult2>;
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): runtime.Types.Utils.JsPromise<T | TResult>;
    finally(onfinally?: (() => void) | undefined | null): runtime.Types.Utils.JsPromise<T>;
}
export interface TenantFieldRefs {
    readonly id: Prisma.FieldRef<"Tenant", 'String'>;
    readonly name: Prisma.FieldRef<"Tenant", 'String'>;
    readonly plan: Prisma.FieldRef<"Tenant", 'Plan'>;
    readonly domain: Prisma.FieldRef<"Tenant", 'String'>;
    readonly aiTokensUsed: Prisma.FieldRef<"Tenant", 'Int'>;
    readonly aiTokenLimit: Prisma.FieldRef<"Tenant", 'Int'>;
    readonly billingCycleStart: Prisma.FieldRef<"Tenant", 'DateTime'>;
    readonly createdAt: Prisma.FieldRef<"Tenant", 'DateTime'>;
    readonly updatedAt: Prisma.FieldRef<"Tenant", 'DateTime'>;
}
export type TenantFindUniqueArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.TenantSelect<ExtArgs> | null;
    omit?: Prisma.TenantOmit<ExtArgs> | null;
    include?: Prisma.TenantInclude<ExtArgs> | null;
    where: Prisma.TenantWhereUniqueInput;
};
export type TenantFindUniqueOrThrowArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.TenantSelect<ExtArgs> | null;
    omit?: Prisma.TenantOmit<ExtArgs> | null;
    include?: Prisma.TenantInclude<ExtArgs> | null;
    where: Prisma.TenantWhereUniqueInput;
};
export type TenantFindFirstArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.TenantSelect<ExtArgs> | null;
    omit?: Prisma.TenantOmit<ExtArgs> | null;
    include?: Prisma.TenantInclude<ExtArgs> | null;
    where?: Prisma.TenantWhereInput;
    orderBy?: Prisma.TenantOrderByWithRelationInput | Prisma.TenantOrderByWithRelationInput[];
    cursor?: Prisma.TenantWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.TenantScalarFieldEnum | Prisma.TenantScalarFieldEnum[];
};
export type TenantFindFirstOrThrowArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.TenantSelect<ExtArgs> | null;
    omit?: Prisma.TenantOmit<ExtArgs> | null;
    include?: Prisma.TenantInclude<ExtArgs> | null;
    where?: Prisma.TenantWhereInput;
    orderBy?: Prisma.TenantOrderByWithRelationInput | Prisma.TenantOrderByWithRelationInput[];
    cursor?: Prisma.TenantWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.TenantScalarFieldEnum | Prisma.TenantScalarFieldEnum[];
};
export type TenantFindManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.TenantSelect<ExtArgs> | null;
    omit?: Prisma.TenantOmit<ExtArgs> | null;
    include?: Prisma.TenantInclude<ExtArgs> | null;
    where?: Prisma.TenantWhereInput;
    orderBy?: Prisma.TenantOrderByWithRelationInput | Prisma.TenantOrderByWithRelationInput[];
    cursor?: Prisma.TenantWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.TenantScalarFieldEnum | Prisma.TenantScalarFieldEnum[];
};
export type TenantCreateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.TenantSelect<ExtArgs> | null;
    omit?: Prisma.TenantOmit<ExtArgs> | null;
    include?: Prisma.TenantInclude<ExtArgs> | null;
    data: Prisma.XOR<Prisma.TenantCreateInput, Prisma.TenantUncheckedCreateInput>;
};
export type TenantCreateManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    data: Prisma.TenantCreateManyInput | Prisma.TenantCreateManyInput[];
    skipDuplicates?: boolean;
};
export type TenantCreateManyAndReturnArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.TenantSelectCreateManyAndReturn<ExtArgs> | null;
    omit?: Prisma.TenantOmit<ExtArgs> | null;
    data: Prisma.TenantCreateManyInput | Prisma.TenantCreateManyInput[];
    skipDuplicates?: boolean;
};
export type TenantUpdateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.TenantSelect<ExtArgs> | null;
    omit?: Prisma.TenantOmit<ExtArgs> | null;
    include?: Prisma.TenantInclude<ExtArgs> | null;
    data: Prisma.XOR<Prisma.TenantUpdateInput, Prisma.TenantUncheckedUpdateInput>;
    where: Prisma.TenantWhereUniqueInput;
};
export type TenantUpdateManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    data: Prisma.XOR<Prisma.TenantUpdateManyMutationInput, Prisma.TenantUncheckedUpdateManyInput>;
    where?: Prisma.TenantWhereInput;
    limit?: number;
};
export type TenantUpdateManyAndReturnArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.TenantSelectUpdateManyAndReturn<ExtArgs> | null;
    omit?: Prisma.TenantOmit<ExtArgs> | null;
    data: Prisma.XOR<Prisma.TenantUpdateManyMutationInput, Prisma.TenantUncheckedUpdateManyInput>;
    where?: Prisma.TenantWhereInput;
    limit?: number;
};
export type TenantUpsertArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.TenantSelect<ExtArgs> | null;
    omit?: Prisma.TenantOmit<ExtArgs> | null;
    include?: Prisma.TenantInclude<ExtArgs> | null;
    where: Prisma.TenantWhereUniqueInput;
    create: Prisma.XOR<Prisma.TenantCreateInput, Prisma.TenantUncheckedCreateInput>;
    update: Prisma.XOR<Prisma.TenantUpdateInput, Prisma.TenantUncheckedUpdateInput>;
};
export type TenantDeleteArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.TenantSelect<ExtArgs> | null;
    omit?: Prisma.TenantOmit<ExtArgs> | null;
    include?: Prisma.TenantInclude<ExtArgs> | null;
    where: Prisma.TenantWhereUniqueInput;
};
export type TenantDeleteManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.TenantWhereInput;
    limit?: number;
};
export type Tenant$usersArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.UserSelect<ExtArgs> | null;
    omit?: Prisma.UserOmit<ExtArgs> | null;
    include?: Prisma.UserInclude<ExtArgs> | null;
    where?: Prisma.UserWhereInput;
    orderBy?: Prisma.UserOrderByWithRelationInput | Prisma.UserOrderByWithRelationInput[];
    cursor?: Prisma.UserWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.UserScalarFieldEnum | Prisma.UserScalarFieldEnum[];
};
export type Tenant$contractsArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
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
export type Tenant$templatesArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
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
export type TenantDefaultArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.TenantSelect<ExtArgs> | null;
    omit?: Prisma.TenantOmit<ExtArgs> | null;
    include?: Prisma.TenantInclude<ExtArgs> | null;
};

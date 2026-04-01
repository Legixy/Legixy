import type * as runtime from "@prisma/client/runtime/client";
import type * as Prisma from "../internal/prismaNamespace";
export type ContractVersionModel = runtime.Types.Result.DefaultSelection<Prisma.$ContractVersionPayload>;
export type AggregateContractVersion = {
    _count: ContractVersionCountAggregateOutputType | null;
    _avg: ContractVersionAvgAggregateOutputType | null;
    _sum: ContractVersionSumAggregateOutputType | null;
    _min: ContractVersionMinAggregateOutputType | null;
    _max: ContractVersionMaxAggregateOutputType | null;
};
export type ContractVersionAvgAggregateOutputType = {
    version: number | null;
};
export type ContractVersionSumAggregateOutputType = {
    version: number | null;
};
export type ContractVersionMinAggregateOutputType = {
    id: string | null;
    contractId: string | null;
    version: number | null;
    content: string | null;
    changeNote: string | null;
    changedBy: string | null;
    createdAt: Date | null;
};
export type ContractVersionMaxAggregateOutputType = {
    id: string | null;
    contractId: string | null;
    version: number | null;
    content: string | null;
    changeNote: string | null;
    changedBy: string | null;
    createdAt: Date | null;
};
export type ContractVersionCountAggregateOutputType = {
    id: number;
    contractId: number;
    version: number;
    content: number;
    changeNote: number;
    changedBy: number;
    createdAt: number;
    _all: number;
};
export type ContractVersionAvgAggregateInputType = {
    version?: true;
};
export type ContractVersionSumAggregateInputType = {
    version?: true;
};
export type ContractVersionMinAggregateInputType = {
    id?: true;
    contractId?: true;
    version?: true;
    content?: true;
    changeNote?: true;
    changedBy?: true;
    createdAt?: true;
};
export type ContractVersionMaxAggregateInputType = {
    id?: true;
    contractId?: true;
    version?: true;
    content?: true;
    changeNote?: true;
    changedBy?: true;
    createdAt?: true;
};
export type ContractVersionCountAggregateInputType = {
    id?: true;
    contractId?: true;
    version?: true;
    content?: true;
    changeNote?: true;
    changedBy?: true;
    createdAt?: true;
    _all?: true;
};
export type ContractVersionAggregateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.ContractVersionWhereInput;
    orderBy?: Prisma.ContractVersionOrderByWithRelationInput | Prisma.ContractVersionOrderByWithRelationInput[];
    cursor?: Prisma.ContractVersionWhereUniqueInput;
    take?: number;
    skip?: number;
    _count?: true | ContractVersionCountAggregateInputType;
    _avg?: ContractVersionAvgAggregateInputType;
    _sum?: ContractVersionSumAggregateInputType;
    _min?: ContractVersionMinAggregateInputType;
    _max?: ContractVersionMaxAggregateInputType;
};
export type GetContractVersionAggregateType<T extends ContractVersionAggregateArgs> = {
    [P in keyof T & keyof AggregateContractVersion]: P extends '_count' | 'count' ? T[P] extends true ? number : Prisma.GetScalarType<T[P], AggregateContractVersion[P]> : Prisma.GetScalarType<T[P], AggregateContractVersion[P]>;
};
export type ContractVersionGroupByArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.ContractVersionWhereInput;
    orderBy?: Prisma.ContractVersionOrderByWithAggregationInput | Prisma.ContractVersionOrderByWithAggregationInput[];
    by: Prisma.ContractVersionScalarFieldEnum[] | Prisma.ContractVersionScalarFieldEnum;
    having?: Prisma.ContractVersionScalarWhereWithAggregatesInput;
    take?: number;
    skip?: number;
    _count?: ContractVersionCountAggregateInputType | true;
    _avg?: ContractVersionAvgAggregateInputType;
    _sum?: ContractVersionSumAggregateInputType;
    _min?: ContractVersionMinAggregateInputType;
    _max?: ContractVersionMaxAggregateInputType;
};
export type ContractVersionGroupByOutputType = {
    id: string;
    contractId: string;
    version: number;
    content: string;
    changeNote: string | null;
    changedBy: string;
    createdAt: Date;
    _count: ContractVersionCountAggregateOutputType | null;
    _avg: ContractVersionAvgAggregateOutputType | null;
    _sum: ContractVersionSumAggregateOutputType | null;
    _min: ContractVersionMinAggregateOutputType | null;
    _max: ContractVersionMaxAggregateOutputType | null;
};
export type GetContractVersionGroupByPayload<T extends ContractVersionGroupByArgs> = Prisma.PrismaPromise<Array<Prisma.PickEnumerable<ContractVersionGroupByOutputType, T['by']> & {
    [P in ((keyof T) & (keyof ContractVersionGroupByOutputType))]: P extends '_count' ? T[P] extends boolean ? number : Prisma.GetScalarType<T[P], ContractVersionGroupByOutputType[P]> : Prisma.GetScalarType<T[P], ContractVersionGroupByOutputType[P]>;
}>>;
export type ContractVersionWhereInput = {
    AND?: Prisma.ContractVersionWhereInput | Prisma.ContractVersionWhereInput[];
    OR?: Prisma.ContractVersionWhereInput[];
    NOT?: Prisma.ContractVersionWhereInput | Prisma.ContractVersionWhereInput[];
    id?: Prisma.StringFilter<"ContractVersion"> | string;
    contractId?: Prisma.StringFilter<"ContractVersion"> | string;
    version?: Prisma.IntFilter<"ContractVersion"> | number;
    content?: Prisma.StringFilter<"ContractVersion"> | string;
    changeNote?: Prisma.StringNullableFilter<"ContractVersion"> | string | null;
    changedBy?: Prisma.StringFilter<"ContractVersion"> | string;
    createdAt?: Prisma.DateTimeFilter<"ContractVersion"> | Date | string;
    contract?: Prisma.XOR<Prisma.ContractScalarRelationFilter, Prisma.ContractWhereInput>;
};
export type ContractVersionOrderByWithRelationInput = {
    id?: Prisma.SortOrder;
    contractId?: Prisma.SortOrder;
    version?: Prisma.SortOrder;
    content?: Prisma.SortOrder;
    changeNote?: Prisma.SortOrderInput | Prisma.SortOrder;
    changedBy?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    contract?: Prisma.ContractOrderByWithRelationInput;
};
export type ContractVersionWhereUniqueInput = Prisma.AtLeast<{
    id?: string;
    contractId_version?: Prisma.ContractVersionContractIdVersionCompoundUniqueInput;
    AND?: Prisma.ContractVersionWhereInput | Prisma.ContractVersionWhereInput[];
    OR?: Prisma.ContractVersionWhereInput[];
    NOT?: Prisma.ContractVersionWhereInput | Prisma.ContractVersionWhereInput[];
    contractId?: Prisma.StringFilter<"ContractVersion"> | string;
    version?: Prisma.IntFilter<"ContractVersion"> | number;
    content?: Prisma.StringFilter<"ContractVersion"> | string;
    changeNote?: Prisma.StringNullableFilter<"ContractVersion"> | string | null;
    changedBy?: Prisma.StringFilter<"ContractVersion"> | string;
    createdAt?: Prisma.DateTimeFilter<"ContractVersion"> | Date | string;
    contract?: Prisma.XOR<Prisma.ContractScalarRelationFilter, Prisma.ContractWhereInput>;
}, "id" | "contractId_version">;
export type ContractVersionOrderByWithAggregationInput = {
    id?: Prisma.SortOrder;
    contractId?: Prisma.SortOrder;
    version?: Prisma.SortOrder;
    content?: Prisma.SortOrder;
    changeNote?: Prisma.SortOrderInput | Prisma.SortOrder;
    changedBy?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    _count?: Prisma.ContractVersionCountOrderByAggregateInput;
    _avg?: Prisma.ContractVersionAvgOrderByAggregateInput;
    _max?: Prisma.ContractVersionMaxOrderByAggregateInput;
    _min?: Prisma.ContractVersionMinOrderByAggregateInput;
    _sum?: Prisma.ContractVersionSumOrderByAggregateInput;
};
export type ContractVersionScalarWhereWithAggregatesInput = {
    AND?: Prisma.ContractVersionScalarWhereWithAggregatesInput | Prisma.ContractVersionScalarWhereWithAggregatesInput[];
    OR?: Prisma.ContractVersionScalarWhereWithAggregatesInput[];
    NOT?: Prisma.ContractVersionScalarWhereWithAggregatesInput | Prisma.ContractVersionScalarWhereWithAggregatesInput[];
    id?: Prisma.StringWithAggregatesFilter<"ContractVersion"> | string;
    contractId?: Prisma.StringWithAggregatesFilter<"ContractVersion"> | string;
    version?: Prisma.IntWithAggregatesFilter<"ContractVersion"> | number;
    content?: Prisma.StringWithAggregatesFilter<"ContractVersion"> | string;
    changeNote?: Prisma.StringNullableWithAggregatesFilter<"ContractVersion"> | string | null;
    changedBy?: Prisma.StringWithAggregatesFilter<"ContractVersion"> | string;
    createdAt?: Prisma.DateTimeWithAggregatesFilter<"ContractVersion"> | Date | string;
};
export type ContractVersionCreateInput = {
    id?: string;
    version: number;
    content: string;
    changeNote?: string | null;
    changedBy: string;
    createdAt?: Date | string;
    contract: Prisma.ContractCreateNestedOneWithoutVersionsInput;
};
export type ContractVersionUncheckedCreateInput = {
    id?: string;
    contractId: string;
    version: number;
    content: string;
    changeNote?: string | null;
    changedBy: string;
    createdAt?: Date | string;
};
export type ContractVersionUpdateInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    version?: Prisma.IntFieldUpdateOperationsInput | number;
    content?: Prisma.StringFieldUpdateOperationsInput | string;
    changeNote?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    changedBy?: Prisma.StringFieldUpdateOperationsInput | string;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    contract?: Prisma.ContractUpdateOneRequiredWithoutVersionsNestedInput;
};
export type ContractVersionUncheckedUpdateInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    contractId?: Prisma.StringFieldUpdateOperationsInput | string;
    version?: Prisma.IntFieldUpdateOperationsInput | number;
    content?: Prisma.StringFieldUpdateOperationsInput | string;
    changeNote?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    changedBy?: Prisma.StringFieldUpdateOperationsInput | string;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type ContractVersionCreateManyInput = {
    id?: string;
    contractId: string;
    version: number;
    content: string;
    changeNote?: string | null;
    changedBy: string;
    createdAt?: Date | string;
};
export type ContractVersionUpdateManyMutationInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    version?: Prisma.IntFieldUpdateOperationsInput | number;
    content?: Prisma.StringFieldUpdateOperationsInput | string;
    changeNote?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    changedBy?: Prisma.StringFieldUpdateOperationsInput | string;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type ContractVersionUncheckedUpdateManyInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    contractId?: Prisma.StringFieldUpdateOperationsInput | string;
    version?: Prisma.IntFieldUpdateOperationsInput | number;
    content?: Prisma.StringFieldUpdateOperationsInput | string;
    changeNote?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    changedBy?: Prisma.StringFieldUpdateOperationsInput | string;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type ContractVersionListRelationFilter = {
    every?: Prisma.ContractVersionWhereInput;
    some?: Prisma.ContractVersionWhereInput;
    none?: Prisma.ContractVersionWhereInput;
};
export type ContractVersionOrderByRelationAggregateInput = {
    _count?: Prisma.SortOrder;
};
export type ContractVersionContractIdVersionCompoundUniqueInput = {
    contractId: string;
    version: number;
};
export type ContractVersionCountOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    contractId?: Prisma.SortOrder;
    version?: Prisma.SortOrder;
    content?: Prisma.SortOrder;
    changeNote?: Prisma.SortOrder;
    changedBy?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
};
export type ContractVersionAvgOrderByAggregateInput = {
    version?: Prisma.SortOrder;
};
export type ContractVersionMaxOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    contractId?: Prisma.SortOrder;
    version?: Prisma.SortOrder;
    content?: Prisma.SortOrder;
    changeNote?: Prisma.SortOrder;
    changedBy?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
};
export type ContractVersionMinOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    contractId?: Prisma.SortOrder;
    version?: Prisma.SortOrder;
    content?: Prisma.SortOrder;
    changeNote?: Prisma.SortOrder;
    changedBy?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
};
export type ContractVersionSumOrderByAggregateInput = {
    version?: Prisma.SortOrder;
};
export type ContractVersionCreateNestedManyWithoutContractInput = {
    create?: Prisma.XOR<Prisma.ContractVersionCreateWithoutContractInput, Prisma.ContractVersionUncheckedCreateWithoutContractInput> | Prisma.ContractVersionCreateWithoutContractInput[] | Prisma.ContractVersionUncheckedCreateWithoutContractInput[];
    connectOrCreate?: Prisma.ContractVersionCreateOrConnectWithoutContractInput | Prisma.ContractVersionCreateOrConnectWithoutContractInput[];
    createMany?: Prisma.ContractVersionCreateManyContractInputEnvelope;
    connect?: Prisma.ContractVersionWhereUniqueInput | Prisma.ContractVersionWhereUniqueInput[];
};
export type ContractVersionUncheckedCreateNestedManyWithoutContractInput = {
    create?: Prisma.XOR<Prisma.ContractVersionCreateWithoutContractInput, Prisma.ContractVersionUncheckedCreateWithoutContractInput> | Prisma.ContractVersionCreateWithoutContractInput[] | Prisma.ContractVersionUncheckedCreateWithoutContractInput[];
    connectOrCreate?: Prisma.ContractVersionCreateOrConnectWithoutContractInput | Prisma.ContractVersionCreateOrConnectWithoutContractInput[];
    createMany?: Prisma.ContractVersionCreateManyContractInputEnvelope;
    connect?: Prisma.ContractVersionWhereUniqueInput | Prisma.ContractVersionWhereUniqueInput[];
};
export type ContractVersionUpdateManyWithoutContractNestedInput = {
    create?: Prisma.XOR<Prisma.ContractVersionCreateWithoutContractInput, Prisma.ContractVersionUncheckedCreateWithoutContractInput> | Prisma.ContractVersionCreateWithoutContractInput[] | Prisma.ContractVersionUncheckedCreateWithoutContractInput[];
    connectOrCreate?: Prisma.ContractVersionCreateOrConnectWithoutContractInput | Prisma.ContractVersionCreateOrConnectWithoutContractInput[];
    upsert?: Prisma.ContractVersionUpsertWithWhereUniqueWithoutContractInput | Prisma.ContractVersionUpsertWithWhereUniqueWithoutContractInput[];
    createMany?: Prisma.ContractVersionCreateManyContractInputEnvelope;
    set?: Prisma.ContractVersionWhereUniqueInput | Prisma.ContractVersionWhereUniqueInput[];
    disconnect?: Prisma.ContractVersionWhereUniqueInput | Prisma.ContractVersionWhereUniqueInput[];
    delete?: Prisma.ContractVersionWhereUniqueInput | Prisma.ContractVersionWhereUniqueInput[];
    connect?: Prisma.ContractVersionWhereUniqueInput | Prisma.ContractVersionWhereUniqueInput[];
    update?: Prisma.ContractVersionUpdateWithWhereUniqueWithoutContractInput | Prisma.ContractVersionUpdateWithWhereUniqueWithoutContractInput[];
    updateMany?: Prisma.ContractVersionUpdateManyWithWhereWithoutContractInput | Prisma.ContractVersionUpdateManyWithWhereWithoutContractInput[];
    deleteMany?: Prisma.ContractVersionScalarWhereInput | Prisma.ContractVersionScalarWhereInput[];
};
export type ContractVersionUncheckedUpdateManyWithoutContractNestedInput = {
    create?: Prisma.XOR<Prisma.ContractVersionCreateWithoutContractInput, Prisma.ContractVersionUncheckedCreateWithoutContractInput> | Prisma.ContractVersionCreateWithoutContractInput[] | Prisma.ContractVersionUncheckedCreateWithoutContractInput[];
    connectOrCreate?: Prisma.ContractVersionCreateOrConnectWithoutContractInput | Prisma.ContractVersionCreateOrConnectWithoutContractInput[];
    upsert?: Prisma.ContractVersionUpsertWithWhereUniqueWithoutContractInput | Prisma.ContractVersionUpsertWithWhereUniqueWithoutContractInput[];
    createMany?: Prisma.ContractVersionCreateManyContractInputEnvelope;
    set?: Prisma.ContractVersionWhereUniqueInput | Prisma.ContractVersionWhereUniqueInput[];
    disconnect?: Prisma.ContractVersionWhereUniqueInput | Prisma.ContractVersionWhereUniqueInput[];
    delete?: Prisma.ContractVersionWhereUniqueInput | Prisma.ContractVersionWhereUniqueInput[];
    connect?: Prisma.ContractVersionWhereUniqueInput | Prisma.ContractVersionWhereUniqueInput[];
    update?: Prisma.ContractVersionUpdateWithWhereUniqueWithoutContractInput | Prisma.ContractVersionUpdateWithWhereUniqueWithoutContractInput[];
    updateMany?: Prisma.ContractVersionUpdateManyWithWhereWithoutContractInput | Prisma.ContractVersionUpdateManyWithWhereWithoutContractInput[];
    deleteMany?: Prisma.ContractVersionScalarWhereInput | Prisma.ContractVersionScalarWhereInput[];
};
export type ContractVersionCreateWithoutContractInput = {
    id?: string;
    version: number;
    content: string;
    changeNote?: string | null;
    changedBy: string;
    createdAt?: Date | string;
};
export type ContractVersionUncheckedCreateWithoutContractInput = {
    id?: string;
    version: number;
    content: string;
    changeNote?: string | null;
    changedBy: string;
    createdAt?: Date | string;
};
export type ContractVersionCreateOrConnectWithoutContractInput = {
    where: Prisma.ContractVersionWhereUniqueInput;
    create: Prisma.XOR<Prisma.ContractVersionCreateWithoutContractInput, Prisma.ContractVersionUncheckedCreateWithoutContractInput>;
};
export type ContractVersionCreateManyContractInputEnvelope = {
    data: Prisma.ContractVersionCreateManyContractInput | Prisma.ContractVersionCreateManyContractInput[];
    skipDuplicates?: boolean;
};
export type ContractVersionUpsertWithWhereUniqueWithoutContractInput = {
    where: Prisma.ContractVersionWhereUniqueInput;
    update: Prisma.XOR<Prisma.ContractVersionUpdateWithoutContractInput, Prisma.ContractVersionUncheckedUpdateWithoutContractInput>;
    create: Prisma.XOR<Prisma.ContractVersionCreateWithoutContractInput, Prisma.ContractVersionUncheckedCreateWithoutContractInput>;
};
export type ContractVersionUpdateWithWhereUniqueWithoutContractInput = {
    where: Prisma.ContractVersionWhereUniqueInput;
    data: Prisma.XOR<Prisma.ContractVersionUpdateWithoutContractInput, Prisma.ContractVersionUncheckedUpdateWithoutContractInput>;
};
export type ContractVersionUpdateManyWithWhereWithoutContractInput = {
    where: Prisma.ContractVersionScalarWhereInput;
    data: Prisma.XOR<Prisma.ContractVersionUpdateManyMutationInput, Prisma.ContractVersionUncheckedUpdateManyWithoutContractInput>;
};
export type ContractVersionScalarWhereInput = {
    AND?: Prisma.ContractVersionScalarWhereInput | Prisma.ContractVersionScalarWhereInput[];
    OR?: Prisma.ContractVersionScalarWhereInput[];
    NOT?: Prisma.ContractVersionScalarWhereInput | Prisma.ContractVersionScalarWhereInput[];
    id?: Prisma.StringFilter<"ContractVersion"> | string;
    contractId?: Prisma.StringFilter<"ContractVersion"> | string;
    version?: Prisma.IntFilter<"ContractVersion"> | number;
    content?: Prisma.StringFilter<"ContractVersion"> | string;
    changeNote?: Prisma.StringNullableFilter<"ContractVersion"> | string | null;
    changedBy?: Prisma.StringFilter<"ContractVersion"> | string;
    createdAt?: Prisma.DateTimeFilter<"ContractVersion"> | Date | string;
};
export type ContractVersionCreateManyContractInput = {
    id?: string;
    version: number;
    content: string;
    changeNote?: string | null;
    changedBy: string;
    createdAt?: Date | string;
};
export type ContractVersionUpdateWithoutContractInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    version?: Prisma.IntFieldUpdateOperationsInput | number;
    content?: Prisma.StringFieldUpdateOperationsInput | string;
    changeNote?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    changedBy?: Prisma.StringFieldUpdateOperationsInput | string;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type ContractVersionUncheckedUpdateWithoutContractInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    version?: Prisma.IntFieldUpdateOperationsInput | number;
    content?: Prisma.StringFieldUpdateOperationsInput | string;
    changeNote?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    changedBy?: Prisma.StringFieldUpdateOperationsInput | string;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type ContractVersionUncheckedUpdateManyWithoutContractInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    version?: Prisma.IntFieldUpdateOperationsInput | number;
    content?: Prisma.StringFieldUpdateOperationsInput | string;
    changeNote?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    changedBy?: Prisma.StringFieldUpdateOperationsInput | string;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type ContractVersionSelect<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    contractId?: boolean;
    version?: boolean;
    content?: boolean;
    changeNote?: boolean;
    changedBy?: boolean;
    createdAt?: boolean;
    contract?: boolean | Prisma.ContractDefaultArgs<ExtArgs>;
}, ExtArgs["result"]["contractVersion"]>;
export type ContractVersionSelectCreateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    contractId?: boolean;
    version?: boolean;
    content?: boolean;
    changeNote?: boolean;
    changedBy?: boolean;
    createdAt?: boolean;
    contract?: boolean | Prisma.ContractDefaultArgs<ExtArgs>;
}, ExtArgs["result"]["contractVersion"]>;
export type ContractVersionSelectUpdateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    contractId?: boolean;
    version?: boolean;
    content?: boolean;
    changeNote?: boolean;
    changedBy?: boolean;
    createdAt?: boolean;
    contract?: boolean | Prisma.ContractDefaultArgs<ExtArgs>;
}, ExtArgs["result"]["contractVersion"]>;
export type ContractVersionSelectScalar = {
    id?: boolean;
    contractId?: boolean;
    version?: boolean;
    content?: boolean;
    changeNote?: boolean;
    changedBy?: boolean;
    createdAt?: boolean;
};
export type ContractVersionOmit<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetOmit<"id" | "contractId" | "version" | "content" | "changeNote" | "changedBy" | "createdAt", ExtArgs["result"]["contractVersion"]>;
export type ContractVersionInclude<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    contract?: boolean | Prisma.ContractDefaultArgs<ExtArgs>;
};
export type ContractVersionIncludeCreateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    contract?: boolean | Prisma.ContractDefaultArgs<ExtArgs>;
};
export type ContractVersionIncludeUpdateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    contract?: boolean | Prisma.ContractDefaultArgs<ExtArgs>;
};
export type $ContractVersionPayload<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    name: "ContractVersion";
    objects: {
        contract: Prisma.$ContractPayload<ExtArgs>;
    };
    scalars: runtime.Types.Extensions.GetPayloadResult<{
        id: string;
        contractId: string;
        version: number;
        content: string;
        changeNote: string | null;
        changedBy: string;
        createdAt: Date;
    }, ExtArgs["result"]["contractVersion"]>;
    composites: {};
};
export type ContractVersionGetPayload<S extends boolean | null | undefined | ContractVersionDefaultArgs> = runtime.Types.Result.GetResult<Prisma.$ContractVersionPayload, S>;
export type ContractVersionCountArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = Omit<ContractVersionFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
    select?: ContractVersionCountAggregateInputType | true;
};
export interface ContractVersionDelegate<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: {
        types: Prisma.TypeMap<ExtArgs>['model']['ContractVersion'];
        meta: {
            name: 'ContractVersion';
        };
    };
    findUnique<T extends ContractVersionFindUniqueArgs>(args: Prisma.SelectSubset<T, ContractVersionFindUniqueArgs<ExtArgs>>): Prisma.Prisma__ContractVersionClient<runtime.Types.Result.GetResult<Prisma.$ContractVersionPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>;
    findUniqueOrThrow<T extends ContractVersionFindUniqueOrThrowArgs>(args: Prisma.SelectSubset<T, ContractVersionFindUniqueOrThrowArgs<ExtArgs>>): Prisma.Prisma__ContractVersionClient<runtime.Types.Result.GetResult<Prisma.$ContractVersionPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    findFirst<T extends ContractVersionFindFirstArgs>(args?: Prisma.SelectSubset<T, ContractVersionFindFirstArgs<ExtArgs>>): Prisma.Prisma__ContractVersionClient<runtime.Types.Result.GetResult<Prisma.$ContractVersionPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>;
    findFirstOrThrow<T extends ContractVersionFindFirstOrThrowArgs>(args?: Prisma.SelectSubset<T, ContractVersionFindFirstOrThrowArgs<ExtArgs>>): Prisma.Prisma__ContractVersionClient<runtime.Types.Result.GetResult<Prisma.$ContractVersionPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    findMany<T extends ContractVersionFindManyArgs>(args?: Prisma.SelectSubset<T, ContractVersionFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$ContractVersionPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>;
    create<T extends ContractVersionCreateArgs>(args: Prisma.SelectSubset<T, ContractVersionCreateArgs<ExtArgs>>): Prisma.Prisma__ContractVersionClient<runtime.Types.Result.GetResult<Prisma.$ContractVersionPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    createMany<T extends ContractVersionCreateManyArgs>(args?: Prisma.SelectSubset<T, ContractVersionCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    createManyAndReturn<T extends ContractVersionCreateManyAndReturnArgs>(args?: Prisma.SelectSubset<T, ContractVersionCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$ContractVersionPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>;
    delete<T extends ContractVersionDeleteArgs>(args: Prisma.SelectSubset<T, ContractVersionDeleteArgs<ExtArgs>>): Prisma.Prisma__ContractVersionClient<runtime.Types.Result.GetResult<Prisma.$ContractVersionPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    update<T extends ContractVersionUpdateArgs>(args: Prisma.SelectSubset<T, ContractVersionUpdateArgs<ExtArgs>>): Prisma.Prisma__ContractVersionClient<runtime.Types.Result.GetResult<Prisma.$ContractVersionPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    deleteMany<T extends ContractVersionDeleteManyArgs>(args?: Prisma.SelectSubset<T, ContractVersionDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    updateMany<T extends ContractVersionUpdateManyArgs>(args: Prisma.SelectSubset<T, ContractVersionUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    updateManyAndReturn<T extends ContractVersionUpdateManyAndReturnArgs>(args: Prisma.SelectSubset<T, ContractVersionUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$ContractVersionPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>;
    upsert<T extends ContractVersionUpsertArgs>(args: Prisma.SelectSubset<T, ContractVersionUpsertArgs<ExtArgs>>): Prisma.Prisma__ContractVersionClient<runtime.Types.Result.GetResult<Prisma.$ContractVersionPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    count<T extends ContractVersionCountArgs>(args?: Prisma.Subset<T, ContractVersionCountArgs>): Prisma.PrismaPromise<T extends runtime.Types.Utils.Record<'select', any> ? T['select'] extends true ? number : Prisma.GetScalarType<T['select'], ContractVersionCountAggregateOutputType> : number>;
    aggregate<T extends ContractVersionAggregateArgs>(args: Prisma.Subset<T, ContractVersionAggregateArgs>): Prisma.PrismaPromise<GetContractVersionAggregateType<T>>;
    groupBy<T extends ContractVersionGroupByArgs, HasSelectOrTake extends Prisma.Or<Prisma.Extends<'skip', Prisma.Keys<T>>, Prisma.Extends<'take', Prisma.Keys<T>>>, OrderByArg extends Prisma.True extends HasSelectOrTake ? {
        orderBy: ContractVersionGroupByArgs['orderBy'];
    } : {
        orderBy?: ContractVersionGroupByArgs['orderBy'];
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
    }[OrderFields]>(args: Prisma.SubsetIntersection<T, ContractVersionGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetContractVersionGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>;
    readonly fields: ContractVersionFieldRefs;
}
export interface Prisma__ContractVersionClient<T, Null = never, ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise";
    contract<T extends Prisma.ContractDefaultArgs<ExtArgs> = {}>(args?: Prisma.Subset<T, Prisma.ContractDefaultArgs<ExtArgs>>): Prisma.Prisma__ContractClient<runtime.Types.Result.GetResult<Prisma.$ContractPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>;
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): runtime.Types.Utils.JsPromise<TResult1 | TResult2>;
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): runtime.Types.Utils.JsPromise<T | TResult>;
    finally(onfinally?: (() => void) | undefined | null): runtime.Types.Utils.JsPromise<T>;
}
export interface ContractVersionFieldRefs {
    readonly id: Prisma.FieldRef<"ContractVersion", 'String'>;
    readonly contractId: Prisma.FieldRef<"ContractVersion", 'String'>;
    readonly version: Prisma.FieldRef<"ContractVersion", 'Int'>;
    readonly content: Prisma.FieldRef<"ContractVersion", 'String'>;
    readonly changeNote: Prisma.FieldRef<"ContractVersion", 'String'>;
    readonly changedBy: Prisma.FieldRef<"ContractVersion", 'String'>;
    readonly createdAt: Prisma.FieldRef<"ContractVersion", 'DateTime'>;
}
export type ContractVersionFindUniqueArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.ContractVersionSelect<ExtArgs> | null;
    omit?: Prisma.ContractVersionOmit<ExtArgs> | null;
    include?: Prisma.ContractVersionInclude<ExtArgs> | null;
    where: Prisma.ContractVersionWhereUniqueInput;
};
export type ContractVersionFindUniqueOrThrowArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.ContractVersionSelect<ExtArgs> | null;
    omit?: Prisma.ContractVersionOmit<ExtArgs> | null;
    include?: Prisma.ContractVersionInclude<ExtArgs> | null;
    where: Prisma.ContractVersionWhereUniqueInput;
};
export type ContractVersionFindFirstArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.ContractVersionSelect<ExtArgs> | null;
    omit?: Prisma.ContractVersionOmit<ExtArgs> | null;
    include?: Prisma.ContractVersionInclude<ExtArgs> | null;
    where?: Prisma.ContractVersionWhereInput;
    orderBy?: Prisma.ContractVersionOrderByWithRelationInput | Prisma.ContractVersionOrderByWithRelationInput[];
    cursor?: Prisma.ContractVersionWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.ContractVersionScalarFieldEnum | Prisma.ContractVersionScalarFieldEnum[];
};
export type ContractVersionFindFirstOrThrowArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.ContractVersionSelect<ExtArgs> | null;
    omit?: Prisma.ContractVersionOmit<ExtArgs> | null;
    include?: Prisma.ContractVersionInclude<ExtArgs> | null;
    where?: Prisma.ContractVersionWhereInput;
    orderBy?: Prisma.ContractVersionOrderByWithRelationInput | Prisma.ContractVersionOrderByWithRelationInput[];
    cursor?: Prisma.ContractVersionWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.ContractVersionScalarFieldEnum | Prisma.ContractVersionScalarFieldEnum[];
};
export type ContractVersionFindManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.ContractVersionSelect<ExtArgs> | null;
    omit?: Prisma.ContractVersionOmit<ExtArgs> | null;
    include?: Prisma.ContractVersionInclude<ExtArgs> | null;
    where?: Prisma.ContractVersionWhereInput;
    orderBy?: Prisma.ContractVersionOrderByWithRelationInput | Prisma.ContractVersionOrderByWithRelationInput[];
    cursor?: Prisma.ContractVersionWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.ContractVersionScalarFieldEnum | Prisma.ContractVersionScalarFieldEnum[];
};
export type ContractVersionCreateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.ContractVersionSelect<ExtArgs> | null;
    omit?: Prisma.ContractVersionOmit<ExtArgs> | null;
    include?: Prisma.ContractVersionInclude<ExtArgs> | null;
    data: Prisma.XOR<Prisma.ContractVersionCreateInput, Prisma.ContractVersionUncheckedCreateInput>;
};
export type ContractVersionCreateManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    data: Prisma.ContractVersionCreateManyInput | Prisma.ContractVersionCreateManyInput[];
    skipDuplicates?: boolean;
};
export type ContractVersionCreateManyAndReturnArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.ContractVersionSelectCreateManyAndReturn<ExtArgs> | null;
    omit?: Prisma.ContractVersionOmit<ExtArgs> | null;
    data: Prisma.ContractVersionCreateManyInput | Prisma.ContractVersionCreateManyInput[];
    skipDuplicates?: boolean;
    include?: Prisma.ContractVersionIncludeCreateManyAndReturn<ExtArgs> | null;
};
export type ContractVersionUpdateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.ContractVersionSelect<ExtArgs> | null;
    omit?: Prisma.ContractVersionOmit<ExtArgs> | null;
    include?: Prisma.ContractVersionInclude<ExtArgs> | null;
    data: Prisma.XOR<Prisma.ContractVersionUpdateInput, Prisma.ContractVersionUncheckedUpdateInput>;
    where: Prisma.ContractVersionWhereUniqueInput;
};
export type ContractVersionUpdateManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    data: Prisma.XOR<Prisma.ContractVersionUpdateManyMutationInput, Prisma.ContractVersionUncheckedUpdateManyInput>;
    where?: Prisma.ContractVersionWhereInput;
    limit?: number;
};
export type ContractVersionUpdateManyAndReturnArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.ContractVersionSelectUpdateManyAndReturn<ExtArgs> | null;
    omit?: Prisma.ContractVersionOmit<ExtArgs> | null;
    data: Prisma.XOR<Prisma.ContractVersionUpdateManyMutationInput, Prisma.ContractVersionUncheckedUpdateManyInput>;
    where?: Prisma.ContractVersionWhereInput;
    limit?: number;
    include?: Prisma.ContractVersionIncludeUpdateManyAndReturn<ExtArgs> | null;
};
export type ContractVersionUpsertArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.ContractVersionSelect<ExtArgs> | null;
    omit?: Prisma.ContractVersionOmit<ExtArgs> | null;
    include?: Prisma.ContractVersionInclude<ExtArgs> | null;
    where: Prisma.ContractVersionWhereUniqueInput;
    create: Prisma.XOR<Prisma.ContractVersionCreateInput, Prisma.ContractVersionUncheckedCreateInput>;
    update: Prisma.XOR<Prisma.ContractVersionUpdateInput, Prisma.ContractVersionUncheckedUpdateInput>;
};
export type ContractVersionDeleteArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.ContractVersionSelect<ExtArgs> | null;
    omit?: Prisma.ContractVersionOmit<ExtArgs> | null;
    include?: Prisma.ContractVersionInclude<ExtArgs> | null;
    where: Prisma.ContractVersionWhereUniqueInput;
};
export type ContractVersionDeleteManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.ContractVersionWhereInput;
    limit?: number;
};
export type ContractVersionDefaultArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.ContractVersionSelect<ExtArgs> | null;
    omit?: Prisma.ContractVersionOmit<ExtArgs> | null;
    include?: Prisma.ContractVersionInclude<ExtArgs> | null;
};

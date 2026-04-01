declare class PartyDto {
    name: string;
    email?: string;
    role: string;
}
export declare class CreateContractDto {
    title: string;
    templateId?: string;
    content?: string;
    parties?: PartyDto[];
    contractValue?: number;
    currency?: string;
    effectiveDate?: string;
    expirationDate?: string;
}
export declare class UpdateContractDto {
    title?: string;
    content?: string;
    parties?: PartyDto[];
    contractValue?: number;
    effectiveDate?: string;
    expirationDate?: string;
    changeNote?: string;
}
export declare class UpdateStatusDto {
    status: string;
}
export declare class ListContractsQueryDto {
    status?: string;
    search?: string;
    page?: number;
    limit?: number;
}
export {};

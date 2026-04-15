import { OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { PrismaService } from '../../../database/prisma.service';
export declare class AIAnalysisGateway implements OnGatewayConnection, OnGatewayDisconnect {
    private prisma;
    private logger;
    private clientContextMap;
    private tenantRoomMap;
    server: Server;
    constructor(prisma: PrismaService);
    handleConnection(client: Socket): Promise<void>;
    handleDisconnect(client: Socket): void;
    handleSubscribeContract(client: Socket, data: {
        contractId: string;
    }): void;
    handleUnsubscribeContract(client: Socket, data: {
        contractId: string;
    }): void;
    emitToTenant(tenantId: string, event: string, data: any): void;
    emitToContract(contractId: string, event: string, data: any): void;
    emitToUser(userId: string, event: string, data: any): void;
    getStats(): {
        totalConnections: number;
        tenantConnections: Record<string, number>;
    };
}

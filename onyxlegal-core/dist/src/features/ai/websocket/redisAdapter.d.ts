import { Server, Socket } from 'socket.io';
import { Redis } from 'ioredis';
declare let createAdapter: any;
export declare function initializeRedisAdapter(io: Server, redisConnection: Redis): ReturnType<typeof createAdapter> | null;
export declare function setupTenantRooms(socket: Socket, tenantId: string, userId: string): void;
export declare function joinResourceRoom(socket: Socket, resourceType: 'contract' | 'analysis' | 'dlq', resourceId: string): void;
export declare function leaveResourceRoom(socket: Socket, resourceType: 'contract' | 'analysis' | 'dlq', resourceId: string): void;
export declare function broadcastToTenant(io: Server, tenantId: string, event: string, data: any): void;
export declare function broadcastToUser(io: Server, userId: string, event: string, data: any): void;
export declare function broadcastToResource(io: Server, resourceType: 'contract' | 'analysis' | 'dlq', resourceId: string, event: string, data: any): void;
export declare function getResourcePresence(io: Server, resourceType: 'contract' | 'analysis' | 'dlq', resourceId: string): Promise<Array<{
    socketId: string;
    userId: string;
    username?: string;
}>>;
export declare function getTenantPresence(io: Server, tenantId: string): Promise<Array<{
    socketId: string;
    userId: string;
}>>;
export declare function getRoomSockets(io: Server, roomName: string): Promise<string[]>;
export declare function getConnectionStats(io: Server): Promise<{
    totalConnected: number;
    totalRooms: number;
    activeInstances: number;
}>;
export declare function disconnectSocket(io: Server, socketId: string, reason?: string): Promise<boolean>;
export declare function disconnectTenant(io: Server, tenantId: string, reason?: string): Promise<number>;
export declare function setupSocketHandlers(socket: Socket, io: Server): void;
export declare function emitAnalysisUpdate(io: Server, analysisId: string, tenantId: string, status: 'started' | 'progress' | 'completed' | 'failed', data: any): void;
export declare function emitDLQNotification(io: Server, tenantId: string, jobId: string, reason: string): void;
export declare function emitQueueStatus(io: Server, tenantId: string, queueStats: {
    depth: number;
    active: number;
    failed: number;
}): void;
export {};

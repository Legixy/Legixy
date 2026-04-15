"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AIAnalysisGateway = void 0;
const websockets_1 = require("@nestjs/websockets");
const common_1 = require("@nestjs/common");
const socket_io_1 = require("socket.io");
const prisma_service_1 = require("../../../database/prisma.service");
let AIAnalysisGateway = class AIAnalysisGateway {
    prisma;
    logger = new common_1.Logger('AIAnalysisGateway');
    clientContextMap = new Map();
    tenantRoomMap = new Map();
    server;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async handleConnection(client) {
        this.logger.log(`Client connected: ${client.id}`);
        try {
            const userId = client.handshake.headers['x-user-id'];
            const tenantId = client.handshake.headers['x-tenant-id'];
            if (!userId || !tenantId) {
                this.logger.warn('Client missing credentials, disconnecting');
                client.disconnect();
                return;
            }
            this.clientContextMap.set(client.id, { userId, tenantId, socket: client });
            client.join(`tenant:${tenantId}`);
            client.join(`user:${userId}`);
            if (!this.tenantRoomMap.has(tenantId)) {
                this.tenantRoomMap.set(tenantId, new Set());
            }
            this.tenantRoomMap.get(tenantId).add(client.id);
            this.logger.log(`User ${userId} (tenant: ${tenantId}) connected. Total clients: ${this.clientContextMap.size}`);
            client.emit('connection_established', {
                message: 'Connected to AI Analysis server',
                clientId: client.id,
                timestamp: new Date().toISOString(),
            });
        }
        catch (error) {
            this.logger.error(`Connection error: ${error}`);
            client.disconnect();
        }
    }
    handleDisconnect(client) {
        const context = this.clientContextMap.get(client.id);
        if (context) {
            const { userId, tenantId } = context;
            this.clientContextMap.delete(client.id);
            this.tenantRoomMap.get(tenantId)?.delete(client.id);
            this.logger.log(`User ${userId} (tenant: ${tenantId}) disconnected. Total clients: ${this.clientContextMap.size}`);
        }
    }
    handleSubscribeContract(client, data) {
        const context = this.clientContextMap.get(client.id);
        if (!context) {
            client.emit('error', 'Not authenticated');
            return;
        }
        const roomName = `contract:${data.contractId}`;
        client.join(roomName);
        this.logger.log(`Client ${client.id} subscribed to ${roomName}`);
        client.emit('subscribed', {
            contractId: data.contractId,
            message: `Subscribed to updates for contract ${data.contractId}`,
        });
    }
    handleUnsubscribeContract(client, data) {
        const roomName = `contract:${data.contractId}`;
        client.leave(roomName);
        this.logger.log(`Client ${client.id} unsubscribed from ${roomName}`);
        client.emit('unsubscribed', {
            contractId: data.contractId,
        });
    }
    emitToTenant(tenantId, event, data) {
        const roomName = `tenant:${tenantId}`;
        this.server.to(roomName).emit(event, {
            ...data,
            timestamp: new Date().toISOString(),
        });
        this.logger.debug(`Emitted ${event} to ${roomName}`);
    }
    emitToContract(contractId, event, data) {
        const roomName = `contract:${contractId}`;
        this.server.to(roomName).emit(event, {
            contractId,
            ...data,
            timestamp: new Date().toISOString(),
        });
        this.logger.debug(`Emitted ${event} to ${roomName}`);
    }
    emitToUser(userId, event, data) {
        const roomName = `user:${userId}`;
        this.server.to(roomName).emit(event, {
            ...data,
            timestamp: new Date().toISOString(),
        });
        this.logger.debug(`Emitted ${event} to user ${userId}`);
    }
    getStats() {
        const tenantConnections = {};
        this.tenantRoomMap.forEach((clientIds, tenantId) => {
            tenantConnections[tenantId] = clientIds.size;
        });
        return {
            totalConnections: this.clientContextMap.size,
            tenantConnections,
        };
    }
};
exports.AIAnalysisGateway = AIAnalysisGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], AIAnalysisGateway.prototype, "server", void 0);
__decorate([
    (0, websockets_1.SubscribeMessage)('subscribe_contract'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", void 0)
], AIAnalysisGateway.prototype, "handleSubscribeContract", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('unsubscribe_contract'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", void 0)
], AIAnalysisGateway.prototype, "handleUnsubscribeContract", null);
exports.AIAnalysisGateway = AIAnalysisGateway = __decorate([
    (0, websockets_1.WebSocketGateway)({
        cors: {
            origin: process.env.FRONTEND_URL || 'http://localhost:3000',
            methods: ['GET', 'POST'],
        },
        transports: ['websocket', 'polling'],
    }),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AIAnalysisGateway);
//# sourceMappingURL=analysis.gateway.js.map
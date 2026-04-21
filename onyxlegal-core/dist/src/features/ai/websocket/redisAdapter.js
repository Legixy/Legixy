"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeRedisAdapter = initializeRedisAdapter;
exports.setupTenantRooms = setupTenantRooms;
exports.joinResourceRoom = joinResourceRoom;
exports.leaveResourceRoom = leaveResourceRoom;
exports.broadcastToTenant = broadcastToTenant;
exports.broadcastToUser = broadcastToUser;
exports.broadcastToResource = broadcastToResource;
exports.getResourcePresence = getResourcePresence;
exports.getTenantPresence = getTenantPresence;
exports.getRoomSockets = getRoomSockets;
exports.getConnectionStats = getConnectionStats;
exports.disconnectSocket = disconnectSocket;
exports.disconnectTenant = disconnectTenant;
exports.setupSocketHandlers = setupSocketHandlers;
exports.emitAnalysisUpdate = emitAnalysisUpdate;
exports.emitDLQNotification = emitDLQNotification;
exports.emitQueueStatus = emitQueueStatus;
const common_1 = require("@nestjs/common");
const logger = new common_1.Logger('WebSocketRedisAdapter');
let createAdapter;
let isAvailable = false;
try {
    createAdapter = require('@socket.io/redis-adapter').createAdapter;
    isAvailable = true;
    logger.log('Socket.io Redis adapter available');
}
catch (error) {
    logger.warn('@socket.io/redis-adapter not installed. WebSocket scaling disabled. Install with: npm install @socket.io/redis-adapter');
}
function initializeRedisAdapter(io, redisConnection) {
    try {
        if (!isAvailable || !createAdapter) {
            logger.warn('Socket.io Redis adapter not available, skipping initialization');
            return null;
        }
        const pubClient = redisConnection;
        const subClient = redisConnection.duplicate();
        io.adapter(createAdapter(pubClient, subClient));
        logger.log('Socket.io Redis adapter initialized successfully');
        return io.adapter();
    }
    catch (error) {
        logger.error(`Failed to initialize Redis adapter: ${error instanceof Error ? error.message : String(error)}`, error);
        return null;
    }
}
function setupTenantRooms(socket, tenantId, userId) {
    try {
        socket.join(`tenant:${tenantId}`);
        logger.debug(`[Socket ${socket.id}] Joined tenant:${tenantId}`);
        socket.join(`user:${userId}`);
        logger.debug(`[Socket ${socket.id}] Joined user:${userId}`);
        socket.tenantId = tenantId;
        socket.userId = userId;
    }
    catch (error) {
        logger.error(`Failed to setup tenant rooms: ${error instanceof Error ? error.message : String(error)}`, error);
    }
}
function joinResourceRoom(socket, resourceType, resourceId) {
    try {
        const roomName = `${resourceType}:${resourceId}`;
        socket.join(roomName);
        logger.debug(`[Socket ${socket.id}] Joined ${roomName}`);
    }
    catch (error) {
        logger.error(`Failed to join resource room: ${error instanceof Error ? error.message : String(error)}`, error);
    }
}
function leaveResourceRoom(socket, resourceType, resourceId) {
    try {
        const roomName = `${resourceType}:${resourceId}`;
        socket.leave(roomName);
        logger.debug(`[Socket ${socket.id}] Left ${roomName}`);
    }
    catch (error) {
        logger.error(`Failed to leave resource room: ${error instanceof Error ? error.message : String(error)}`, error);
    }
}
function broadcastToTenant(io, tenantId, event, data) {
    try {
        io.to(`tenant:${tenantId}`).emit(event, data);
        logger.debug(`[Broadcast] tenant:${tenantId} → ${event}`);
    }
    catch (error) {
        logger.error(`Failed to broadcast to tenant: ${error instanceof Error ? error.message : String(error)}`, error);
    }
}
function broadcastToUser(io, userId, event, data) {
    try {
        io.to(`user:${userId}`).emit(event, data);
        logger.debug(`[Broadcast] user:${userId} → ${event}`);
    }
    catch (error) {
        logger.error(`Failed to broadcast to user: ${error instanceof Error ? error.message : String(error)}`, error);
    }
}
function broadcastToResource(io, resourceType, resourceId, event, data) {
    try {
        const roomName = `${resourceType}:${resourceId}`;
        io.to(roomName).emit(event, data);
        logger.debug(`[Broadcast] ${roomName} → ${event}`);
    }
    catch (error) {
        logger.error(`Failed to broadcast to resource: ${error instanceof Error ? error.message : String(error)}`, error);
    }
}
async function getResourcePresence(io, resourceType, resourceId) {
    try {
        const roomName = `${resourceType}:${resourceId}`;
        const sockets = await io.in(roomName).fetchSockets();
        return sockets.map((socket) => ({
            socketId: socket.id,
            userId: socket.userId || 'unknown',
            username: socket.username,
        }));
    }
    catch (error) {
        logger.error(`Failed to get resource presence: ${error instanceof Error ? error.message : String(error)}`, error);
        return [];
    }
}
async function getTenantPresence(io, tenantId) {
    try {
        const roomName = `tenant:${tenantId}`;
        const sockets = await io.in(roomName).fetchSockets();
        return sockets.map((socket) => ({
            socketId: socket.id,
            userId: socket.userId || 'unknown',
        }));
    }
    catch (error) {
        logger.error(`Failed to get tenant presence: ${error instanceof Error ? error.message : String(error)}`, error);
        return [];
    }
}
async function getRoomSockets(io, roomName) {
    try {
        const sockets = await io.in(roomName).fetchSockets();
        return sockets.map((s) => s.id);
    }
    catch (error) {
        logger.error(`Failed to get room sockets: ${error instanceof Error ? error.message : String(error)}`, error);
        return [];
    }
}
async function getConnectionStats(io) {
    try {
        const stats = io.engine.generateId.length || 0;
        const sockets = await io.fetchSockets();
        const rooms = new Set();
        sockets.forEach((socket) => {
            socket.rooms.forEach((room) => {
                if (room !== socket.id) {
                    rooms.add(room);
                }
            });
        });
        return {
            totalConnected: sockets.length,
            totalRooms: rooms.size,
            activeInstances: io.of('/').adapter.rooms?.size || 0,
        };
    }
    catch (error) {
        logger.error(`Failed to get connection stats: ${error instanceof Error ? error.message : String(error)}`, error);
        return {
            totalConnected: 0,
            totalRooms: 0,
            activeInstances: 0,
        };
    }
}
async function disconnectSocket(io, socketId, reason = 'admin_request') {
    try {
        const sockets = await io.fetchSockets();
        const socket = sockets.find((s) => s.id === socketId);
        if (!socket) {
            logger.warn(`Socket ${socketId} not found`);
            return false;
        }
        socket.disconnect(true);
        logger.log(`[Admin] Disconnected socket ${socketId}: ${reason}`);
        return true;
    }
    catch (error) {
        logger.error(`Failed to disconnect socket: ${error instanceof Error ? error.message : String(error)}`, error);
        return false;
    }
}
async function disconnectTenant(io, tenantId, reason = 'admin_request') {
    try {
        const sockets = await io.in(`tenant:${tenantId}`).fetchSockets();
        let disconnected = 0;
        for (const socket of sockets) {
            socket.disconnect(true);
            disconnected++;
        }
        logger.log(`[Admin] Disconnected ${disconnected} users from tenant ${tenantId}: ${reason}`);
        return disconnected;
    }
    catch (error) {
        logger.error(`Failed to disconnect tenant: ${error instanceof Error ? error.message : String(error)}`, error);
        return 0;
    }
}
function setupSocketHandlers(socket, io) {
    try {
        socket.on('watch_contract', (contractId) => {
            joinResourceRoom(socket, 'contract', contractId);
            socket.emit('watching_contract', { contractId, status: 'watching' });
        });
        socket.on('unwatch_contract', (contractId) => {
            leaveResourceRoom(socket, 'contract', contractId);
            socket.emit('unwatched_contract', { contractId, status: 'unwatched' });
        });
        socket.on('watch_analysis', (analysisId) => {
            joinResourceRoom(socket, 'analysis', analysisId);
            socket.emit('watching_analysis', { analysisId, status: 'watching' });
        });
        socket.on('unwatch_analysis', (analysisId) => {
            leaveResourceRoom(socket, 'analysis', analysisId);
            socket.emit('unwatched_analysis', { analysisId, status: 'unwatched' });
        });
        socket.on('get_stats', async () => {
            const stats = await getConnectionStats(io);
            socket.emit('stats', stats);
        });
        logger.debug(`[Socket ${socket.id}] Event handlers setup`);
    }
    catch (error) {
        logger.error(`Failed to setup socket handlers: ${error instanceof Error ? error.message : String(error)}`, error);
    }
}
function emitAnalysisUpdate(io, analysisId, tenantId, status, data) {
    try {
        const event = `analysis_${status}`;
        const payload = {
            analysisId,
            tenantId,
            status,
            timestamp: new Date().toISOString(),
            ...data,
        };
        broadcastToResource(io, 'analysis', analysisId, event, payload);
        broadcastToTenant(io, tenantId, event, payload);
        logger.debug(`[Analysis ${analysisId}] Emitted ${event}`);
    }
    catch (error) {
        logger.error(`Failed to emit analysis update: ${error instanceof Error ? error.message : String(error)}`, error);
    }
}
function emitDLQNotification(io, tenantId, jobId, reason) {
    try {
        const payload = {
            jobId,
            tenantId,
            reason,
            timestamp: new Date().toISOString(),
        };
        broadcastToResource(io, 'dlq', tenantId, 'dlq_entry_added', payload);
        broadcastToTenant(io, tenantId, 'dlq_entry_added', payload);
        logger.debug(`[DLQ] Added entry for job ${jobId}`);
    }
    catch (error) {
        logger.error(`Failed to emit DLQ notification: ${error instanceof Error ? error.message : String(error)}`, error);
    }
}
function emitQueueStatus(io, tenantId, queueStats) {
    try {
        const payload = {
            tenantId,
            ...queueStats,
            timestamp: new Date().toISOString(),
        };
        broadcastToTenant(io, tenantId, 'queue_status', payload);
        logger.debug(`[Queue] Status update for tenant ${tenantId}`);
    }
    catch (error) {
        logger.error(`Failed to emit queue status: ${error instanceof Error ? error.message : String(error)}`, error);
    }
}
//# sourceMappingURL=redisAdapter.js.map
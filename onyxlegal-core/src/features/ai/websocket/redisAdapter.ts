/**
 * WebSocket Redis Adapter
 * 
 * Enables Socket.io to work across multiple server instances using Redis.
 * 
 * Features:
 * - Broadcast messages across all connected instances
 * - Room-based event emission (tenant isolation)
 * - Presence tracking (who's connected where)
 * - Automatic synchronization of socket state
 * 
 * Usage:
 * const io = new Server(httpServer);
 * const redisAdapter = createRedisAdapter(io, redisConnection);
 * 
 * Broadcasting:
 * - io.to('tenant-123').emit('analysis_complete', data)
 * - io.in('contract-456').emit('status_update', data)
 * 
 * Rooms:
 * - socket.join(`tenant:${tenantId}`)
 * - socket.join(`contract:${contractId}`)
 * - socket.join(`analysis:${analysisId}`)
 */

import { Server, Socket } from 'socket.io';
import { Redis } from 'ioredis';
import { Logger } from '@nestjs/common';

const logger = new Logger('WebSocketRedisAdapter');

// Lazy-load socket.io-redis-adapter
let createAdapter: any;
let isAvailable = false;

try {
  createAdapter = require('@socket.io/redis-adapter').createAdapter;
  isAvailable = true;
  logger.log('Socket.io Redis adapter available');
} catch (error) {
  logger.warn(
    '@socket.io/redis-adapter not installed. WebSocket scaling disabled. Install with: npm install @socket.io/redis-adapter',
  );
}

/**
 * Initialize Redis adapter for Socket.io
 */
export function initializeRedisAdapter(
  io: Server,
  redisConnection: Redis,
): ReturnType<typeof createAdapter> | null {
  try {
    if (!isAvailable || !createAdapter) {
      logger.warn('Socket.io Redis adapter not available, skipping initialization');
      return null;
    }

    // Create a second Redis connection for subscriptions
    // (socket.io-redis-adapter requires two connections)
    const pubClient = redisConnection;
    const subClient = redisConnection.duplicate();

    // Set adapter
    io.adapter(createAdapter(pubClient, subClient));

    logger.log('Socket.io Redis adapter initialized successfully');
    return io.adapter();
  } catch (error) {
    logger.error(
      `Failed to initialize Redis adapter: ${error instanceof Error ? error.message : String(error)}`,
      error,
    );
    return null;
  }
}

/**
 * Setup tenant-based room isolation for a socket connection.
 * Each user socket joins rooms for their tenant and active resources.
 */
export function setupTenantRooms(
  socket: Socket,
  tenantId: string,
  userId: string,
): void {
  try {
    // Join tenant room (all users in tenant receive broadcasts)
    socket.join(`tenant:${tenantId}`);
    logger.debug(`[Socket ${socket.id}] Joined tenant:${tenantId}`);

    // Join user room (individual user broadcasts)
    socket.join(`user:${userId}`);
    logger.debug(`[Socket ${socket.id}] Joined user:${userId}`);

    // Store context on socket for later use
    (socket as any).tenantId = tenantId;
    (socket as any).userId = userId;
  } catch (error) {
    logger.error(
      `Failed to setup tenant rooms: ${error instanceof Error ? error.message : String(error)}`,
      error,
    );
  }
}

/**
 * Setup resource-specific rooms (contracts, analyses, etc).
 * Called when user opens a specific resource for real-time updates.
 */
export function joinResourceRoom(
  socket: Socket,
  resourceType: 'contract' | 'analysis' | 'dlq',
  resourceId: string,
): void {
  try {
    const roomName = `${resourceType}:${resourceId}`;
    socket.join(roomName);
    logger.debug(`[Socket ${socket.id}] Joined ${roomName}`);
  } catch (error) {
    logger.error(
      `Failed to join resource room: ${error instanceof Error ? error.message : String(error)}`,
      error,
    );
  }
}

/**
 * Leave a resource room.
 * Called when user closes a resource.
 */
export function leaveResourceRoom(
  socket: Socket,
  resourceType: 'contract' | 'analysis' | 'dlq',
  resourceId: string,
): void {
  try {
    const roomName = `${resourceType}:${resourceId}`;
    socket.leave(roomName);
    logger.debug(`[Socket ${socket.id}] Left ${roomName}`);
  } catch (error) {
    logger.error(
      `Failed to leave resource room: ${error instanceof Error ? error.message : String(error)}`,
      error,
    );
  }
}

/**
 * Broadcast to all users in a tenant.
 */
export function broadcastToTenant(
  io: Server,
  tenantId: string,
  event: string,
  data: any,
): void {
  try {
    io.to(`tenant:${tenantId}`).emit(event, data);
    logger.debug(`[Broadcast] tenant:${tenantId} → ${event}`);
  } catch (error) {
    logger.error(
      `Failed to broadcast to tenant: ${error instanceof Error ? error.message : String(error)}`,
      error,
    );
  }
}

/**
 * Broadcast to a specific user.
 */
export function broadcastToUser(
  io: Server,
  userId: string,
  event: string,
  data: any,
): void {
  try {
    io.to(`user:${userId}`).emit(event, data);
    logger.debug(`[Broadcast] user:${userId} → ${event}`);
  } catch (error) {
    logger.error(
      `Failed to broadcast to user: ${error instanceof Error ? error.message : String(error)}`,
      error,
    );
  }
}

/**
 * Broadcast to all users watching a specific resource.
 */
export function broadcastToResource(
  io: Server,
  resourceType: 'contract' | 'analysis' | 'dlq',
  resourceId: string,
  event: string,
  data: any,
): void {
  try {
    const roomName = `${resourceType}:${resourceId}`;
    io.to(roomName).emit(event, data);
    logger.debug(`[Broadcast] ${roomName} → ${event}`);
  } catch (error) {
    logger.error(
      `Failed to broadcast to resource: ${error instanceof Error ? error.message : String(error)}`,
      error,
    );
  }
}

/**
 * Get presence information for a resource.
 * Returns list of users currently watching/connected to resource.
 */
export async function getResourcePresence(
  io: Server,
  resourceType: 'contract' | 'analysis' | 'dlq',
  resourceId: string,
): Promise<Array<{ socketId: string; userId: string; username?: string }>> {
  try {
    const roomName = `${resourceType}:${resourceId}`;
    const sockets = await io.in(roomName).fetchSockets();

    return sockets.map((socket) => ({
      socketId: socket.id,
      userId: (socket as any).userId || 'unknown',
      username: (socket as any).username,
    }));
  } catch (error) {
    logger.error(
      `Failed to get resource presence: ${error instanceof Error ? error.message : String(error)}`,
      error,
    );
    return [];
  }
}

/**
 * Get all connected users in a tenant.
 */
export async function getTenantPresence(
  io: Server,
  tenantId: string,
): Promise<Array<{ socketId: string; userId: string }>> {
  try {
    const roomName = `tenant:${tenantId}`;
    const sockets = await io.in(roomName).fetchSockets();

    return sockets.map((socket) => ({
      socketId: socket.id,
      userId: (socket as any).userId || 'unknown',
    }));
  } catch (error) {
    logger.error(
      `Failed to get tenant presence: ${error instanceof Error ? error.message : String(error)}`,
      error,
    );
    return [];
  }
}

/**
 * Get all connected sockets in a room.
 */
export async function getRoomSockets(
  io: Server,
  roomName: string,
): Promise<string[]> {
  try {
    const sockets = await io.in(roomName).fetchSockets();
    return sockets.map((s) => s.id);
  } catch (error) {
    logger.error(
      `Failed to get room sockets: ${error instanceof Error ? error.message : String(error)}`,
      error,
    );
    return [];
  }
}

/**
 * Get statistics about active connections and rooms.
 */
export async function getConnectionStats(io: Server): Promise<{
  totalConnected: number;
  totalRooms: number;
  activeInstances: number;
}> {
  try {
    // Get engine stats
    const stats = io.engine.generateId.length || 0;
    const sockets = await io.fetchSockets();
    const rooms = new Set<string>();

    // Collect all room names
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
  } catch (error) {
    logger.error(
      `Failed to get connection stats: ${error instanceof Error ? error.message : String(error)}`,
      error,
    );
    return {
      totalConnected: 0,
      totalRooms: 0,
      activeInstances: 0,
    };
  }
}

/**
 * Disconnect a specific socket (admin operation).
 */
export async function disconnectSocket(
  io: Server,
  socketId: string,
  reason: string = 'admin_request',
): Promise<boolean> {
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
  } catch (error) {
    logger.error(
      `Failed to disconnect socket: ${error instanceof Error ? error.message : String(error)}`,
      error,
    );
    return false;
  }
}

/**
 * Disconnect all users in a tenant (admin operation).
 */
export async function disconnectTenant(
  io: Server,
  tenantId: string,
  reason: string = 'admin_request',
): Promise<number> {
  try {
    const sockets = await io.in(`tenant:${tenantId}`).fetchSockets();

    let disconnected = 0;
    for (const socket of sockets) {
      socket.disconnect(true);
      disconnected++;
    }

    logger.log(`[Admin] Disconnected ${disconnected} users from tenant ${tenantId}: ${reason}`);
    return disconnected;
  } catch (error) {
    logger.error(
      `Failed to disconnect tenant: ${error instanceof Error ? error.message : String(error)}`,
      error,
    );
    return 0;
  }
}

/**
 * Setup socket event handlers for multi-instance awareness.
 */
export function setupSocketHandlers(socket: Socket, io: Server): void {
  try {
    /**
     * Custom event: User joins a contract for real-time updates
     */
    socket.on('watch_contract', (contractId: string) => {
      joinResourceRoom(socket, 'contract', contractId);
      socket.emit('watching_contract', { contractId, status: 'watching' });
    });

    /**
     * Custom event: User leaves a contract
     */
    socket.on('unwatch_contract', (contractId: string) => {
      leaveResourceRoom(socket, 'contract', contractId);
      socket.emit('unwatched_contract', { contractId, status: 'unwatched' });
    });

    /**
     * Custom event: User joins analysis for real-time progress
     */
    socket.on('watch_analysis', (analysisId: string) => {
      joinResourceRoom(socket, 'analysis', analysisId);
      socket.emit('watching_analysis', { analysisId, status: 'watching' });
    });

    /**
     * Custom event: User leaves analysis
     */
    socket.on('unwatch_analysis', (analysisId: string) => {
      leaveResourceRoom(socket, 'analysis', analysisId);
      socket.emit('unwatched_analysis', { analysisId, status: 'unwatched' });
    });

    /**
     * Custom event: Request connection stats
     */
    socket.on('get_stats', async () => {
      const stats = await getConnectionStats(io);
      socket.emit('stats', stats);
    });

    logger.debug(`[Socket ${socket.id}] Event handlers setup`);
  } catch (error) {
    logger.error(
      `Failed to setup socket handlers: ${error instanceof Error ? error.message : String(error)}`,
      error,
    );
  }
}

/**
 * Event emission helper for analysis status updates.
 */
export function emitAnalysisUpdate(
  io: Server,
  analysisId: string,
  tenantId: string,
  status: 'started' | 'progress' | 'completed' | 'failed',
  data: any,
): void {
  try {
    const event = `analysis_${status}`;
    const payload = {
      analysisId,
      tenantId,
      status,
      timestamp: new Date().toISOString(),
      ...data,
    };

    // Broadcast to:
    // 1. All users watching this analysis
    broadcastToResource(io, 'analysis', analysisId, event, payload);

    // 2. All users in tenant (general notification)
    broadcastToTenant(io, tenantId, event, payload);

    logger.debug(`[Analysis ${analysisId}] Emitted ${event}`);
  } catch (error) {
    logger.error(
      `Failed to emit analysis update: ${error instanceof Error ? error.message : String(error)}`,
      error,
    );
  }
}

/**
 * Event emission helper for DLQ notifications.
 */
export function emitDLQNotification(
  io: Server,
  tenantId: string,
  jobId: string,
  reason: string,
): void {
  try {
    const payload = {
      jobId,
      tenantId,
      reason,
      timestamp: new Date().toISOString(),
    };

    // Broadcast to DLQ room
    broadcastToResource(io, 'dlq', tenantId, 'dlq_entry_added', payload);

    // Broadcast to tenant
    broadcastToTenant(io, tenantId, 'dlq_entry_added', payload);

    logger.debug(`[DLQ] Added entry for job ${jobId}`);
  } catch (error) {
    logger.error(
      `Failed to emit DLQ notification: ${error instanceof Error ? error.message : String(error)}`,
      error,
    );
  }
}

/**
 * Event emission helper for queue status updates.
 */
export function emitQueueStatus(
  io: Server,
  tenantId: string,
  queueStats: { depth: number; active: number; failed: number },
): void {
  try {
    const payload = {
      tenantId,
      ...queueStats,
      timestamp: new Date().toISOString(),
    };

    broadcastToTenant(io, tenantId, 'queue_status', payload);

    logger.debug(`[Queue] Status update for tenant ${tenantId}`);
  } catch (error) {
    logger.error(
      `Failed to emit queue status: ${error instanceof Error ? error.message : String(error)}`,
      error,
    );
  }
}

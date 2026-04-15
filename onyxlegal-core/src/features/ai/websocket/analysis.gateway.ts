/**
 * AIAnalysisGateway — WebSocket Server for Real-Time Updates
 *
 * Events emitted:
 * - analysis_started: When AI analysis begins
 * - analysis_completed: When analysis completes with results
 * - analysis_failed: When analysis fails
 * - fix_applied: When user applies a suggested fix
 *
 * Architecture:
 * Worker → Gateway → WebSocket → Client
 */

import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Logger, UseGuards } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { PrismaService } from '../../../database/prisma.service';

interface ClientContext {
  userId: string;
  tenantId: string;
  socket: Socket;
}

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
  },
  transports: ['websocket', 'polling'],
})
export class AIAnalysisGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  private logger = new Logger('AIAnalysisGateway');
  private clientContextMap = new Map<string, ClientContext>();
  private tenantRoomMap = new Map<string, Set<string>>();

  @WebSocketServer()
  server: Server;

  constructor(private prisma: PrismaService) {}

  /**
   * Handle client connection
   */
  async handleConnection(client: Socket): Promise<void> {
    this.logger.log(`Client connected: ${client.id}`);

    // Extract userId and tenantId from JWT token (in handshake)
    try {
      const userId = client.handshake.headers['x-user-id'] as string;
      const tenantId = client.handshake.headers['x-tenant-id'] as string;

      if (!userId || !tenantId) {
        this.logger.warn('Client missing credentials, disconnecting');
        client.disconnect();
        return;
      }

      // Store client context
      this.clientContextMap.set(client.id, { userId, tenantId, socket: client });

      // Join tenant room (for broadcasting to entire tenant)
      client.join(`tenant:${tenantId}`);

      // Join user room (for personal notifications)
      client.join(`user:${userId}`);

      // Track connections per tenant
      if (!this.tenantRoomMap.has(tenantId)) {
        this.tenantRoomMap.set(tenantId, new Set());
      }
      this.tenantRoomMap.get(tenantId)!.add(client.id);

      this.logger.log(
        `User ${userId} (tenant: ${tenantId}) connected. Total clients: ${this.clientContextMap.size}`,
      );

      // Send connection confirmation
      client.emit('connection_established', {
        message: 'Connected to AI Analysis server',
        clientId: client.id,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      this.logger.error(`Connection error: ${error}`);
      client.disconnect();
    }
  }

  /**
   * Handle client disconnection
   */
  handleDisconnect(client: Socket): void {
    const context = this.clientContextMap.get(client.id);

    if (context) {
      const { userId, tenantId } = context;

      // Remove from maps
      this.clientContextMap.delete(client.id);
      this.tenantRoomMap.get(tenantId)?.delete(client.id);

      this.logger.log(
        `User ${userId} (tenant: ${tenantId}) disconnected. Total clients: ${this.clientContextMap.size}`,
      );
    }
  }

  /**
   * Subscribe to contract analysis updates
   */
  @SubscribeMessage('subscribe_contract')
  handleSubscribeContract(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { contractId: string },
  ): void {
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

  /**
   * Unsubscribe from contract analysis updates
   */
  @SubscribeMessage('unsubscribe_contract')
  handleUnsubscribeContract(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { contractId: string },
  ): void {
    const roomName = `contract:${data.contractId}`;
    client.leave(roomName);

    this.logger.log(`Client ${client.id} unsubscribed from ${roomName}`);

    client.emit('unsubscribed', {
      contractId: data.contractId,
    });
  }

  /**
   * Emit event to specific tenant
   * Called by worker after analysis completes
   */
  public emitToTenant(tenantId: string, event: string, data: any): void {
    const roomName = `tenant:${tenantId}`;
    this.server.to(roomName).emit(event, {
      ...data,
      timestamp: new Date().toISOString(),
    });

    this.logger.debug(`Emitted ${event} to ${roomName}`);
  }

  /**
   * Emit event to specific contract
   */
  public emitToContract(
    contractId: string,
    event: string,
    data: any,
  ): void {
    const roomName = `contract:${contractId}`;
    this.server.to(roomName).emit(event, {
      contractId,
      ...data,
      timestamp: new Date().toISOString(),
    });

    this.logger.debug(`Emitted ${event} to ${roomName}`);
  }

  /**
   * Emit event to specific user
   */
  public emitToUser(userId: string, event: string, data: any): void {
    const roomName = `user:${userId}`;
    this.server.to(roomName).emit(event, {
      ...data,
      timestamp: new Date().toISOString(),
    });

    this.logger.debug(`Emitted ${event} to user ${userId}`);
  }

  /**
   * Get connection stats
   */
  public getStats(): {
    totalConnections: number;
    tenantConnections: Record<string, number>;
  } {
    const tenantConnections: Record<string, number> = {};

    this.tenantRoomMap.forEach((clientIds, tenantId) => {
      tenantConnections[tenantId] = clientIds.size;
    });

    return {
      totalConnections: this.clientContextMap.size,
      tenantConnections,
    };
  }
}

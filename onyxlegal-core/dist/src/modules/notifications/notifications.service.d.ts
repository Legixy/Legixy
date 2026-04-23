import { PrismaService } from '../../database/prisma.service';
import { NotificationType } from 'generated/prisma/client';
export declare class NotificationsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    findAll(userId: string, unreadOnly?: boolean): Promise<{
        id: string;
        createdAt: Date;
        title: string;
        type: NotificationType;
        body: string;
        read: boolean;
        actionUrl: string | null;
        userId: string;
    }[]>;
    markRead(userId: string, notifId: string): Promise<{
        id: string;
        createdAt: Date;
        title: string;
        type: NotificationType;
        body: string;
        read: boolean;
        actionUrl: string | null;
        userId: string;
    }>;
    markAllRead(userId: string): Promise<{
        updated: number;
    }>;
    getUnreadCount(userId: string): Promise<{
        unreadCount: number;
    }>;
    create(userId: string, type: NotificationType, title: string, body: string, actionUrl?: string): Promise<{
        id: string;
        createdAt: Date;
        title: string;
        type: NotificationType;
        body: string;
        read: boolean;
        actionUrl: string | null;
        userId: string;
    }>;
}

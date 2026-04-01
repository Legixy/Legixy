import { NotificationsService } from './notifications.service';
import { AuthenticatedUser } from '../auth/jwt.strategy';
export declare class NotificationsController {
    private readonly notifService;
    constructor(notifService: NotificationsService);
    findAll(user: AuthenticatedUser, unread?: string): Promise<{
        id: string;
        createdAt: Date;
        title: string;
        type: import("../../../generated/prisma/enums").NotificationType;
        userId: string;
        body: string;
        read: boolean;
        actionUrl: string | null;
    }[]>;
    getUnreadCount(user: AuthenticatedUser): Promise<{
        unreadCount: number;
    }>;
    markRead(user: AuthenticatedUser, id: string): Promise<{
        id: string;
        createdAt: Date;
        title: string;
        type: import("../../../generated/prisma/enums").NotificationType;
        userId: string;
        body: string;
        read: boolean;
        actionUrl: string | null;
    }>;
    markAllRead(user: AuthenticatedUser): Promise<{
        updated: number;
    }>;
}

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

/**
 * Read-only directory of the people in a tenant.
 *
 * This is NOT a user-management system. It exists for one reason: the licence
 * editor needs a list of people who can be made accountable for a licence, and
 * the browser must never be able to invent that list.
 *
 * FIELD EXPOSURE
 * --------------
 * Only what the UI needs to render a human-readable choice. Explicitly never:
 * `password`, `passwordResetToken`, `passwordResetExpiry`, or `supabaseId`.
 */
@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Everyone in the caller's tenant, as assignable licence owners.
   *
   * `tenantId` comes from the authenticated JWT — see UsersController.
   */
  async findAssignable(tenantId: string) {
    return this.prisma.user.findMany({
      where: { tenantId },
      select: { id: true, name: true, email: true, role: true },
      orderBy: [{ name: 'asc' }, { email: 'asc' }],
    });
  }
}

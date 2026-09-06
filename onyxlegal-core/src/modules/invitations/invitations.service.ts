import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { createHash, randomBytes } from 'node:crypto';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../database/prisma.service';
import { MailerService } from '../../common/mailer/mailer.service';
import { ComplianceAuditService } from '../compliance/audit/compliance-audit.service';

const BCRYPT_ROUNDS = 12;

/** Seven days. Long enough to survive a weekend, short enough to expire. */
export const INVITATION_TTL_DAYS = 7;

export type InvitationState = 'pending' | 'accepted' | 'revoked' | 'expired';

/**
 * Putting a second person in a workspace.
 *
 * WHY THIS EXISTS
 * ---------------
 * All three registration paths in auth.service.ts create a NEW tenant with the
 * registering user as its OWNER. A real customer had exactly one user, for
 * ever. That made the product's sharpest figure — "Faisal holds 75% of
 * assigned licences" — unreachable outside the seeded demo, and sent every
 * reminder to whoever happened to sign up.
 *
 * WHY AN INVITED EMAIL MUST NOT ALREADY EXIST ANYWHERE
 * ----------------------------------------------------
 * `User` is unique on `[tenantId, email]`, so the schema permits one person in
 * two tenants. `auth.service.login` looks the user up with
 * `findFirst({ where: { email } })` — GLOBALLY, with no tenant in the query.
 * A second row for the same address would therefore create an account that can
 * never be logged into: `findFirst` returns whichever row it likes and the
 * other workspace becomes unreachable.
 *
 * So this refuses an address that already has an account anywhere, which is
 * also exactly what `register` already does. That is a real constraint read off
 * the code, not a limitation invented here. Making one address work in two
 * workspaces is a change to how login resolves a user, and it is a bigger
 * change than this feature.
 *
 * TOKENS
 * ------
 * 32 random bytes, base64url. Only the SHA-256 of it is stored, so a database
 * read cannot be replayed into a workspace. The tenant a token admits you to
 * comes from the invitation row and NEVER from anything the client sends —
 * which is what makes forging one useless rather than dangerous.
 */
@Injectable()
export class InvitationsService {
  private readonly logger = new Logger(InvitationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly mailer: MailerService,
    private readonly audit: ComplianceAuditService,
  ) {}

  private hash(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private normaliseEmail(email: string): string {
    return email.trim().toLowerCase();
  }

  /** Derived, never stored — the same discipline as licence expiry status. */
  static stateOf(
    invitation: { acceptedAt: Date | null; revokedAt: Date | null; expiresAt: Date },
    now: Date,
  ): InvitationState {
    if (invitation.acceptedAt) return 'accepted';
    if (invitation.revokedAt) return 'revoked';
    if (invitation.expiresAt.getTime() <= now.getTime()) return 'expired';
    return 'pending';
  }

  /**
   * Invite one address into one tenant.
   *
   * Returns the link as well as the record. When no channel is configured the
   * caller has to be able to pass it on by hand — an invitation that silently
   * goes nowhere is the failure class this product removes everywhere else.
   */
  async invite(input: { tenantId: string; actorUserId: string; email: string }) {
    const email = this.normaliseEmail(input.email);
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      throw new BadRequestException('That does not look like an email address.');
    }

    const alreadyHere = await this.prisma.user.findFirst({
      where: { tenantId: input.tenantId, email },
      select: { id: true },
    });
    if (alreadyHere) {
      throw new ConflictException('That person is already in this workspace.');
    }

    // See the class comment: login resolves by email with no tenant.
    const elsewhere = await this.prisma.user.findFirst({
      where: { email },
      select: { id: true },
    });
    if (elsewhere) {
      throw new ConflictException(
        'That email address already has an account. One address can belong to ' +
          'one workspace, so they cannot be invited to a second.',
      );
    }

    // Supersede any invitation still outstanding for this address, so a person
    // never holds two live links and the list never shows the same name twice.
    await this.prisma.tenantInvitation.updateMany({
      where: {
        tenantId: input.tenantId,
        email,
        acceptedAt: null,
        revokedAt: null,
      },
      data: { revokedAt: new Date() },
    });

    const token = randomBytes(32).toString('base64url');
    const expiresAt = new Date(
      Date.now() + INVITATION_TTL_DAYS * 24 * 60 * 60 * 1000,
    );

    const invitation = await this.prisma.tenantInvitation.create({
      data: {
        tenantId: input.tenantId,
        email,
        tokenHash: this.hash(token),
        invitedByUserId: input.actorUserId,
        expiresAt,
      },
    });

    await this.audit.record({
      tenantId: input.tenantId,
      actorUserId: input.actorUserId,
      action: 'invitation.sent',
      entityType: 'invitation',
      entityId: invitation.id,
      changes: { email: { from: null, to: email } },
    });

    const link = `${process.env.APP_URL || 'http://localhost:3000'}/invite/${token}`;
    let delivered = false;

    if (this.mailer.isConfigured) {
      try {
        const tenant = await this.prisma.tenant.findUnique({
          where: { id: input.tenantId },
          select: { name: true },
        });
        await this.mailer.send({
          to: email,
          subject: `You have been invited to ${tenant?.name ?? 'a workspace'} on Legixy`,
          text:
            `You have been invited to join ${tenant?.name ?? 'a workspace'} on Legixy, ` +
            `where licences and their renewal dates are kept.\n\n${link}\n\n` +
            `This link expires in ${INVITATION_TTL_DAYS} days.`,
        });
        delivered = true;
      } catch (error) {
        // Never echo the body: a transport error can name the SMTP host.
        this.logger.warn(
          `Invitation email to ${email} failed (${(error as Error).name}).`,
        );
      }
    }

    return { invitation, link, delivered };
  }

  /**
   * Accept an invitation and become a member of THAT tenant.
   *
   * The tenant is read from the invitation row. Nothing the caller sends can
   * influence which workspace they land in.
   */
  async accept(input: { token: string; name: string; password: string }) {
    const invitation = await this.prisma.tenantInvitation.findUnique({
      where: { tokenHash: this.hash(input.token) },
    });

    // A forged token hashes to nothing on record and stops here.
    if (!invitation) {
      throw new NotFoundException('That invitation link is not valid.');
    }

    const state = InvitationsService.stateOf(invitation, new Date());
    if (state === 'accepted') {
      throw new ConflictException('That invitation has already been used.');
    }
    if (state === 'revoked') {
      throw new ConflictException('That invitation was withdrawn.');
    }
    if (state === 'expired') {
      throw new ConflictException(
        'That invitation has expired. Ask whoever invited you to send another.',
      );
    }

    if (input.password.length < 8) {
      throw new BadRequestException('Choose a password of at least 8 characters.');
    }

    const taken = await this.prisma.user.findFirst({
      where: { email: invitation.email },
      select: { id: true },
    });
    if (taken) {
      throw new ConflictException('That email address already has an account.');
    }

    const hash = await bcrypt.hash(input.password, BCRYPT_ROUNDS);

    const user = await this.prisma.$transaction(async (tx) => {
      const created = await tx.user.create({
        data: {
          // From the invitation, never from the request.
          tenantId: invitation.tenantId,
          email: invitation.email,
          name: input.name.trim() || null,
          password: hash,
        },
      });
      await tx.tenantInvitation.update({
        where: { id: invitation.id },
        data: { acceptedAt: new Date() },
      });
      return created;
    });

    await this.audit.record({
      tenantId: invitation.tenantId,
      actorUserId: user.id,
      action: 'invitation.accepted',
      entityType: 'user',
      entityId: user.id,
      changes: { email: { from: null, to: invitation.email } },
    });

    return user;
  }

  /** Invitations that have not been accepted, with their derived state. */
  async listPending(tenantId: string) {
    const rows = await this.prisma.tenantInvitation.findMany({
      where: { tenantId, acceptedAt: null, revokedAt: null },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        expiresAt: true,
        createdAt: true,
        acceptedAt: true,
        revokedAt: true,
      },
    });
    const now = new Date();
    return rows.map((row) => ({
      id: row.id,
      email: row.email,
      expiresAt: row.expiresAt,
      createdAt: row.createdAt,
      state: InvitationsService.stateOf(row, now),
    }));
  }

  async revoke(input: { tenantId: string; actorUserId: string; id: string }) {
    // findFirst scoped by tenant, never findUnique by id.
    const invitation = await this.prisma.tenantInvitation.findFirst({
      where: { id: input.id, tenantId: input.tenantId },
    });
    if (!invitation) throw new NotFoundException('Invitation not found.');
    if (invitation.acceptedAt) {
      throw new ConflictException(
        'That invitation was already accepted. Remove the person instead.',
      );
    }

    await this.prisma.tenantInvitation.update({
      where: { id: invitation.id },
      data: { revokedAt: new Date() },
    });

    await this.audit.record({
      tenantId: input.tenantId,
      actorUserId: input.actorUserId,
      action: 'invitation.revoked',
      entityType: 'invitation',
      entityId: invitation.id,
      changes: { email: { from: invitation.email, to: null } },
    });
  }
}

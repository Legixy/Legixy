/**
 * Putting a second person in a workspace — against real PostgreSQL.
 *
 * WHAT THIS GUARDS
 * ----------------
 * Until this feature existed, every registration path created a NEW tenant, so
 * a real customer had one user for ever. The whole product assumes a team: the
 * ownership-concentration figure, the unassigned-licence banner, the copy
 * address and every reminder recipient.
 *
 * The dangerous direction is isolation. An invitation is the only thing in this
 * product that puts a user into a tenant they did not create, so a token that
 * could be forged, replayed, or steered at another workspace would cross the
 * boundary everything else is careful about. Those cases are tested
 * adversarially rather than happy-path.
 *
 * SAFETY: refuses to run against a database whose name does not end in `_test`.
 */

import { ConfigService } from '@nestjs/config';
import * as dotenv from 'dotenv';
import { createHash, randomBytes } from 'node:crypto';
import { PrismaService } from '../../database/prisma.service';
import { ComplianceAuditService } from '../compliance/audit/compliance-audit.service';
import { LicensesService } from '../compliance/licenses/licenses.service';
import { RemindersService } from '../compliance/reminders/reminders.service';
import { SitesService } from '../compliance/sites/sites.service';
import { UsersService } from '../users/users.service';
import { InvitationsService } from './invitations.service';

dotenv.config();

const TEST_DATABASE_URL = process.env.TEST_DATABASE_URL ?? '';
if (!TEST_DATABASE_URL) throw new Error('TEST_DATABASE_URL is not set.');
if (!/_test(\?|$)/.test(new URL(TEST_DATABASE_URL).pathname + '?')) {
  throw new Error('Refusing to run: database name must end in "_test".');
}

/** SMTP is unconfigured in this deployment; that is the case under test. */
class SilentMailer {
  isConfigured = false;
  sent: unknown[] = [];
  send(message: unknown) {
    if (!this.isConfigured) throw new Error('No email transport configured');
    this.sent.push(message);
    return Promise.resolve();
  }
}

describe('invitations (integration)', () => {
  let prisma: PrismaService;
  let invitations: InvitationsService;
  let users: UsersService;
  let licenses: LicensesService;
  let sites: SitesService;
  let audit: ComplianceAuditService;
  let mailer: SilentMailer;

  let tenantA: string;
  let tenantB: string;
  let ownerA: string;
  let ownerB: string;
  let siteA: string;
  const suffix = Date.now();

  beforeAll(async () => {
    const config = {
      get: (key: string, fallback?: string) =>
        key === 'DATABASE_URL' ? TEST_DATABASE_URL : fallback,
    } as unknown as ConfigService;

    prisma = new PrismaService(config);
    await prisma.onModuleInit();

    audit = new ComplianceAuditService(prisma);
    mailer = new SilentMailer();
    invitations = new InvitationsService(prisma, mailer as never, audit);
    users = new UsersService(prisma, audit);
    const reminders = new RemindersService(prisma);
    sites = new SitesService(prisma, audit);
    licenses = new LicensesService(prisma, audit, reminders);

    const a = await prisma.tenant.create({
      data: { name: `invite-A-${suffix}`, timeZone: 'Asia/Riyadh' },
    });
    const b = await prisma.tenant.create({
      data: { name: `invite-B-${suffix}`, timeZone: 'Asia/Riyadh' },
    });
    tenantA = a.id;
    tenantB = b.id;

    ownerA = (
      await prisma.user.create({
        data: { tenantId: tenantA, email: `a-owner-${suffix}@example.test`, name: 'Owner A', role: 'OWNER' },
      })
    ).id;
    ownerB = (
      await prisma.user.create({
        data: { tenantId: tenantB, email: `b-owner-${suffix}@example.test`, name: 'Owner B', role: 'OWNER' },
      })
    ).id;

    siteA = (await sites.create(tenantA, ownerA, { name: 'Riyadh HQ' })).id;
  });

  afterAll(async () => {
    if (prisma) {
      await prisma.tenant.deleteMany({ where: { id: { in: [tenantA, tenantB] } } }).catch(() => undefined);
      await prisma.onModuleDestroy();
    }
  });

  // ── The gap this feature closes ────────────────────────────────────────

  it('puts the invited person in the INVITING tenant, not a new one', async () => {
    const email = `joiner-${suffix}@example.test`;
    const before = await prisma.tenant.count();

    const { link } = await invitations.invite({ tenantId: tenantA, actorUserId: ownerA, email });
    const token = link.split('/').pop()!;
    const user = await invitations.accept({ token, name: 'Faisal Al-Harbi', password: 'a-good-password' });

    expect(user.tenantId).toBe(tenantA);
    // The bug this whole slice exists for: registration created a new tenant.
    expect(await prisma.tenant.count()).toBe(before);
  });

  it('makes them assignable as a licence owner, and reminders resolve to them', async () => {
    const email = `owner2-${suffix}@example.test`;
    const { link } = await invitations.invite({ tenantId: tenantA, actorUserId: ownerA, email });
    const joined = await invitations.accept({
      token: link.split('/').pop()!,
      name: 'Huda Al-Qahtani',
      password: 'a-good-password',
    });

    const directory = await users.findAssignable(tenantA);
    expect(directory.map((p) => p.id)).toContain(joined.id);

    const licence = await licenses.create(tenantA, ownerA, {
      name: 'Balady Municipal Licence',
      authority: 'Balady',
      scope: 'SITE',
      siteId: siteA,
      expiryDate: '2027-01-01',
      ownerUserId: joined.id,
    } as never);

    const stored = await prisma.license.findFirst({ where: { id: licence.id, tenantId: tenantA } });
    expect(stored?.ownerUserId).toBe(joined.id);
  });

  // ── Adversarial: the boundary ──────────────────────────────────────────

  it('refuses a forged token', async () => {
    const forged = randomBytes(32).toString('base64url');
    await expect(
      invitations.accept({ token: forged, name: 'Intruder', password: 'a-good-password' }),
    ).rejects.toThrow(/not valid/i);
  });

  it('refuses a tampered token, and the tamper creates no user', async () => {
    const email = `tamper-${suffix}@example.test`;
    const { link } = await invitations.invite({ tenantId: tenantA, actorUserId: ownerA, email });
    const token = link.split('/').pop()!;
    const tampered = token.slice(0, -1) + (token.endsWith('A') ? 'B' : 'A');

    await expect(
      invitations.accept({ token: tampered, name: 'Intruder', password: 'a-good-password' }),
    ).rejects.toThrow();
    expect(await prisma.user.findFirst({ where: { email } })).toBeNull();
  });

  /**
   * The load-bearing one. A token issued by tenant A must be incapable of
   * placing anyone in tenant B — and the reason it cannot is structural:
   * `accept` reads the tenant from the invitation row and takes no tenant
   * input at all. This asserts the property rather than the implementation.
   */
  it('cannot be steered at another workspace', async () => {
    const email = `cross-${suffix}@example.test`;
    const { link } = await invitations.invite({ tenantId: tenantA, actorUserId: ownerA, email });

    const user = await invitations.accept({
      token: link.split('/').pop()!,
      name: 'Nadia',
      password: 'a-good-password',
    });

    expect(user.tenantId).toBe(tenantA);
    expect(user.tenantId).not.toBe(tenantB);
    expect(await prisma.user.count({ where: { tenantId: tenantB, email } })).toBe(0);
  });

  it('refuses a replayed token', async () => {
    const email = `replay-${suffix}@example.test`;
    const { link } = await invitations.invite({ tenantId: tenantA, actorUserId: ownerA, email });
    const token = link.split('/').pop()!;

    await invitations.accept({ token, name: 'First', password: 'a-good-password' });
    await expect(
      invitations.accept({ token, name: 'Second', password: 'a-good-password' }),
    ).rejects.toThrow(/already been used/i);
    expect(await prisma.user.count({ where: { email } })).toBe(1);
  });

  it('stores only a hash, so a database read cannot be replayed', async () => {
    const email = `hash-${suffix}@example.test`;
    const { link } = await invitations.invite({ tenantId: tenantA, actorUserId: ownerA, email });
    const token = link.split('/').pop()!;

    const row = await prisma.tenantInvitation.findFirst({ where: { tenantId: tenantA, email } });
    expect(row!.tokenHash).not.toBe(token);
    expect(row!.tokenHash).toBe(createHash('sha256').update(token).digest('hex'));
  });

  // ── States ─────────────────────────────────────────────────────────────

  it('refuses an expired invitation, and says so', async () => {
    const email = `expired-${suffix}@example.test`;
    const { link } = await invitations.invite({ tenantId: tenantA, actorUserId: ownerA, email });
    const token = link.split('/').pop()!;
    await prisma.tenantInvitation.updateMany({
      where: { tenantId: tenantA, email },
      data: { expiresAt: new Date(Date.now() - 1000) },
    });

    await expect(
      invitations.accept({ token, name: 'Late', password: 'a-good-password' }),
    ).rejects.toThrow(/expired/i);
    expect(await prisma.user.findFirst({ where: { email } })).toBeNull();
  });

  it('refuses a revoked invitation', async () => {
    const email = `revoked-${suffix}@example.test`;
    const { invitation, link } = await invitations.invite({ tenantId: tenantA, actorUserId: ownerA, email });
    await invitations.revoke({ tenantId: tenantA, actorUserId: ownerA, id: invitation.id });

    await expect(
      invitations.accept({ token: link.split('/').pop()!, name: 'Nope', password: 'a-good-password' }),
    ).rejects.toThrow(/withdrawn/i);
  });

  it('refuses to revoke across a tenant boundary', async () => {
    const email = `xrevoke-${suffix}@example.test`;
    const { invitation } = await invitations.invite({ tenantId: tenantA, actorUserId: ownerA, email });
    await expect(
      invitations.revoke({ tenantId: tenantB, actorUserId: ownerB, id: invitation.id }),
    ).rejects.toThrow(/not found/i);
  });

  it('refuses to invite somebody already in the workspace', async () => {
    const existing = await prisma.user.findFirst({ where: { id: ownerA } });
    await expect(
      invitations.invite({ tenantId: tenantA, actorUserId: ownerA, email: existing!.email }),
    ).rejects.toThrow(/already in this workspace/i);
  });

  /**
   * `auth.service.login` resolves by email with NO tenant in the query, so a
   * second row for one address would create an account nobody can log into.
   */
  it('refuses an address that already has an account elsewhere', async () => {
    const other = await prisma.user.findFirst({ where: { id: ownerB } });
    await expect(
      invitations.invite({ tenantId: tenantA, actorUserId: ownerA, email: other!.email }),
    ).rejects.toThrow(/already has an account/i);
  });

  // ── No delivery channel ────────────────────────────────────────────────

  it('creates the invitation and reports undelivered when no channel exists', async () => {
    const email = `nochannel-${suffix}@example.test`;
    const result = await invitations.invite({ tenantId: tenantA, actorUserId: ownerA, email });

    expect(result.delivered).toBe(false);
    expect(result.link).toContain('/invite/');
    // Created regardless — nothing silently vanishes.
    const pending = await invitations.listPending(tenantA);
    expect(pending.map((p) => p.email)).toContain(email);
  });

  // ── Removal: transfer, then remove ─────────────────────────────────────

  /**
   * `License.owner` is declared `onDelete: SetNull`, so a plain delete would
   * SILENTLY unassign every licence the leaver held. An unassigned licence is
   * a state this product surfaces loudly — "nobody is assigned to this
   * licence, so these reminders cannot be delivered" — and a departure that
   * quietly created several of them is exactly the key-person risk the
   * concentration figure exists to name.
   */
  describe('removing a person', () => {
    async function joiner(tag: string) {
      const email = `${tag}-${suffix}@example.test`;
      const { link } = await invitations.invite({ tenantId: tenantA, actorUserId: ownerA, email });
      return invitations.accept({
        token: link.split('/').pop()!,
        name: `Person ${tag}`,
        password: 'a-good-password',
      });
    }

    async function licenceOwnedBy(ownerUserId: string, name: string) {
      return licenses.create(tenantA, ownerA, {
        name,
        authority: 'Balady',
        scope: 'SITE',
        siteId: siteA,
        expiryDate: '2027-06-01',
        ownerUserId,
      } as never);
    }

    it('refuses to remove somebody holding licences without a decision', async () => {
      const person = await joiner('holder');
      await licenceOwnedBy(person.id, 'Civil Defence Certificate');

      await expect(
        users.remove({ tenantId: tenantA, actorUserId: ownerA, userId: person.id }),
      ).rejects.toThrow(/accountable for 1 licence/i);

      // Still there, still holding it.
      expect(await prisma.user.findFirst({ where: { id: person.id } })).not.toBeNull();
    });

    it('transfers their licences to the named successor', async () => {
      const leaver = await joiner('leaver');
      const successor = await joiner('successor');
      const licence = await licenceOwnedBy(leaver.id, 'Qiwa Registration');

      const result = await users.remove({
        tenantId: tenantA,
        actorUserId: ownerA,
        userId: leaver.id,
        transferToUserId: successor.id,
      });

      expect(result.licencesMoved).toBe(1);
      const after = await prisma.license.findFirst({ where: { id: licence.id } });
      expect(after!.ownerUserId).toBe(successor.id);
      expect(await prisma.user.findFirst({ where: { id: leaver.id } })).toBeNull();
    });

    it('leaves them unassigned only when that is chosen explicitly', async () => {
      const leaver = await joiner('abandoner');
      const licence = await licenceOwnedBy(leaver.id, 'GOSI Certificate');

      await users.remove({
        tenantId: tenantA,
        actorUserId: ownerA,
        userId: leaver.id,
        acceptUnassigned: true,
      });

      const after = await prisma.license.findFirst({ where: { id: licence.id } });
      expect(after!.ownerUserId).toBeNull();
    });

    it('records the reassignment on the LICENCE, not only on the person', async () => {
      const leaver = await joiner('recorded');
      const successor = await joiner('recipient');
      const licence = await licenceOwnedBy(leaver.id, 'Chamber Membership');

      await users.remove({
        tenantId: tenantA,
        actorUserId: ownerA,
        userId: leaver.id,
        transferToUserId: successor.id,
      });

      const entry = await prisma.complianceAuditLog.findFirst({
        where: { tenantId: tenantA, entityType: 'license', entityId: licence.id, action: 'license.updated' },
        orderBy: { createdAt: 'desc' },
      });
      expect(entry).not.toBeNull();
      expect((entry!.changes as Record<string, { from: unknown; to: unknown }>).ownerUserId)
        .toEqual({ from: leaver.id, to: successor.id });
    });

    it('refuses to remove across a tenant boundary', async () => {
      await expect(
        users.remove({ tenantId: tenantB, actorUserId: ownerB, userId: ownerA }),
      ).rejects.toThrow(/not in this workspace/i);
      expect(await prisma.user.findFirst({ where: { id: ownerA } })).not.toBeNull();
    });

    it('refuses to remove yourself', async () => {
      await expect(
        users.remove({ tenantId: tenantA, actorUserId: ownerA, userId: ownerA }),
      ).rejects.toThrow(/cannot remove yourself/i);
    });

    it('refuses to remove the only person in a workspace', async () => {
      await expect(
        users.remove({ tenantId: tenantB, actorUserId: ownerA, userId: ownerB }),
      ).rejects.toThrow(/only person/i);
    });

    it('counts holdings per person for the people surface', async () => {
      const holdings = await users.findWithHoldings(tenantA);
      expect(holdings.length).toBeGreaterThan(1);
      for (const person of holdings) {
        expect(typeof person.licenceCount).toBe('number');
      }
    });
  });

  // ── Audit ──────────────────────────────────────────────────────────────

  it('audits the invitation and the acceptance', async () => {
    const email = `audited-${suffix}@example.test`;
    const { invitation, link } = await invitations.invite({ tenantId: tenantA, actorUserId: ownerA, email });
    const user = await invitations.accept({
      token: link.split('/').pop()!,
      name: 'Audited',
      password: 'a-good-password',
    });

    const sent = await prisma.complianceAuditLog.findFirst({
      where: { tenantId: tenantA, action: 'invitation.sent', entityId: invitation.id },
    });
    const accepted = await prisma.complianceAuditLog.findFirst({
      where: { tenantId: tenantA, action: 'invitation.accepted', entityId: user.id },
    });
    expect(sent).not.toBeNull();
    expect(accepted).not.toBeNull();
  });
});

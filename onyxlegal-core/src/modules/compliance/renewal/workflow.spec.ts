import { RenewalStatus } from 'generated/prisma/client';
import {
  canTransition,
  explainRefusal,
  isTerminal,
  LEGAL_TRANSITIONS,
  STAGE_LABELS,
  TERMINAL_STATUSES,
} from './workflow';

const ALL: RenewalStatus[] = [
  RenewalStatus.PREPARING,
  RenewalStatus.READY,
  RenewalStatus.AWAITING_AUTHORITY,
  RenewalStatus.COMPLETED,
  RenewalStatus.CLOSED,
];

describe('renewal workflow', () => {
  describe('legal transitions', () => {
    it.each([
      [RenewalStatus.PREPARING, RenewalStatus.READY],
      [RenewalStatus.PREPARING, RenewalStatus.AWAITING_AUTHORITY],
      [RenewalStatus.PREPARING, RenewalStatus.CLOSED],
      [RenewalStatus.READY, RenewalStatus.AWAITING_AUTHORITY],
      [RenewalStatus.READY, RenewalStatus.PREPARING],
      [RenewalStatus.READY, RenewalStatus.CLOSED],
      [RenewalStatus.AWAITING_AUTHORITY, RenewalStatus.COMPLETED],
      [RenewalStatus.AWAITING_AUTHORITY, RenewalStatus.READY],
      [RenewalStatus.AWAITING_AUTHORITY, RenewalStatus.CLOSED],
    ])('allows %s -> %s', (from, to) => {
      expect(canTransition(from, to)).toBe(true);
    });

    it('lets someone skip READY — people do not work in software order', () => {
      // Someone who simply went and filed it should be able to say so without
      // first ticking a box claiming they were ready.
      expect(
        canTransition(
          RenewalStatus.PREPARING,
          RenewalStatus.AWAITING_AUTHORITY,
        ),
      ).toBe(true);
    });

    it('lets a rejected filing go back to be refiled', () => {
      expect(
        canTransition(RenewalStatus.AWAITING_AUTHORITY, RenewalStatus.READY),
      ).toBe(true);
    });
  });

  describe('illegal transitions', () => {
    it('NEVER reaches COMPLETED except from AWAITING_AUTHORITY', () => {
      // Completing writes a new expiry into the register. It must not be
      // reachable from a stage where nobody has said they filed anything.
      expect(
        canTransition(RenewalStatus.PREPARING, RenewalStatus.COMPLETED),
      ).toBe(false);
      expect(canTransition(RenewalStatus.READY, RenewalStatus.COMPLETED)).toBe(
        false,
      );
      expect(
        canTransition(
          RenewalStatus.AWAITING_AUTHORITY,
          RenewalStatus.COMPLETED,
        ),
      ).toBe(true);
    });

    it.each(TERMINAL_STATUSES)('allows nothing out of %s', (status) => {
      expect(LEGAL_TRANSITIONS[status]).toEqual([]);
      for (const to of ALL) {
        expect({
          from: status,
          to,
          allowed: canTransition(status, to),
        }).toEqual({ from: status, to, allowed: false });
      }
    });

    it('never allows a stage to transition to itself', () => {
      for (const status of ALL) {
        expect(canTransition(status, status)).toBe(false);
      }
    });

    it('identifies the terminal stages', () => {
      expect(isTerminal(RenewalStatus.COMPLETED)).toBe(true);
      expect(isTerminal(RenewalStatus.CLOSED)).toBe(true);
      expect(isTerminal(RenewalStatus.PREPARING)).toBe(false);
    });
  });

  describe('refusal messages say what IS possible', () => {
    it('names the current stage and the available moves', () => {
      const message = explainRefusal(
        RenewalStatus.PREPARING,
        RenewalStatus.COMPLETED,
      );
      expect(message).toContain('Gathering documents');
      expect(message).toContain('Ready to file');
      // "Invalid transition" tells someone nothing about what to do next.
      expect(message).not.toMatch(/invalid|illegal|forbidden/i);
    });

    it('explains a terminal renewal rather than just refusing', () => {
      const message = explainRefusal(
        RenewalStatus.COMPLETED,
        RenewalStatus.READY,
      );
      expect(message).toMatch(/cannot be changed/i);
      expect(message).toMatch(/start a new renewal/i);
    });

    it('says plainly when a renewal is already at that stage', () => {
      expect(explainRefusal(RenewalStatus.READY, RenewalStatus.READY)).toMatch(
        /already at/i,
      );
    });
  });

  describe('NAMING — the system submits nothing', () => {
    it('never labels a stage "Submitted"', () => {
      // "Submitted" reads as though the system submitted it. A person did,
      // at the portal, and told us afterwards. A client who believes
      // otherwise stops filing, and a licence lapses.
      for (const label of Object.values(STAGE_LABELS)) {
        expect({ label, bad: /^submitted$|^filed$/i.test(label) }).toEqual({
          label,
          bad: false,
        });
      }
    });

    it('describes where the paperwork IS, not who put it there', () => {
      expect(STAGE_LABELS[RenewalStatus.AWAITING_AUTHORITY]).toBe(
        'With the authority',
      );
    });

    it('gives every stage a label', () => {
      for (const status of ALL) {
        expect(STAGE_LABELS[status]?.length).toBeGreaterThan(0);
      }
    });
  });
});

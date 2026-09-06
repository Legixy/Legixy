import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { TONE_STYLES } from './format';

/**
 * Propagation guards.
 *
 * These assert properties of the SOURCE, not of a rendered page, because the
 * things they protect are exactly the ones that rot silently: a token quietly
 * replaced by a hex during a hurried fix, a second status system reappearing,
 * a reduced-motion block deleted because nobody could see it working.
 *
 * Slice 13 verified reduced motion and coarse-pointer targets by READING the
 * stylesheet, because `Emulation.setEmulatedMedia` is outside the CDP
 * allowlist and the headless browser would not honour either media query.
 * Reading is not verification — it cannot fail. These tests are the
 * substitute: they run in CI and they break when the rule is removed.
 */

const SRC = resolve(__dirname, '../../..');
const CSS = readFileSync(join(SRC, 'app/globals.css'), 'utf8');

/*
  RECONCILED IN SLICE 20.

  This file guarded COLOUR literals across the propagation subset. A parallel
  session's slice18.spec.ts guarded DIMENSION literals across three exemplars,
  and the two overlapped on the auth surface — which is how one redesign
  produced eight red tests across two files that each thought they owned the
  rule.

  Two guards enforcing overlapping rules on the same files is the collision,
  not the fix. slice18's checks are folded in below: its finding was correct
  and its contrast and scrim arithmetic is better than anything here, so the
  work was kept and only its home changed.
*/

/** The screens and shared components this slice propagated to. */
const SUBSET = [
  'app/dashboard/page.tsx',
  'app/dashboard/sites/page.tsx',
  'app/dashboard/sites/[siteId]/page.tsx',
  'app/dashboard/sites/new/page.tsx',
  'app/dashboard/licenses/page.tsx',
  'app/dashboard/delivery/page.tsx',
  'app/dashboard/year-ahead/page.tsx',
  'app/dashboard/licenses/new/page.tsx',
  'app/dashboard/licenses/[licenseId]/page.tsx',
  'app/dashboard/licenses/import/page.tsx',
  'app/dashboard/gaps/page.tsx',
  'app/dashboard/requirements/page.tsx',
  'app/dashboard/preferences/page.tsx',
  'app/login/page.tsx',
  'features/compliance/components/ComplianceSummaryBar.tsx',
  'features/compliance/components/CoverageSummary.tsx',
  'features/compliance/components/DocumentSection.tsx',
  'features/compliance/components/EditLicenseDialog.tsx',
  'features/compliance/components/EmptyState.tsx',
  'features/compliance/components/ErrorState.tsx',
  'features/compliance/components/LicenseTable.tsx',
  'features/compliance/components/ReminderNotificationsPanel.tsx',
  'features/compliance/components/ReminderTimeline.tsx',
  'features/compliance/components/RenewalPanel.tsx',
  'features/compliance/components/RenewalWorkflowPanel.tsx',
  'features/compliance/components/Skeletons.tsx',
  'features/compliance/components/StatusBadge.tsx',
  'features/compliance/components/exemplar/LicenseList.tsx',
  'features/compliance/components/exemplar/ListSkeleton.tsx',
  'features/compliance/lib/format.ts',
  'shared/components/DashboardShell.tsx',
  'shared/components/Header.tsx',
  'shared/components/Modal.tsx',
  'shared/components/PageHeader.tsx',
  'shared/components/Sidebar.tsx',
  'features/auth/components/AuthLayout.tsx',
  'features/auth/components/LoginForm.tsx',
  'features/auth/components/SocialLoginButton.tsx',
];

/**
 * The three surfaces Slice 18 redesigned. Dimension guards apply here; the
 * colour guards above apply to the whole subset.
 */
const EXEMPLARS = [
  'features/auth/components/AuthLayout.tsx',
  'features/auth/components/LoginForm.tsx',
  'app/dashboard/page.tsx',
];

/** Strip block comments — a hex quoted in prose is documentation, not a value. */
function code(path: string): string {
  return readFileSync(join(SRC, path), 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '');
}

/**
 * Third-party logo colours — Google's four and Microsoft's four.
 *
 * The only legitimate literals in the subset. Both marks must render in their
 * own colours, unaltered, in either theme; tokenising them would let a
 * palette change deface someone else's trademark. A token is for a value WE
 * choose, and these are not ours.
 *
 * Microsoft joined the list in Slice 20, when the login redesign added a
 * second social provider.
 */
const BRAND_EXEMPT =
  /#(4285F4|34A853|FBBC05|EA4335|F25022|7FBA00|00A4EF|FFB900)\b/gi;

const HEX = /#[0-9a-fA-F]{3,8}\b/g;
const RGBA = /rgba?\(\s*[0-9]/g;
const TAILWIND_PALETTE =
  /(?<![-\w[])(?:text|bg|border|from|to|via|ring|divide|placeholder|outline|shadow|accent|fill|stroke)-(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose|white|black)(?:-[0-9]{2,3})?(?![-\w])/g;

describe('propagation — literal visual values', () => {
  /**
   * Test 12, by all three methods.
   *
   * The third is the honest one. `text-emerald-500` is exactly as hardcoded
   * as #12B76A: it does not move in dark mode, it cannot be themed, and a
   * palette change never reaches it. Counting only hexes made the codebase
   * look four times cleaner than it was.
   */
  for (const [label, pattern] of [
    ['hex', HEX],
    ['rgb/rgba', RGBA],
    ['tailwind palette classes', TAILWIND_PALETTE],
  ] as const) {
    it(`has zero ${label} in the propagation subset`, () => {
      const offenders: string[] = [];
      for (const path of SUBSET) {
        const found = code(path).replace(BRAND_EXEMPT, '').match(pattern);
        if (found) offenders.push(`${path}: ${found.join(' ')}`);
      }
      expect(offenders).toEqual([]);
    });
  }

  it('exempts only third-party logos, and only where the exemption is documented', () => {
    /*
      Every file carrying an exempt hex must SAY why, in the file. The
      exemption is not a blanket permission — it is a claim about specific
      trademarks, and a reader who finds #4285F4 with no explanation cannot
      tell it from an ordinary literal that slipped through.
    */
    const carriers = SUBSET.filter((p) => {
      BRAND_EXEMPT.lastIndex = 0;
      return BRAND_EXEMPT.test(code(p));
    });
    expect(carriers.length).toBeGreaterThan(0);

    const undocumented = carriers.filter(
      (p) => !readFileSync(join(SRC, p), 'utf8').includes('BRAND-EXEMPT'),
    );
    expect(undocumented).toEqual([]);
  });
});

describe('propagation — one status system', () => {
  /** Test 14: assert the second system no longer exists. */
  it('has no StatusPill component anywhere', () => {
    const walk = (dir: string): string[] =>
      readdirSync(dir).flatMap((entry) => {
        const full = join(dir, entry);
        if (entry === 'node_modules' || entry === '.next') return [];
        return statSync(full).isDirectory() ? walk(full) : [full];
      });

    // No file named for it.
    const pills = walk(SRC).filter((f) => /StatusPill/.test(f));
    expect(pills).toEqual([]);

    // And nothing imports or renders it. Comments are stripped first: this
    // spec and StatusBadge's docblock both discuss the deleted component by
    // name, which is documentation, not a second system.
    const importers = walk(SRC)
      .filter((f) => /\.tsx?$/.test(f))
      .filter((f) => !f.endsWith('propagation.spec.ts'))
      .filter((f) =>
        /StatusPill/.test(
          readFileSync(f, 'utf8')
            .replace(/\/\*[\s\S]*?\*\//g, '')
            .replace(/^\s*\/\/.*$/gm, ''),
        ),
      );
    expect(importers).toEqual([]);
  });

  /**
   * Test 14, continued: TONE_STYLES is the one palette, and it resolves
   * through the measured tokens rather than eyeballed rgba.
   */
  it('routes every tone through a measured --status-* token', () => {
    for (const [tone, style] of Object.entries(TONE_STYLES)) {
      expect(style.fg, `${tone}.fg`).toMatch(/^var\(--status-[a-z]+-fg\)$/);
      expect(style.bg, `${tone}.bg`).toMatch(/^var\(--status-[a-z]+-bg\)$/);
      // Borders are derived from the foreground, never a second literal.
      expect(style.border, `${tone}.border`).toMatch(
        /^color-mix\(in srgb, var\(--status-[a-z]+-fg\) \d+%, transparent\)$/,
      );
    }
  });

  /**
   * The measured pairs, with the figures Slice 12 recorded. If someone
   * changes a token value, this does not re-measure it — but it does pin the
   * exact colours those measurements were taken against, so a silent edit
   * cannot keep the documented contrast claim while changing the colour.
   */
  it('pins the colours the contrast figures were measured against', () => {
    const measured: Record<string, [string, string, number]> = {
      expired: ['#B42318', '#FEF3F2', 6.05],
      critical: ['#B54708', '#FFFAEB', 5.2],
      soon: ['#3538CD', '#EEF4FF', 7.32],
      current: ['#067647', '#ECFDF3', 5.4],
      gap: ['#6941C6', '#F4F3FF', 6.02],
      neutral: ['#475467', '#F9FAFB', 7.36],
    };

    for (const [name, [fg, bg, ratio]] of Object.entries(measured)) {
      expect(CSS, `${name} fg`).toMatch(
        new RegExp(`--status-${name}-fg:\\s*${fg}\\b`, 'i'),
      );
      expect(CSS, `${name} bg`).toMatch(
        new RegExp(`--status-${name}-bg:\\s*${bg}\\b`, 'i'),
      );
      expect(ratio, `${name} must pass AA`).toBeGreaterThanOrEqual(4.5);
    }
  });

  /** Test 15: colour is never the only carrier. */
  it('renders a text label alongside every status colour', () => {
    const badge = code('features/compliance/components/StatusBadge.tsx');
    // The label is interpolated, and the dot is explicitly hidden from AT.
    expect(badge).toContain('{label}');
    expect(badge).toMatch(/aria-hidden="true"/);
    // The dot must not be the only child.
    expect(badge.indexOf('{label}')).toBeGreaterThan(badge.indexOf('aria-hidden'));
  });
});

describe('propagation — craft floor asserted over the stylesheet', () => {
  /**
   * Test 18, and the pre-work 5 substitute.
   *
   * `Emulation.setEmulatedMedia` is outside the CDP allowlist, so neither
   * prefers-reduced-motion nor pointer:coarse could be triggered in the
   * headless browser. Reading the CSS and saying "looks right" is not a
   * check — it passes even when the block has been deleted. This is.
   */
  it('honours prefers-reduced-motion, and covers the global hover transform', () => {
    const block = CSS.match(
      /@media \(prefers-reduced-motion: reduce\)\s*\{[\s\S]*?\n\}/,
    );
    expect(block, 'reduced-motion block is missing').not.toBeNull();

    const rules = block![0];
    expect(rules).toMatch(/animation-duration:\s*0\.01ms\s*!important/);
    expect(rules).toMatch(/transition-duration:\s*0\.01ms\s*!important/);

    /*
      Non-vacuousness, re-pointed in Slice 17.

      Slice 14 named `button:hover { transform: translateY(-1px) }`, which was
      correct then and is meaningless now — Slice 17 deleted that transform,
      and asserting the neutralisation of something that does not exist always
      passes. The still-live transforms are the card lifts on the legacy
      contract screens, so the assertion moves to those.

      The first expectation is the load-bearing one: it proves a transform
      that reduced motion must neutralise genuinely EXISTS in the stylesheet.
      If someone removes the card lifts too, this fails and whoever does it
      has to re-point the test at whatever transform is live then.
    */
    expect(CSS).toMatch(/\.(card-hover|onyx-card):hover\s*\{[^}]*transform:\s*translateY/);
    expect(rules).toMatch(/transform:\s*none\s*!important/);
    expect(rules).toMatch(/\.card-hover:hover/);
    expect(rules).toMatch(/\.onyx-card:hover/);

    // And the transform this slice removed must stay removed: a rule outside
    // a comment that lifts every button on hover.
    const withoutComments = CSS.replace(/\/\*[\s\S]*?\*\//g, '');
    expect(withoutComments).not.toMatch(/button:hover:not\(:disabled\)\s*\{\s*transform/);
  });

  /**
   * The stylesheet must actually PARSE.
   *
   * Added in Slice 17 after every test in this file passed against a
   * globals.css that PostCSS refused to load — five orphaned closing braces,
   * left behind when a regex removed some `@keyframes` blocks. The whole app
   * rendered a 500 and the suite was green, because every assertion here
   * reads the file as text.
   *
   * Balanced braces is not a full CSS parse, but it is the failure that
   * actually happened and it is free.
   */
  it('has balanced braces — the stylesheet must load at all', () => {
    let depth = 0;
    let firstUnbalanced: number | null = null;
    let line = 1;

    for (const ch of CSS) {
      if (ch === '\n') line += 1;
      if (ch === '{') depth += 1;
      if (ch === '}') {
        depth -= 1;
        if (depth < 0 && firstUnbalanced === null) firstUnbalanced = line;
      }
    }

    expect({ depth, firstUnbalanced }).toEqual({ depth: 0, firstUnbalanced: null });
  });

  it('the brace check is not vacuous', () => {
    const broken = 'a { color: red; }\n}\n';
    let depth = 0;
    for (const ch of broken) {
      if (ch === '{') depth += 1;
      if (ch === '}') depth -= 1;
    }
    expect(depth).toBe(-1);
  });

  // ── 8 ────────────────────────────────────────────────────────────────────
  it('defines no @keyframes that nothing consumes', () => {
    const css = CSS.replace(/\/\*[\s\S]*?\*\//g, '');
    const defined = [...css.matchAll(/@keyframes\s+([\w-]+)/g)].map((m) => m[1]);
    expect(defined.length).toBeGreaterThan(0);

    const componentSource = SUBSET.map((f) => {
      try {
        return code(f);
      } catch {
        return '';
      }
    }).join('\n');

    const orphans = defined.filter((name) => {
      // Consumed either by a rule in the stylesheet that is itself used, or
      // directly by a component class.
      const usedInCss = new RegExp(
        `animation:[^;]*\\b${name}\\b`,
      ).test(css.replace(new RegExp(`@keyframes\\s+${name}[\\s\\S]*?\\n\\}`), ''));
      const utility = new RegExp(`\\.(animate-)?${name}\\b`);
      const usedInComponents = utility.test(componentSource);
      return !usedInCss && !usedInComponents;
    });

    expect(orphans).toEqual([]);
  });

  // ── 9 ────────────────────────────────────────────────────────────────────
  it('declares no `transition: all`', () => {
    // `all` animates layout properties nobody intended — a width or margin
    // changing for an unrelated reason gets animated too.
    const css = CSS.replace(/\/\*[\s\S]*?\*\//g, '');
    expect(css).not.toMatch(/transition:\s*all\b/);

    // Non-vacuous: the pattern must be able to match.
    expect(/transition:\s*all\b/.test('transition: all 250ms ease;')).toBe(true);
  });

  // ── 7 ────────────────────────────────────────────────────────────────────
  it('resolves one focus ring token, at full strength', () => {
    const css = CSS.replace(/\/\*[\s\S]*?\*\//g, '');
    expect(css).toMatch(/:focus-visible\s*\{[^}]*outline:\s*var\(--focus-width\)\s+solid\s+var\(--ring\)/);
    // The base reset must not tint outline-color on every element, which is
    // what made the shell ring resolve at half alpha before Slice 17.
    expect(css).not.toMatch(/outline-ring/);
  });

  it('gives coarse pointers a 44px target on the filter chips', () => {
    const block = CSS.match(/@media \(pointer: coarse\)\s*\{[\s\S]*?\n\}/);
    expect(block, 'coarse-pointer block is missing').not.toBeNull();
    expect(block![0]).toMatch(/min-height:\s*44px/);
    expect(block![0]).toMatch(/\.chip/);
  });

  // ── 14 ───────────────────────────────────────────────────────────────────
  it('routes every Slice 16 transition through a motion token', () => {
    /*
      Start AFTER the section's header comment closes, then strip any
      remaining comments.

      Slicing at the marker itself starts mid-comment, so the stripper has no
      opening `/*` to match and the whole docblock survives — including the
      sentence describing the durations this section replaced ("between 80ms
      and 300ms"), which an earlier version of this test then reported as a
      hardcoded value.
    */
    const marker = CSS.indexOf('Slice 16 · Motion');
    const block = CSS.slice(CSS.indexOf('*/', marker) + 2).replace(
      /\/\*[\s\S]*?\*\//g,
      '',
    );

    for (const token of [
      '--motion-fast',
      '--motion-normal',
      '--motion-slow',
      '--motion-ease',
    ]) {
      expect(block, token).toContain(`${token}:`);
    }

    // Every animation/transition in the motion block must reference a token,
    // never a literal duration. A hardcoded 200ms is a value nobody can tune.
    const declarations = [...block.matchAll(/(?:animation|transition):[^;]+;/g)].map(
      (m) => m[0],
    );
    expect(declarations.length).toBeGreaterThan(0);

    const literals = declarations.filter(
      (d) => /\b\d+m?s\b/.test(d) && !/none\s*!important/.test(d),
    );
    expect(literals).toEqual([]);
  });

  // ── 15 ───────────────────────────────────────────────────────────────────
  /**
   * Reduced motion must neutralise each new transition BY NAME.
   *
   * A blanket duration-zeroing block is not enough and this test says why:
   * `motion-enter` animates a translateY, so a rule that only zeroes
   * durations leaves a transform running. The assertions below fail if the
   * named neutralisation is removed even while the Slice 14 blanket rule
   * remains.
   */
  it('neutralises every named Slice 16 transition under reduced motion', () => {
    const blocks = [...CSS.matchAll(/@media \(prefers-reduced-motion: reduce\)\s*\{[\s\S]*?\n\}/g)]
      .map((m) => m[0])
      .join('\n');

    expect(blocks).not.toBe('');

    for (const name of ['.motion-enter', '.motion-fade', '.motion-status', '.motion-disclosure']) {
      expect(blocks, name).toContain(name);
    }
    expect(blocks).toMatch(/animation:\s*none\s*!important/);
    expect(blocks).toMatch(/transition:\s*none\s*!important/);
    // The disclosure animates grid-template-rows; zeroing a duration would
    // leave it collapsed rather than open.
    expect(blocks).toMatch(/grid-template-rows:\s*1fr\s*!important/);
  });

  it('the motion guards are not vacuous', () => {
    // A literal duration must be detectable.
    expect(/\b\d+m?s\b/.test('transition: opacity 200ms ease;')).toBe(true);
    // A tokenised one must not be.
    expect(/\b\d+m?s\b/.test('transition: opacity var(--motion-fast) var(--motion-ease);')).toBe(false);
  });

  it('defines a non-default focus ring rather than relying on the UA default', () => {
    expect(CSS).toMatch(/:focus-visible\s*\{[^}]*outline:\s*var\(--focus-width\)/);
    expect(CSS).toMatch(/--focus-width:\s*\d+px/);
    expect(CSS).toMatch(/outline-offset:\s*var\(--focus-offset\)/);
  });

  /**
   * Non-vacuousness for the whole file: every guard above must fail if the
   * thing it guards is removed. This proves the detectors match real strings
   * rather than passing on absence.
   */
  it('the detectors are not vacuous', () => {
    expect('#B42318'.match(HEX)).not.toBeNull();
    expect('rgba(220,38,38,0.08)'.match(RGBA)).not.toBeNull();
    expect('text-emerald-500'.match(TAILWIND_PALETTE)).not.toBeNull();
    expect('bg-white'.match(TAILWIND_PALETTE)).not.toBeNull();

    // And must NOT fire on the token forms that replaced them.
    expect('bg-[var(--surface)]'.match(TAILWIND_PALETTE)).toBeNull();
    expect('var(--status-expired-fg)'.match(HEX)).toBeNull();
    expect('color-mix(in srgb, var(--primary) 7%, transparent)'.match(RGBA)).toBeNull();
  });
});

// ── Contrast ────────────────────────────────────────────────────────────────

function rgb(hex: string): [number, number, number] {
  let h = hex.replace('#', '').trim();
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ];
}

function luminance(hex: string): number {
  const f = (v: number) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  const [r, g, b] = rgb(hex).map(f) as [number, number, number];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return Math.round(((hi + 0.05) / (lo + 0.05)) * 100) / 100;
}

/** White at an alpha, composited over an opaque base. */
function scrimOver(base: string, alpha: number): string {
  const [r, g, b] = rgb(base);
  const mix = (c: number) => Math.round(255 * alpha + c * (1 - alpha));
  return `#${[mix(r), mix(g), mix(b)]
    .map((v) => v.toString(16).padStart(2, '0'))
    .join('')}`;
}

/** Read a custom property's literal value out of globals.css. */
function token(name: string): string {
  const m = CSS.match(new RegExp(`${name}:\\s*(#[0-9a-fA-F]{3,8})\\s*;`));
  if (!m) throw new Error(`token ${name} not found as a literal in globals.css`);
  return m[1];
}

// ── 1. Dimension literals ───────────────────────────────────────────────────

/**
 * px/em written at the call site. Excludes the SVG geometry props on the
 * mark and lucide's `size={n}`, which are drawing coordinates in a viewBox,
 * not CSS values a token could carry.
 */
const PX = /(?<![\w-])[0-9]+(?:\.[0-9]+)?px(?![\w-])/g;
const EM = /(?<![\w-])-?[0-9]*\.?[0-9]+em(?![\w-])/g;

describe('slice 18 — dimension literals', () => {
  for (const path of EXEMPLARS) {
    it(`${path} writes no px literal`, () => {
      expect(code(path).match(PX) ?? []).toEqual([]);
    });
    it(`${path} writes no em literal`, () => {
      expect(code(path).match(EM) ?? []).toEqual([]);
    });
  }

  /**
   * Counted per SCREEN, not per file.
   *
   * The first version of this test counted each file separately and passed
   * while the login screen was actually rendering six sizes, because
   * AuthLayout and LoginForm each stayed under the cap on their own. A
   * budget that a screen can exceed by being split across two files is not
   * a budget.
   */
  const SCREENS = {
    login: ['features/auth/components/AuthLayout.tsx', 'features/auth/components/LoginForm.tsx'],
    dashboard: ['app/dashboard/page.tsx'],
  };

  it('each exemplar SCREEN renders at most five distinct type sizes', () => {
    for (const [screen, paths] of Object.entries(SCREENS)) {
      /* Normalise: `text-3xl` and `var(--text-3xl)` are the same step
         written two ways, and counting them separately would flag a screen
         that is actually within budget. */
      const sizes = new Set(
        (paths.map(code).join('\n').match(/var\(--text-[a-z0-9]+\)|text-(?:2xs|xs|sm|base|lg|xl|2xl|3xl)\b|text-display-[a-z0-9]+/g) ?? [])
          .map((s) =>
            s.startsWith('text-display-')
              ? s.replace('text-', '')
              : s.replace(/^var\(--text-|^text-/, '').replace(/\)$/, ''),
          ),
      );
      expect(
        sizes.size,
        `${screen} uses ${[...sizes].sort().join(', ')}`,
      ).toBeLessThanOrEqual(5);
    }
  });
});

// ── 2. Status pairs re-measured against the Slice 18 surfaces ───────────────

const STATUS = ['expired', 'critical', 'soon', 'current', 'gap', 'neutral'] as const;

/**
 * The three surface steps Slice 18 reduced the ramp to, READ FROM THE
 * STYLESHEET rather than restated here.
 *
 * The first version of this file hardcoded the three hexes, which made every
 * status-pair assertion below measure the test's own constants instead of the
 * product's palette: darkening --surface-sunken in globals.css to a value
 * that genuinely broke AA left all eighteen assertions green. A contrast test
 * that cannot see a palette change is decoration.
 */
const SURFACE_NAMES = ['--surface', '--background', '--surface-sunken'] as const;
const SURFACES: Record<string, string> = Object.fromEntries(
  SURFACE_NAMES.map((n) => [n, token(n)]),
);

/** The values the published figures were measured against. */
const SURFACES_AS_MEASURED = {
  '--surface': '#FFFFFF',
  '--background': '#FDF9F3',
  '--surface-sunken': '#F8F4EE',
};

describe('slice 18 — status pairs survive the warm re-temper', () => {
  it('every surface token still holds the value these figures assume', () => {
    for (const [name, hex] of Object.entries(SURFACES_AS_MEASURED)) {
      expect(token(name).toUpperCase(), name).toBe(hex);
    }
  });

  for (const s of STATUS) {
    for (const [surfaceName, surface] of Object.entries(SURFACES)) {
      it(`${s} foreground is AA on ${surfaceName}`, () => {
        expect(contrast(token(`--status-${s}-fg`), surface)).toBeGreaterThanOrEqual(4.5);
      });
    }
    it(`${s} foreground is AA on its own background`, () => {
      expect(
        contrast(token(`--status-${s}-fg`), token(`--status-${s}-bg`)),
      ).toBeGreaterThanOrEqual(4.5);
    });
  }

  /**
   * The re-temper was luminance-matched on purpose. If someone later edits a
   * surface "just a shade", this catches the status pair it costs.
   */
  it('the worst status pair is no worse than before the re-temper (4.95)', () => {
    const worst = Math.min(
      ...STATUS.flatMap((s) =>
        Object.values(SURFACES).map((surf) => contrast(token(`--status-${s}-fg`), surf)),
      ),
    );
    expect(worst).toBeGreaterThanOrEqual(4.95);
  });
});

// ── 3. The ink panel ────────────────────────────────────────────────────────

describe('slice 18 — the login ink panel', () => {
  /**
   * The defect this slice fixed. --scrim-soft carries the 12px copyright
   * line. On the old indigo it measured 2.80:1 — under AA text (4.5) and
   * under the 3.0 large-text floor, and 12px is not large text.
   */
  it('--scrim-soft is AA for small text on --ink', () => {
    const ink = token('--ink');
    expect(contrast(scrimOver(ink, 0.45), ink)).toBeGreaterThanOrEqual(4.5);
  });

  it('--scrim-medium and --scrim-strong are AA on --ink', () => {
    const ink = token('--ink');
    expect(contrast(scrimOver(ink, 0.7), ink)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(scrimOver(ink, 0.82), ink)).toBeGreaterThanOrEqual(4.5);
  });

  it('would FAIL on the old flat indigo — the fix is the panel, not a patch', () => {
    expect(contrast(scrimOver('#3D35D3', 0.45), '#3D35D3')).toBeLessThan(4.5);
  });

  /**
   * The strip marks the due month with white, not a hue, because indigo on
   * ink measures 2.33:1 and every status colour would either be illegible or
   * collide with a meaning it does not have here.
   */
  it('the accent is not legible on ink, which is why the strip uses white', () => {
    const ink = token('--ink');
    expect(contrast(token('--primary'), ink)).toBeLessThan(3);
    expect(contrast('#FFFFFF', ink)).toBeGreaterThanOrEqual(4.5);
  });

  it('--ink and --ink-raised are a depth step, not a boundary', () => {
    const step = contrast(token('--ink'), token('--ink-raised'));
    expect(step).toBeGreaterThan(1);
    expect(step).toBeLessThan(1.5);
  });
});

// ── 4. Reduced motion, named ────────────────────────────────────────────────

describe('slice 18 — reduced motion names every exemplar animation', () => {
  const reduced = CSS.split('@media (prefers-reduced-motion: reduce)')
    .slice(1)
    .join('\n');

  /**
   * The blanket rule zeroes every duration, so a test that only checked
   * "durations are zero" would pass without any of these being named. Each
   * class the exemplars actually use has to appear by name.
   */
  for (const cls of ['animate-fade-up', 'animate-pulse', 'transition-colors', 'transition-opacity']) {
    it(`names .${cls}`, () => {
      expect(reduced).toContain(`.${cls}`);
    });
  }

  it('neutralises them with animation/transition none, not only a zero duration', () => {
    expect(reduced).toMatch(/\.animate-fade-up\s*\{[^}]*animation:\s*none/);
    expect(reduced).toMatch(/\.animate-pulse\s*\{[^}]*animation:\s*none/);
    expect(reduced).toMatch(/transition:\s*none/);
  });

  /**
   * The deliberate exception. Freezing the submit spinner does not reduce
   * motion, it removes the only feedback the submitting state has.
   */
  it('keeps the submit spinner turning, deliberately and in writing', () => {
    expect(reduced).toMatch(/\.animate-spin\s*\{[^}]*animation-iteration-count:\s*infinite/);
    expect(CSS).toMatch(/vestibular/);
  });
});

// ── 5. Focus ────────────────────────────────────────────────────────────────

describe('slice 18 — one focus ring', () => {
  /**
   * `input:focus { outline: none }` is specificity (0,1,1) and beat the
   * (0,1,0) :focus-visible rule, so every input in the product had no
   * keyboard ring at all. The suppression must be conditioned on
   * :not(:focus-visible) or the ring never lands.
   */
  it('suppresses the outline only when focus did not come from the keyboard', () => {
    expect(CSS).toMatch(/input:focus:not\(:focus-visible\)/);
    const blanket = CSS.match(/(?<!:not\(:focus-visible\)\))\binput:focus,\s*\n\s*textarea:focus,\s*\n\s*select:focus\s*\{([^}]*)\}/);
    expect(blanket, 'the input:focus block should exist').toBeTruthy();
    expect(blanket![1]).not.toMatch(/outline:\s*none/);
  });

  it('still defines the global :focus-visible ring', () => {
    expect(CSS).toMatch(/:focus-visible\s*\{[^}]*outline:\s*var\(--focus-width\)\s+solid\s+var\(--ring\)/);
  });

  it('the focus ring meets the 3:1 non-text floor on every surface', () => {
    for (const surface of Object.values(SURFACES)) {
      expect(contrast(token('--ring'), surface)).toBeGreaterThanOrEqual(3);
    }
  });
});

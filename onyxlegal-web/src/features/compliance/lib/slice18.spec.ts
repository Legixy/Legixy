import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

/**
 * Slice 18 guards — the visual direction.
 *
 * WHY A SECOND SPEC AND NOT MORE OF propagation.spec.ts
 * -----------------------------------------------------
 * propagation.spec.ts guards the SUBSET against three patterns: hex, rgba,
 * and Tailwind palette classes. It does not look at dimensions, and that gap
 * is why the login could sit inside the subset, pass every literal test, and
 * still carry 45 dimension literals — ten distinct type sizes, six of which
 * (14, 16, 17, 19, 26, 42px) do not exist anywhere in the eight-step ramp.
 *
 * "Zero literal visual values" was true of colour and silent about size.
 */

const SRC = resolve(__dirname, '../../..');
const CSS = readFileSync(join(SRC, 'app/globals.css'), 'utf8');

/** The two exemplars, and only the two. Slice 18 did not propagate. */
const EXEMPLARS = [
  'features/auth/components/AuthLayout.tsx',
  'features/auth/components/LoginForm.tsx',
  'app/dashboard/page.tsx',
];

function code(path: string): string {
  return readFileSync(join(SRC, path), 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, '')
    .replace(/^\s*\/\/.*$/gm, '');
}

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

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';
import { findHonestyViolations } from './honesty';

/**
 * The other half of the honesty guarantee.
 *
 * honesty.spec.ts covers strings that were centralised on purpose. This one
 * covers the rest: it reads the SOURCE of every compliance surface and checks
 * the literal text a user could actually see.
 *
 * That matters because centralising copy is a convention, and conventions get
 * skipped. The landing page's "OnyxAI has analyzed your portfolio" lived
 * inline in JSX for eight slices precisely because nothing scanned JSX.
 *
 * There is no DOM in this suite (vitest runs in node, and the project
 * deliberately has no jsdom or testing-library), so this is a static scan of
 * user-visible text rather than a render. Real rendered output is checked in
 * browser QA. The two together cover what neither does alone.
 */

const ROOT = join(__dirname, '..', '..', '..');

/** Surfaces the compliance product actually navigates to. */
const SURFACES = [
  // Signed-out surfaces count. The login screen is the FIRST thing a client
  // sees, and it shipped "AI-powered legal analysis built for Indian founders"
  // in a Saudi compliance product — missed by the first version of this scan
  // because the list started at /dashboard.
  'app/layout.tsx',
  'app/login',
  'app/register',
  /*
    Accepting an invitation is a signed-out surface too, and the first thing a
    NEW COLLEAGUE ever sees of this product. Slice 22's lesson was that a
    boundary which stops at the screens you happen to remember is the failure
    mode — this was added with the feature, not after it.
  */
  'app/invite',
  'features/auth',
  'app/dashboard/page.tsx',
  'app/dashboard/sites',
  'app/dashboard/licenses',
  'app/dashboard/gaps',
  'app/dashboard/requirements',
  'app/dashboard/preferences',
  'features/compliance',
  // The whole shell, not two named files. Slice 14 added PageHeader.tsx and
  // LegixyMark.tsx here; naming files individually meant a new shared
  // component was unscanned until someone remembered to add it, which is the
  // same failure mode that let the landing page lie for eight slices.
  'shared/components',
];

function collect(target: string): string[] {
  const full = join(ROOT, target);
  const stat = statSync(full);
  if (stat.isFile()) return [full];
  return readdirSync(full).flatMap((entry) => {
    const child = join(full, entry);
    if (statSync(child).isDirectory()) return collect(join(target, entry));
    return /\.tsx?$/.test(entry) && !/\.spec\.tsx?$/.test(entry) ? [child] : [];
  });
}

/**
 * Text a user could read: JSX text nodes and quoted string literals.
 *
 * Comments are excluded deliberately. This file and honesty.ts both discuss
 * the very phrases being banned, and a scan that flagged its own explanation
 * would be unusable.
 */
function visibleText(source: string): string[] {
  const withoutComments = source
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .replace(/^\s*\/\/.*$/gm, ' ');

  const strings = [...withoutComments.matchAll(/'([^'\\\n]{4,})'/g)].map(
    (m) => m[1],
  );
  const doubles = [...withoutComments.matchAll(/"([^"\\\n]{4,})"/g)].map(
    (m) => m[1],
  );
  /*
    JSX text between tags.

    THIS MISSED MULTI-LINE TEXT UNTIL SLICE 24, WHICH IS MOST OF IT.

    The character class used to be `[^<>{}\n]` — excluding newlines — so it
    only matched text whose opening tag, content and closing tag were on ONE
    line. Prettier puts JSX text on its own line whenever the element has more
    than a trivial attribute list, which is the majority of this codebase. A
    heading reading "Join your team and stay compliant" was extracted as
    nothing at all, and the surface scan passed on it.

    Found by planting that exact string as a negative control and watching the
    guard NOT fail. Newlines are allowed now and the result is whitespace-
    collapsed; `<` and `>` are still excluded, so a match can never cross a
    tag boundary.
  */
  const jsxText = [...withoutComments.matchAll(/>\s*([A-Za-z][^<>{}]{3,}?)\s*</g)]
    .map((m) => m[1].replace(/\s+/g, ' ').trim());

  return [...strings, ...doubles, ...jsxText];
}

const FILES = SURFACES.flatMap(collect);

describe('honesty guarantee — compliance surfaces', () => {
  it('finds the surfaces it claims to scan', () => {
    // A path typo would silently make this suite scan nothing.
    expect(FILES.length).toBeGreaterThan(10);
    expect(
      FILES.some((f) => f.endsWith(join('app', 'dashboard', 'page.tsx'))),
    ).toBe(true);
  });

  it.each(FILES.map((f) => [relative(ROOT, f), f]))(
    '%s says nothing untrue',
    (_label, file) => {
      const offenders = visibleText(readFileSync(file, 'utf8'))
        .flatMap((text) => findHonestyViolations(text))
        // Class names and CSS values are not prose.
        .filter((v) => !/^[a-z-]+(\s[a-z-]+)*$/.test(v.text));

      expect(offenders).toEqual([]);
    },
  );

  it('would catch a violation if one were introduced', () => {
    // Proves the extractor actually reaches JSX text and string literals,
    // rather than passing because it parses nothing.
    const planted = `
      const label = 'OnyxAI has analyzed your portfolio';
      const price = "Total: ₹5000";
      export const C = () => <p>Monitoring 3 active contracts for liabilities.</p>;
    `;
    const found = visibleText(planted).flatMap(findHonestyViolations);
    const rules = new Set(found.map((v) => v.rule));

    expect(rules.has('no AI claim')).toBe(true);
    expect(rules.has('SAR only')).toBe(true);
    expect(rules.has('no contract-analysis language')).toBe(true);
  });
});

describe('contract surface is unreachable from compliance navigation', () => {
  const NAV_FILES = [
    join(ROOT, 'shared', 'components', 'Sidebar.tsx'),
    join(ROOT, 'shared', 'components', 'Header.tsx'),
  ];

  const CONTRACT_ROUTES = [
    '/dashboard/contracts',
    '/dashboard/analytics',
    '/dashboard/templates',
  ];

  it.each(NAV_FILES.map((f) => [relative(ROOT, f), f]))(
    '%s links to no contract route',
    (_label, file) => {
      const source = readFileSync(file, 'utf8')
        .replace(/\/\*[\s\S]*?\*\//g, ' ')
        .replace(/^\s*\/\/.*$/gm, ' ');

      const found = CONTRACT_ROUTES.filter((route) => source.includes(route));
      expect(found).toEqual([]);
    },
  );

  it('the compliance nav offers only compliance destinations', () => {
    const sidebar = readFileSync(
      join(ROOT, 'shared', 'components', 'Sidebar.tsx'),
      'utf8',
    );
    const navBlock = sidebar.slice(
      sidebar.indexOf('const navItems'),
      sidebar.indexOf('];', sidebar.indexOf('const navItems')),
    );
    const hrefs = [...navBlock.matchAll(/href:\s*'([^']+)'/g)].map((m) => m[1]);

    expect(hrefs).toEqual([
      '/dashboard',
      '/dashboard/sites',
      '/dashboard/licenses',
      // The shape of the year — a question a list cannot answer.
      '/dashboard/year-ahead',
      '/dashboard/gaps',
      // Requirements: what makes the gaps page mean anything at all.
      '/dashboard/requirements',
      // Where reminders go: added in Slice 16. The client's requirement is
      // that nothing expires without him KNOWING, and knowing means it
      // reaches him — so the address it reaches has to be visible.
      '/dashboard/delivery',
    ]);
  });

  it('the dashboard links nowhere near the contract feature', () => {
    const page = readFileSync(join(ROOT, 'app', 'dashboard', 'page.tsx'), 'utf8');
    for (const route of CONTRACT_ROUTES) {
      expect({ route, present: page.includes(route) }).toEqual({
        route,
        present: false,
      });
    }
  });
});

describe('removed features leave no trace in the UI', () => {
  const SURFACE_FILES = [
    join(ROOT, 'app', 'dashboard', 'preferences', 'page.tsx'),
    join(ROOT, 'shared', 'components', 'Sidebar.tsx'),
    join(ROOT, 'app', 'dashboard', 'page.tsx'),
  ];

  it.each(SURFACE_FILES.map((f) => [relative(ROOT, f), f]))(
    '%s renders no AI usage, plan tier or upgrade affordance',
    (_label, file) => {
      // There is no AI in this product and no billing. Slice 8 removed two
      // preferences panels for the same reason; a token meter reading
      // "0 / 5,000" and a "Free Plan / Upgrade" pair survived that sweep.
      const visible = visibleText(readFileSync(file, 'utf8'));
      const banned = [
        /AI Token Usage/i,
        /% of monthly limit/i,
        /Upgrade to Pro/i,
        /^Upgrade$/i,
        /^Free Plan$/i,
      ];
      const offenders = visible.filter((text) =>
        banned.some((pattern) => pattern.test(text)),
      );
      expect(offenders).toEqual([]);
    },
  );

  it('would catch a plan tier if one were reintroduced', () => {
    // Non-vacuousness for this scan specifically.
    const planted = `const x = 'AI Token Usage'; const y = 'Upgrade to Pro';`;
    const visible = visibleText(planted);
    expect(visible.some((t) => /AI Token Usage/i.test(t))).toBe(true);
    expect(visible.some((t) => /Upgrade to Pro/i.test(t))).toBe(true);
  });
});
